const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, ephemeral } = require('../utils/helpers');
module.exports = {
  data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle the queue.'),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guild.id);
    if (!queue || queue.tracks.length < 2) return interaction.reply(ephemeral('Need at least 2 tracks in queue.'));
    if (!interaction.member?.voice?.channel) return interaction.reply(ephemeral('Join a voice channel first.'));
    queue.shuffle();
    return interaction.reply({ embeds: [successEmbed(`🔀 Shuffled **${queue.tracks.length}** tracks.`)] });
  },
};
