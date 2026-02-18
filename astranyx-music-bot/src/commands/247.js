const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, ephemeral } = require('../utils/helpers');
module.exports = {
  data: new SlashCommandBuilder().setName('247').setDescription('Toggle 24/7 mode.'),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guild.id);
    if (!queue) return interaction.reply(ephemeral('Not in a voice channel. Use /play first.'));
    if (!interaction.member?.voice?.channel) return interaction.reply(ephemeral('Join a voice channel first.'));
    queue.alwaysOn = !queue.alwaysOn;
    return interaction.reply({ embeds: [successEmbed(queue.alwaysOn ? '24/7 mode **enabled**. I\'ll stay in VC.' : '24/7 mode **disabled**.')] });
  },
};
