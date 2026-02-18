const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getPrefix } = require('../utils/prefixManager');
const { errorEmbed, successEmbed, COLORS } = require('../utils/helpers');

// Commands that work via text prefix — maps command name → handler function
// Each handler receives (message, args, client) and returns a Promise
const TEXT_COMMANDS = {

  play: async (message, args, client) => {
    const query = args.join(' ');
    if (!query) return message.reply({ embeds: [errorEmbed('Please provide a song name or URL.')] });

    const vc = message.member?.voice?.channel;
    if (!vc) return message.reply({ embeds: [errorEmbed('You need to be in a voice channel first!')] });

    const botVc = message.guild.members.me?.voice?.channel;
    if (botVc && botVc.id !== vc.id)
      return message.reply({ embeds: [errorEmbed(`I'm already in <#${botVc.id}>!`)] });

    const yt       = require('../utils/YouTubeClient');
    const GuildQueue = require('../utils/GuildQueue');

    const loadingMsg = await message.reply('🔍 Searching...');

    try {
      let tracks = [];

      if (yt.isPlaylistUrl(query)) {
        const pl = await yt.getPlaylist(query);
        tracks = pl.videos.map(t => ({ ...t, requestedBy: message.author.username }));
        if (!tracks.length) return loadingMsg.edit({ content: null, embeds: [errorEmbed('Playlist is empty or private.')] });

        await getOrCreateQueue(client, message, vc, tracks);
        return loadingMsg.edit({
          content: null,
          embeds: [new EmbedBuilder().setColor(0x57F287)
            .setDescription(`✅ Queued playlist: **${pl.title}** (${tracks.length} tracks)`)],
        });

      } else if (yt.isYouTubeUrl(query)) {
        const info = await yt.getVideoInfo(query);
        const v = info.basic_info;
        tracks = [{
          id:          v.id,
          title:       v.title ?? 'Unknown',
          author:      v.author ?? 'Unknown',
          duration:    formatDur(v.duration),
          thumbnail:   v.thumbnail?.[0]?.url ?? null,
          url:         `https://www.youtube.com/watch?v=${v.id}`,
          requestedBy: message.author.username,
        }];

      } else {
        const results = await yt.search(query, 1);
        if (!results.length) return loadingMsg.edit({ content: null, embeds: [errorEmbed('No results found.')] });
        tracks = [{ ...results[0], requestedBy: message.author.username }];
      }

      const track = tracks[0];
      const isQueued = await getOrCreateQueue(client, message, vc, tracks);

      return loadingMsg.edit({
        content: null,
        embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setAuthor({ name: isQueued ? '✅ Added to Queue' : '🎵 Now Playing' })
          .setTitle(track.title)
          .setURL(track.url)
          .setDescription(`by **${track.author}** | \`${track.duration}\``)
          .setThumbnail(track.thumbnail)
          .setFooter({ text: `Requested by ${message.member.displayName}` })
        ],
      });
    } catch (err) {
      console.error('[prefix:play]', err.message);
      return loadingMsg.edit({ content: null, embeds: [errorEmbed(`Could not play: \`${err.message}\``)] });
    }
  },

  skip: async (message, args, client) => {
    const queue = client.queues.get(message.guild.id);
    if (!queue?.current) return message.reply({ embeds: [errorEmbed('Nothing is playing.')] });
    if (!message.member?.voice?.channel) return message.reply({ embeds: [errorEmbed('Join a voice channel first.')] });
    const to = parseInt(args[0]);
    const title = queue.current.title;
    if (to && !isNaN(to)) {
      if (to > queue.tracks.length) return message.reply({ embeds: [errorEmbed(`Position ${to} is out of range.`)] });
      queue.tracks.splice(0, to - 1);
    }
    queue.skip();
    return message.reply({ embeds: [successEmbed(to && !isNaN(to) ? `Skipped to position **${to}**.` : `Skipped **${title}** ⏭️`)] });
  },

  stop: async (message, args, client) => {
    const queue = client.queues.get(message.guild.id);
    if (!queue) return message.reply({ embeds: [errorEmbed('Nothing is playing.')] });
    if (!message.member?.voice?.channel) return message.reply({ embeds: [errorEmbed('Join a voice channel first.')] });
    queue.destroy();
    return message.reply({ embeds: [successEmbed('Stopped and cleared the queue. ⏹️')] });
  },

  pause: async (message, args, client) => {
    const queue = client.queues.get(message.guild.id);
    if (!queue?.current) return message.reply({ embeds: [errorEmbed('Nothing is playing.')] });
    if (!message.member?.voice?.channel) return message.reply({ embeds: [errorEmbed('Join a voice channel first.')] });
    if (queue.paused) return message.reply({ embeds: [errorEmbed('Already paused.')] });
    queue.pause();
    return message.reply({ embeds: [successEmbed('Paused ⏸️')] });
  },

  resume: async (message, args, client) => {
    const queue = client.queues.get(message.guild.id);
    if (!queue?.current) return message.reply({ embeds: [errorEmbed('Nothing is playing.')] });
    if (!message.member?.voice?.channel) return message.reply({ embeds: [errorEmbed('Join a voice channel first.')] });
    if (!queue.paused) return message.reply({ embeds: [errorEmbed('Not paused.')] });
    queue.resume();
    return message.reply({ embeds: [successEmbed('Resumed ▶️')] });
  },

  leave: async (message, args, client) => {
    const queue = client.queues.get(message.guild.id);
    if (!queue) return message.reply({ embeds: [errorEmbed('I\'m not in a voice channel.')] });
    if (!message.member?.voice?.channel) return message.reply({ embeds: [errorEmbed('Join a voice channel first.')] });
    queue.destroy();
    return message.reply({ embeds: [successEmbed('Left the voice channel. 👋')] });
  },

  volume: async (message, args, client) => {
    const queue = client.queues.get(message.guild.id);
    if (!queue) return message.reply({ embeds: [errorEmbed('Nothing is playing.')] });
    const level = parseInt(args[0]);
    if (isNaN(level)) {
      return message.reply({
        embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription(`🔊 Current volume: **${queue.volume}%**`)],
      });
    }
    if (level < 0 || level > 100) return message.reply({ embeds: [errorEmbed('Volume must be 0–100.')] });
    if (!message.member?.voice?.channel) return message.reply({ embeds: [errorEmbed('Join a voice channel first.')] });
    queue.setVolume(level);
    const bar = '█'.repeat(Math.round(level / 10)) + '░'.repeat(10 - Math.round(level / 10));
    return message.reply({
      embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`🔊 Volume: **${level}%** \`[${bar}]\``)],
    });
  },

  queue: async (message, args, client) => {
    const queue = client.queues.get(message.guild.id);
    if (!queue?.current) return message.reply({ embeds: [errorEmbed('Nothing is playing.')] });
    const page = Math.max(1, parseInt(args[0]) || 1);
    const pageSize = 10;
    const pages = Math.ceil((queue.tracks.length + 1) / pageSize) || 1;
    const start = (page - 1) * pageSize;

    const lines = [];
    if (start === 0) lines.push(`▶️ **${queue.current.title}** (now playing)`);
    queue.tracks.slice(Math.max(0, start - 1), start - 1 + pageSize).forEach((t, i) => {
      lines.push(`\`${start + i + (start === 0 ? 1 : 0)}\`. ${t.title} — *${t.requestedBy}*`);
    });

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🎵 Queue (${queue.tracks.length} tracks)`)
        .setDescription(lines.join('\n') || 'Queue is empty.')
        .setFooter({ text: `Page ${page}/${pages}` })
      ],
    });
  },

  nowplaying: async (message, args, client) => {
    const queue = client.queues.get(message.guild.id);
    if (!queue?.current) return message.reply({ embeds: [errorEmbed('Nothing is playing.')] });
    const t = queue.current;
    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setAuthor({ name: '🎵 Now Playing' })
        .setTitle(t.title)
        .setURL(t.url)
        .setDescription(`by **${t.author}** | \`${t.duration}\``)
        .setThumbnail(t.thumbnail)
        .setFooter({ text: `Requested by ${t.requestedBy}` })
      ],
    });
  },

  shuffle: async (message, args, client) => {
    const queue = client.queues.get(message.guild.id);
    if (!queue || queue.tracks.length < 2) return message.reply({ embeds: [errorEmbed('Need at least 2 tracks in the queue.')] });
    if (!message.member?.voice?.channel) return message.reply({ embeds: [errorEmbed('Join a voice channel first.')] });
    queue.shuffle();
    return message.reply({ embeds: [successEmbed(`Shuffled **${queue.tracks.length}** tracks 🔀`)] });
  },

  loop: async (message, args, client) => {
    const queue = client.queues.get(message.guild.id);
    if (!queue) return message.reply({ embeds: [errorEmbed('Nothing is playing.')] });
    if (!message.member?.voice?.channel) return message.reply({ embeds: [errorEmbed('Join a voice channel first.')] });
    const mode = args[0]?.toLowerCase();
    const map = { off: 0, track: 1, queue: 2 };
    if (!(mode in map)) return message.reply({ embeds: [errorEmbed('Usage: `loop <off|track|queue>`')] });
    queue.setLoop(map[mode]);
    const labels = ['disabled', 'track', 'queue'];
    return message.reply({ embeds: [successEmbed(`Loop: **${labels[map[mode]]}** 🔁`)] });
  },

  // Prefix command — handled by prefix.js's executePrefix method
  prefix: async (message, args, client) => {
    const prefixCmd = require('../commands/prefix');
    return prefixCmd.executePrefix(message, args, client);
  },

  help: async (message, args, client) => {
    const prefix = getPrefix(message.guild.id);
    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🎵 Music Bot — Text Commands')
        .setDescription(
          `All slash commands also work as text commands with your prefix \`${prefix}\`.\n\n` +
          `**Music**\n` +
          `\`${prefix}play <song>\` — Play a song or URL\n` +
          `\`${prefix}skip [pos]\` — Skip current track\n` +
          `\`${prefix}stop\` — Stop and clear queue\n` +
          `\`${prefix}pause\` / \`${prefix}resume\` — Pause/resume\n` +
          `\`${prefix}leave\` — Leave voice channel\n` +
          `\`${prefix}volume [0-100]\` — Get/set volume\n` +
          `\`${prefix}queue [page]\` — View queue\n` +
          `\`${prefix}nowplaying\` — Current track\n` +
          `\`${prefix}shuffle\` — Shuffle queue\n` +
          `\`${prefix}loop <off|track|queue>\` — Set loop mode\n\n` +
          `**Settings** *(Admin only)*\n` +
          `\`${prefix}prefix set <new>\` — Change prefix\n` +
          `\`${prefix}prefix reset\` — Reset to default\n` +
          `\`${prefix}prefix view\` — Show current prefix`
        )
      ],
    });
  },
};

// Aliases
TEXT_COMMANDS.np  = TEXT_COMMANDS.nowplaying;
TEXT_COMMANDS.q   = TEXT_COMMANDS.queue;
TEXT_COMMANDS.s   = TEXT_COMMANDS.skip;
TEXT_COMMANDS.p   = TEXT_COMMANDS.play;
TEXT_COMMANDS.vol = TEXT_COMMANDS.volume;

// ── Register the messageCreate listener ──────────────────────────────────────
function registerPrefixHandler(client) {
  client.on('messageCreate', async (message) => {
    // Ignore bots and DMs
    if (message.author.bot || !message.guild) return;

    const prefix = getPrefix(message.guild.id);

    // Check if message starts with prefix (case-sensitive)
    if (!message.content.startsWith(prefix)) return;

    // Parse: strip prefix, split on whitespace
    const [commandName, ...args] = message.content
      .slice(prefix.length)
      .trim()
      .split(/\s+/);

    if (!commandName) return;

    const handler = TEXT_COMMANDS[commandName.toLowerCase()];
    if (!handler) return; // Unknown command — silently ignore

    try {
      await handler(message, args, client);
    } catch (err) {
      console.error(`[PrefixHandler] ${commandName}:`, err.message);
      message.reply({ embeds: [errorEmbed(`Error: \`${err.message}\``)] }).catch(() => {});
    }
  });

  console.log('[PrefixHandler] Text prefix commands registered.');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDur(s) {
  if (!s) return '??:??';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  const p = n => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

async function getOrCreateQueue(client, message, vc, tracks) {
  const GuildQueue = require('../utils/GuildQueue');
  let queue = client.queues.get(message.guild.id);
  const isQueued = !!queue;
  if (!queue) {
    queue = new GuildQueue(client, message.guild, vc, message.channel);
    client.queues.set(message.guild.id, queue);
  }
  tracks.forEach(t => queue.addTrack(t));
  await queue.start();
  return isQueued;
}

module.exports = { registerPrefixHandler };
