const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ephemeral, COLORS } = require('../utils/helpers');
module.exports = {
  data: new SlashCommandBuilder().setName('volume').setDescription('Get or set volume (0-100).')
    .addIntegerOption(o => o.setName('level').setDescription('Volume level').setMinValue(0).setMaxValue(100)),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guild.id);
    if (!queue) return interaction.reply(ephemeral('Nothing is playing.'));
    const level = interaction.options.getInteger('level');
    if (level === null) return interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.primary).setDescription(`🔊 Current volume: **${queue.volume}%**`)] });
    if (!interaction.member?.voice?.channel) return interaction.reply(ephemeral('Join a voice channel first.'));
    queue.setVolume(level);
    const bar = '█'.repeat(Math.round(level/10)) + '░'.repeat(10-Math.round(level/10));
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.success).setDescription(`🔊 Volume: **${level}%** \`[${bar}]\``)] });
  },
};
