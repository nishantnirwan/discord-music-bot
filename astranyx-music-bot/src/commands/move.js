const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, ephemeral } = require('../utils/helpers');
module.exports = {
  data: new SlashCommandBuilder().setName('move').setDescription('Move a track to a different position.')
    .addIntegerOption(o => o.setName('from').setDescription('Current position').setRequired(true).setMinValue(1))
    .addIntegerOption(o => o.setName('to').setDescription('Target position').setRequired(true).setMinValue(1)),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guild.id);
    if (!queue || queue.tracks.length < 2) return interaction.reply(ephemeral('Need at least 2 tracks in queue.'));
    if (!interaction.member?.voice?.channel) return interaction.reply(ephemeral('Join a voice channel first.'));
    const from = interaction.options.getInteger('from', true);
    const to   = interaction.options.getInteger('to', true);
    if (from > queue.tracks.length || to > queue.tracks.length) return interaction.reply({ embeds: [errorEmbed('Position out of range.')] });
    const [track] = queue.tracks.splice(from-1, 1);
    queue.tracks.splice(to-1, 0, track);
    return interaction.reply({ embeds: [successEmbed(`Moved **${track.title}** to position **${to}**.`)] });
  },
};
