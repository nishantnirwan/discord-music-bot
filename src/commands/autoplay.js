const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, ephemeral } = require('../utils/helpers');
module.exports = {
  data: new SlashCommandBuilder().setName('autoplay').setDescription('Toggle autoplay (not supported in this version).'),
  async execute(interaction) {
    return interaction.reply({ embeds: [successEmbed('Autoplay is not available in this version. Use `/loop queue` to loop the queue.')] });
  },
};
