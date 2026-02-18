const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'prefixes.json');

// ── Load ──────────────────────────────────────────────────────────────────────
function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

// ── Save ──────────────────────────────────────────────────────────────────────
function save(data) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[PrefixManager] Failed to save:', e.message);
  }
}

// In-memory cache — loaded once at startup, kept in sync on every write
let _cache = load();

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Get the prefix for a guild.
 * Falls back to DEFAULT_PREFIX env var, then '!'.
 */
function getPrefix(guildId) {
  return _cache[guildId] ?? process.env.DEFAULT_PREFIX ?? '!';
}

/**
 * Set the prefix for a guild and persist to disk.
 */
function setPrefix(guildId, prefix) {
  _cache[guildId] = prefix;
  save(_cache);
}

/**
 * Reset a guild to the default prefix.
 */
function resetPrefix(guildId) {
  delete _cache[guildId];
  save(_cache);
}

module.exports = { getPrefix, setPrefix, resetPrefix };
