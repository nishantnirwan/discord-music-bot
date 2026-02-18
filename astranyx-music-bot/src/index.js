require('./utils/sodiumShim');
require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadCommands }        = require('./handlers/commandHandler');
const { loadEvents }          = require('./handlers/eventHandler');
const { registerPrefixHandler } = require('./handlers/prefixHandler');
const { successEmbed, errorEmbed } = require('./utils/helpers');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.queues   = new Collection();

// ── Button handler ─────────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith('music_')) return;

  const queue = client.queues.get(interaction.guild.id);
  if (!queue) return interaction.reply({ content: '❌ Nothing is playing.', flags: 64 });
  if (!interaction.member?.voice?.channel) return interaction.reply({ content: '❌ Join a voice channel first.', flags: 64 });

  const { successEmbed } = require('./utils/helpers');

  switch (interaction.customId.replace('music_', '')) {
    case 'pause_resume': {
      if (queue.paused) { queue.resume(); return interaction.reply({ embeds: [successEmbed('Resumed ▶️')], flags: 64 }); }
      else              { queue.pause();  return interaction.reply({ embeds: [successEmbed('Paused ⏸️')], flags: 64 }); }
    }
    case 'skip': {
      const title = queue.current?.title ?? 'track';
      queue.skip();
      return interaction.reply({ embeds: [successEmbed(`Skipped **${title}** ⏭️`)], flags: 64 });
    }
    case 'skip_back': {
      if (queue.current) { queue.tracks.unshift({ ...queue.current }); queue.skip(); }
      return interaction.reply({ embeds: [successEmbed('Restarted track ⏮️')], flags: 64 });
    }
    case 'stop': {
      queue.destroy();
      return interaction.reply({ embeds: [successEmbed('Stopped ⏹️')], flags: 64 });
    }
    case 'shuffle': {
      if (queue.tracks.length < 2) return interaction.reply({ content: '❌ Need at least 2 tracks.', flags: 64 });
      queue.shuffle();
      return interaction.reply({ embeds: [successEmbed(`Shuffled **${queue.tracks.length}** tracks 🔀`)], flags: 64 });
    }
  }
});

loadCommands(client);
loadEvents(client);
registerPrefixHandler(client);

// Verify yt-dlp is available at startup
const yt = require('./utils/YouTubeClient');
yt.init();

client.login(process.env.DISCORD_TOKEN);
