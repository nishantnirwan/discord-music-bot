const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ephemeral, COLORS } = require('../utils/helpers');
const PER_PAGE = 10;
module.exports = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Show the queue.')
    .addIntegerOption(o => o.setName('page').setDescription('Page number').setMinValue(1)),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guild.id);
    if (!queue?.current) return interaction.reply(ephemeral('Nothing is playing.'));
    const page  = interaction.options.getInteger('page') ?? 1;
    const total = Math.max(1, Math.ceil(queue.tracks.length / PER_PAGE));
    const p     = Math.min(page, total);
    const slice = queue.tracks.slice((p-1)*PER_PAGE, p*PER_PAGE);
    const modes = ['🚫 Off','🔂 Track','🔁 Queue'];
    const ct    = queue.current;
    const embed = new EmbedBuilder().setColor(COLORS.primary).setTitle('📋 Music Queue')
      .addFields({ name: '▶️ Now Playing', value: `**[${ct.title}](${ct.url})**\nby ${ct.author} • \`${ct.duration}\`` })
      .addFields({
        name: `⏭️ Up Next (${queue.tracks.length} tracks)`,
        value: slice.length ? slice.map((t,i) => `\`${(p-1)*PER_PAGE+i+1}.\` **${t.title}** — \`${t.duration}\`\n*${t.author}*`).join('\n') : '*Queue is empty*',
      })
      .setFooter({ text: `Page ${p}/${total} • Vol: ${queue.volume}% • Loop: ${modes[queue.loop]}${queue.paused?' • ⏸️ Paused':''}` });
    return interaction.reply({ embeds: [embed] });
  },
};
