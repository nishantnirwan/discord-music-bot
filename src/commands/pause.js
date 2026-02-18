const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, ephemeral } = require('../utils/helpers');
module.exports = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause playback.'),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guild.id);
    if (!queue?.current) return interaction.reply(ephemeral('Nothing is playing.'));
    if (!interaction.member?.voice?.channel) return interaction.reply(ephemeral('Join a voice channel first.'));
    if (queue.paused) return interaction.reply({ embeds: [successEmbed('Already paused.')] });
    queue.pause();
    return interaction.reply({ embeds: [successEmbed('Paused. ⏸️')] });
  },
};
