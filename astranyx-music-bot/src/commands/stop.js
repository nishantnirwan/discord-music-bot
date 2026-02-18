const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, ephemeral } = require('../utils/helpers');
module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Stop and clear the queue.'),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guild.id);
    if (!queue) return interaction.reply(ephemeral('Nothing is playing.'));
    if (!interaction.member?.voice?.channel) return interaction.reply(ephemeral('Join a voice channel first.'));
    queue.destroy();
    return interaction.reply({ embeds: [successEmbed('Stopped and cleared the queue. ⏹️')] });
  },
};
