/**
 * YouTubeClient — powered by yt-dlp
 *
 * Why yt-dlp instead of youtubei.js directly?
 * YouTube's bot-detection (poToken / BotGuard) is actively enforced on server
 * IPs and breaks every anonymous youtubei.js client (WEB, ANDROID, TV_EMBEDDED)
 * with rotating errors: "No valid URL to decipher", "Unavailable", "403", timeouts.
 * yt-dlp is maintained daily specifically to defeat these measures and is the
 * backend used by virtually every production music bot / downloader.
 *
 * We spawn yt-dlp as a child process piped through ffmpeg — same as before,
 * just using yt-dlp to get the audio stream URL instead of youtubei.js.
 */

const { spawn } = require('child_process');
const { Readable } = require('stream');

// ─── yt-dlp helpers ──────────────────────────────────────────────────────────

/**
 * Run yt-dlp and return its stdout as a string.
 */
function ytdlp(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    proc.stdout.on('data', d => (out += d));
    proc.stderr.on('data', d => (err += d));
    proc.on('close', code => {
      if (code === 0) resolve(out.trim());
      else reject(new Error(err.trim() || `yt-dlp exited with code ${code}`));
    });
    proc.on('error', e => reject(new Error(`yt-dlp not found. Run: pip install yt-dlp\n${e.message}`)));
  });
}

// Common yt-dlp flags used in every call
// --no-playlist      — never grab a playlist when a video URL is given
// --no-warnings      — cleaner stderr
// -q                 — quiet (use our own logging)
const BASE_FLAGS = [
  '--no-playlist',
  '--no-warnings',
  '-q',
];

// ─── Public API ───────────────────────────────────────────────────────────────

async function init() {
  // Verify yt-dlp is installed on startup
  try {
    await ytdlp(['--version']);
    console.log('[YouTubeClient] yt-dlp ready.');
  } catch {
    console.error('[YouTubeClient] WARNING: yt-dlp is not installed! Run: pip install yt-dlp');
  }
}

/**
 * Search YouTube and return up to `limit` video results.
 */
async function search(query, limit = 5) {
  const raw = await ytdlp([
    ...BASE_FLAGS,
    `ytsearch${limit}:${query}`,
    '--dump-json',
    '--flat-playlist',
  ]);

  return raw
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try {
        const v = JSON.parse(line);
        return {
          id:        v.id,
          title:     v.title ?? 'Unknown',
          author:    v.uploader ?? v.channel ?? 'Unknown',
          duration:  formatDuration(v.duration),
          thumbnail: v.thumbnail ?? null,
          url:       v.webpage_url ?? `https://www.youtube.com/watch?v=${v.id}`,
        };
      } catch { return null; }
    })
    .filter(Boolean);
}

/**
 * Get metadata for a single video by URL or ID.
 * Returns an object compatible with what play.js expects from basic_info.
 */
async function getVideoInfo(urlOrId) {
  const url = toUrl(urlOrId);
  const raw = await ytdlp([...BASE_FLAGS, url, '--dump-json', '--no-download']);
  const v = JSON.parse(raw);
  // Wrap in { basic_info } shape to stay compatible with play.js
  return {
    basic_info: {
      id:        v.id,
      title:     v.title ?? 'Unknown',
      author:    v.uploader ?? v.channel ?? 'Unknown',
      duration:  v.duration ?? 0,
      thumbnail: v.thumbnail ? [{ url: v.thumbnail }] : [],
    },
  };
}

/**
 * Returns a Node.js Readable that streams audio from yt-dlp's stdout.
 * yt-dlp handles all client selection, poToken workarounds, and retries.
 *
 * Flags:
 *   -f bestaudio          — best audio-only format
 *   -o -                  — write to stdout
 *   --no-part             — don't create .part files
 */
function getStream(urlOrId) {
  const url = toUrl(urlOrId);

  console.log(`[YouTubeClient] Streaming via yt-dlp: ${url}`);

  const proc = spawn('yt-dlp', [
    ...BASE_FLAGS,
    url,
    '-f', 'bestaudio',
    '-o', '-',
    '--no-part',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  // Surface yt-dlp stderr errors (login required, unavailable, etc.)
  let errBuf = '';
  proc.stderr.on('data', d => { errBuf += d; });

  // If yt-dlp exits with error before audio starts, emit error on the stream
  proc.on('close', code => {
    if (code !== 0 && code !== null) {
      const msg = errBuf.trim() || `yt-dlp exited with code ${code}`;
      proc.stdout.destroy(new Error(msg));
    }
  });

  proc.on('error', (e) => {
    proc.stdout.destroy(new Error(`yt-dlp not found — run: pip install yt-dlp\n${e.message}`));
  });

  // Return stdout as the stream — GuildQueue pipes this into ffmpeg stdin
  return Promise.resolve(proc.stdout);
}

/**
 * Fetch all videos from a YouTube playlist URL.
 */
async function getPlaylist(urlOrId) {
  const url = toUrl(urlOrId);
  const titleRaw = await ytdlp([
    ...BASE_FLAGS,
    url,
    '--dump-single-json',
    '--flat-playlist',
  ]).catch(() => '{}');

  const pl = JSON.parse(titleRaw);
  const entries = pl.entries ?? [];

  const videos = entries
    .filter(v => v.id)
    .map(v => ({
      id:        v.id,
      title:     v.title ?? 'Unknown',
      author:    v.uploader ?? v.channel ?? 'Unknown',
      duration:  formatDuration(v.duration),
      thumbnail: v.thumbnail ?? null,
      url:       v.webpage_url ?? `https://www.youtube.com/watch?v=${v.id}`,
    }));

  return { title: pl.title ?? 'Playlist', videos };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function toUrl(urlOrId) {
  if (!urlOrId) return '';
  try {
    new URL(urlOrId);
    return urlOrId; // already a valid URL
  } catch {
    return `https://www.youtube.com/watch?v=${urlOrId}`;
  }
}

function formatDuration(seconds) {
  if (!seconds) return '??:??';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const p = n => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
  } catch {}
  return null;
}

function isYouTubeUrl(str) {
  try {
    const u = new URL(str);
    return u.hostname.includes('youtube.com') || u.hostname === 'youtu.be';
  } catch { return false; }
}

function isPlaylistUrl(str) {
  try { return Boolean(new URL(str).searchParams.get('list')); } catch { return false; }
}

function formatVideo(v) { return v; } // passthrough, already formatted above

module.exports = { init, search, getVideoInfo, getStream, getPlaylist, isYouTubeUrl, isPlaylistUrl, formatVideo };
