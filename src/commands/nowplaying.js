const { SlashCommandBuilder } = require('discord.js');
const { nowPlayingEmbed, ephemeral } = require('../utils/helpers');
module.exports = {
  data: new SlashCommandBuilder().setName('nowplaying').setDescription('Show the current track with controls.'),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guild.id);
    if (!queue?.current) return interaction.reply(ephemeral('Nothing is playing.'));
    return interaction.reply(nowPlayingEmbed(queue.current, queue));
  },
};
