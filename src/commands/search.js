const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const yt = require('../utils/YouTubeClient');
const GuildQueue = require('../utils/GuildQueue');
const { errorEmbed, COLORS } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search YouTube and pick from top 5 results.')
    .addStringOption(o => o.setName('query').setDescription('Song name').setRequired(true)),

  async execute(interaction, client) {
    await interaction.deferReply();

    const vc = interaction.member?.voice?.channel;
    if (!vc) return interaction.editReply({ embeds: [errorEmbed('You need to be in a voice channel first!')] });

    const query = interaction.options.getString('query', true);

    let results;
    try {
      results = await yt.search(query, 5);
    } catch (err) {
      return interaction.editReply({ embeds: [errorEmbed(`Search failed: ${err.message}`)] });
    }

    if (!results.length) return interaction.editReply({ embeds: [errorEmbed('No results found.')] });

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('search_select').setPlaceholder('Choose a track...')
        .addOptions(results.map((t, i) => ({
          label: t.title.length > 100 ? t.title.slice(0,97)+'...' : t.title,
          description: `${t.author} • ${t.duration}`,
          value: String(i),
        })))
    );

    const embed = new EmbedBuilder()
      .setColor(COLORS.primary)
      .setTitle(`🔍 Results for: ${query}`)
      .setDescription(results.map((t, i) =>
        `\`${i+1}.\` **[${t.title}](${t.url})**\n*${t.author}* • \`${t.duration}\``
      ).join('\n\n'))
      .setFooter({ text: 'Select a track • expires in 30s' });

    const reply = await interaction.editReply({ embeds: [embed], components: [menu] });

    const collector = reply.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id && i.customId === 'search_select',
      time: 30_000, max: 1,
    });

    collector.on('collect', async i => {
      const chosen = { ...results[parseInt(i.values[0], 10)], requestedBy: interaction.user.username };
      try {
        let queue = client.queues.get(interaction.guild.id);
        const isQueued = !!queue;
        if (!queue) {
          queue = new GuildQueue(client, interaction.guild, vc, interaction.channel);
          client.queues.set(interaction.guild.id, queue);
        }
        queue.addTrack(chosen);
        await queue.start();

        await i.update({
          embeds: [new EmbedBuilder().setColor(COLORS.success)
            .setAuthor({ name: isQueued ? '✅ Added to Queue' : '🎵 Now Playing' })
            .setTitle(chosen.title).setURL(chosen.url)
            .setDescription(`by **${chosen.author}** | \`${chosen.duration}\``)
            .setThumbnail(chosen.thumbnail)],
          components: [],
        });
      } catch (err) {
        await i.update({ embeds: [errorEmbed(`Could not play: ${err.message}`)], components: [] });
      }
    });

    collector.on('end', col => {
      if (!col.size) interaction.editReply({ embeds: [errorEmbed('Search timed out.')], components: [] }).catch(() => {});
    });
  },
};
