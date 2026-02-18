const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, ephemeral } = require('../utils/helpers');
module.exports = {
  data: new SlashCommandBuilder().setName('loop').setDescription('Set loop mode.')
    .addStringOption(o => o.setName('mode').setDescription('Loop mode').setRequired(true)
      .addChoices({ name: '🚫 Off', value: 'off' }, { name: '🔂 Track', value: 'track' }, { name: '🔁 Queue', value: 'queue' })),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guild.id);
    if (!queue) return interaction.reply(ephemeral('Nothing is playing.'));
    if (!interaction.member?.voice?.channel) return interaction.reply(ephemeral('Join a voice channel first.'));
    const map = { off: 0, track: 1, queue: 2 };
    const msgs = { off: '🚫 Loop disabled.', track: '🔂 Looping current track.', queue: '🔁 Looping entire queue.' };
    const mode = interaction.options.getString('mode', true);
    queue.setLoop(map[mode]);
    return interaction.reply({ embeds: [successEmbed(msgs[mode])] });
  },
};
