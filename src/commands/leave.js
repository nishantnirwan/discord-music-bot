const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, ephemeral } = require('../utils/helpers');
module.exports = {
  data: new SlashCommandBuilder().setName('leave').setDescription('Leave the voice channel.'),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guild.id);
    if (!queue) return interaction.reply(ephemeral('Not in a voice channel.'));
    if (!interaction.member?.voice?.channel) return interaction.reply(ephemeral('Join a voice channel first.'));
    queue.destroy();
    return interaction.reply({ embeds: [successEmbed('Left the voice channel. 👋')] });
  },
};
