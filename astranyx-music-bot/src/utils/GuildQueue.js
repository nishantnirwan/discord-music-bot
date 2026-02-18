const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');
const ffmpegPath  = require('ffmpeg-static');
const { spawn }   = require('child_process');
const yt          = require('./YouTubeClient');
const { nowPlayingEmbed, successEmbed, errorEmbed } = require('./helpers');

class GuildQueue {
  constructor(client, guild, voiceChannel, textChannel) {
    this.client       = client;
    this.guild        = guild;
    this.voiceChannel = voiceChannel;
    this.textChannel  = textChannel;
    this.tracks       = [];
    this.current      = null;
    this.loop         = 0;
    this.volume       = Math.max(0, Math.min(100, parseInt(process.env.DEFAULT_VOLUME, 10) || 50));
    this.paused       = false;
    this.alwaysOn     = process.env.ALWAYS_ON === 'true';
    this.npMessage    = null;
    this._leaveTimer  = null;
    this._playing     = false;
    this._skipping    = false; // guard to prevent double _playNext on skip
    this._ffmpeg      = null;

    this.connection = joinVoiceChannel({
      channelId:      voiceChannel.id,
      guildId:        guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf:       true,
    });

    this.player = createAudioPlayer();
    this.connection.subscribe(this.player);

    this.player.on(AudioPlayerStatus.Idle, () => {
      // Only auto-advance on natural track end.
      // skip() sets _skipping=true before stop() so we ignore the
      // resulting Idle event — skip() calls _playNext() directly.
      if (this._playing && !this._skipping) {
        this._onTrackEnd();
      }
    });

    this.player.on('error', (err) => {
      console.error('[Player Error]', err.message);
      this.textChannel.send({ embeds: [errorEmbed(`Playback error: \`${err.message}\``)] }).catch(() => {});
      this._playing = false;
      this._onTrackEnd();
    });

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch { this.destroy(); }
    });
  }

  addTrack(track) { this.tracks.push(track); }

  async start() {
    if (this._playing) return;
    await this._playNext();
  }

  async _playNext() {
    this._clearLeaveTimer();
    this._playing  = false;
    this._skipping = false;
    this._killFfmpeg();

    if (this.tracks.length === 0) {
      this.current = null;
      if (this.npMessage) { this.npMessage.edit({ components: [] }).catch(() => {}); }
      this.textChannel.send({
        embeds: [successEmbed('Queue finished! Use `/247` to keep me in the channel.')]
      }).catch(() => {});
      if (!this.alwaysOn) {
        this._leaveTimer = setTimeout(() => this.destroy(), 30_000);
      }
      return;
    }

    this.current = this.tracks.shift();
    console.log(`[Queue] Playing: ${this.current.title}`);

    // Snapshot title now — if _playNext() recurses on error, this.current
    // will have changed but we still want to report the failed track's name
    const failedTitle = this.current.title;

    try {
      const ytStream = await yt.getStream(this.current.url);

      // Clamp volume to 0–200 and convert to 0.0–2.0 for ffmpeg
      const vol = Math.max(0, Math.min(200, this.volume)) / 100;
      this._ffmpeg = spawn(ffmpegPath, [
        '-i', 'pipe:0',
        '-af', `volume=${vol}`,
        '-f', 's16le',
        '-ar', '48000',
        '-ac', '2',
        '-vn',
        'pipe:1',
      ], { stdio: ['pipe', 'pipe', 'ignore'] });

      ytStream.pipe(this._ffmpeg.stdin);
      ytStream.on('error', () => { this._ffmpeg?.stdin?.destroy(); });
      this._ffmpeg.stdin.on('error', () => {});
      this._ffmpeg.on('error', (e) => console.error('[FFmpeg spawn error]', e.message));

      const resource = createAudioResource(this._ffmpeg.stdout, {
        inputType: StreamType.Raw,
      });

      this._playing = true;
      this.player.play(resource);

      if (this.npMessage) this.npMessage.delete().catch(() => {});
      this.npMessage = await this.textChannel.send(nowPlayingEmbed(this.current, this)).catch(() => null);

    } catch (err) {
      console.error('[Stream Error]', err.message);
      // Use the snapshotted title — this.current may be null/changed by now
      this.textChannel.send({
        embeds: [errorEmbed(`Skipping **${failedTitle}**: \`${err.message}\``)]
      }).catch(() => {});
      await this._playNext();
    }
  }

  _onTrackEnd() {
    if (this.loop === 1 && this.current) this.tracks.unshift({ ...this.current });
    else if (this.loop === 2 && this.current) this.tracks.push({ ...this.current });
    this._playNext();
  }

  skip() {
    // Loop logic: re-queue current track according to loop mode
    if (this.loop === 1 && this.current) this.tracks.unshift({ ...this.current });
    else if (this.loop === 2 && this.current) this.tracks.push({ ...this.current });

    // Set _skipping BEFORE stop() so the Idle event handler ignores the
    // resulting Idle event and doesn't double-call _playNext()
    this._skipping = true;
    this._playing  = false;
    this._killFfmpeg();
    this.player.stop(true);

    // Advance queue directly
    this._playNext();
  }

  pause() {
    this.player.pause();
    this.paused = true;
    this._updateNpMessage();
  }

  resume() {
    this.player.unpause();
    this.paused = false;
    this._updateNpMessage();
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(100, vol));
    // Takes effect on next track (ffmpeg volume is baked in at stream start)
  }

  setLoop(mode) { this.loop = mode; }

  shuffle() {
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
  }

  isPlaying() { return this._playing && !this.paused; }

  async _updateNpMessage() {
    if (!this.npMessage || !this.current) return;
    try { await this.npMessage.edit(nowPlayingEmbed(this.current, this)); } catch {}
  }

  _killFfmpeg() {
    if (this._ffmpeg) {
      try { this._ffmpeg.kill('SIGKILL'); } catch {}
      this._ffmpeg = null;
    }
  }

  _clearLeaveTimer() {
    if (this._leaveTimer) { clearTimeout(this._leaveTimer); this._leaveTimer = null; }
  }

  destroy() {
    this._clearLeaveTimer();
    this._playing  = false;
    this._skipping = false;
    this._killFfmpeg();
    try { this.player.stop(true); } catch {}
    try { this.connection.destroy(); } catch {}
    if (this.npMessage) this.npMessage.edit({ components: [] }).catch(() => {});
    this.client.queues?.delete(this.guild.id);
  }
}

module.exports = GuildQueue;