const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, ephemeral } = require('../utils/helpers');
module.exports = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Resume playback.'),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guild.id);
    if (!queue) return interaction.reply(ephemeral('Nothing to resume.'));
    if (!interaction.member?.voice?.channel) return interaction.reply(ephemeral('Join a voice channel first.'));
    if (!queue.paused) return interaction.reply({ embeds: [successEmbed('Not paused.')] });
    queue.resume();
    return interaction.reply({ embeds: [successEmbed('Resumed. ▶️')] });
  },
};
