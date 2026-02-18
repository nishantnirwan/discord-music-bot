const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, ephemeral } = require('../utils/helpers');
module.exports = {
  data: new SlashCommandBuilder().setName('remove').setDescription('Remove a track from the queue.')
    .addIntegerOption(o => o.setName('position').setDescription('Queue position').setRequired(true).setMinValue(1)),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guild.id);
    if (!queue || queue.tracks.length === 0) return interaction.reply(ephemeral('Queue is empty.'));
    if (!interaction.member?.voice?.channel) return interaction.reply(ephemeral('Join a voice channel first.'));
    const pos = interaction.options.getInteger('position', true);
    const track = queue.tracks[pos-1];
    if (!track) return interaction.reply({ embeds: [errorEmbed(`No track at position **${pos}**.`)] });
    queue.tracks.splice(pos-1, 1);
    return interaction.reply({ embeds: [successEmbed(`Removed **${track.title}** from position **${pos}**.`)] });
  },
};
