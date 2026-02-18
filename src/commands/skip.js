const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, ephemeral } = require('../utils/helpers');
module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current track.')
    .addIntegerOption(o => o.setName('to').setDescription('Skip to position').setMinValue(1)),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guild.id);
    if (!queue?.current) return interaction.reply(ephemeral('Nothing is playing.'));
    if (!interaction.member?.voice?.channel) return interaction.reply(ephemeral('Join a voice channel first.'));
    const to = interaction.options.getInteger('to');
    const title = queue.current.title;
    if (to) {
      if (to > queue.tracks.length) return interaction.reply({ embeds: [errorEmbed(`Position ${to} is out of range.`)] });
      queue.tracks.splice(0, to - 1);
    }
    queue.skip();
    return interaction.reply({ embeds: [successEmbed(to ? `Skipped to position **${to}**.` : `Skipped **${title}**. ⏭️`)] });
  },
};
