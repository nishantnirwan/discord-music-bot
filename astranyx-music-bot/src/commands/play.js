const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const yt = require('../utils/YouTubeClient');
const GuildQueue = require('../utils/GuildQueue');
const { errorEmbed, COLORS } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song by name or YouTube URL.')
    .addStringOption(o => o.setName('query').setDescription('Song name or YouTube URL').setRequired(true)),

  async execute(interaction, client) {
    await interaction.deferReply();

    const vc = interaction.member?.voice?.channel;
    if (!vc) return interaction.editReply({ embeds: [errorEmbed('You need to be in a voice channel first!')] });

    const botVc = interaction.guild.members.me?.voice?.channel;
    if (botVc && botVc.id !== vc.id)
      return interaction.editReply({ embeds: [errorEmbed(`I'm already in <#${botVc.id}>!`)] });

    const query = interaction.options.getString('query', true);

    try {
      let tracks = [];

      if (yt.isPlaylistUrl(query)) {
        // YouTube playlist
        const pl = await yt.getPlaylist(query);
        tracks = pl.videos.map(t => ({ ...t, requestedBy: interaction.user.username }));
        if (!tracks.length) return interaction.editReply({ embeds: [errorEmbed('Playlist is empty or private.')] });

        await getOrCreateQueue(client, interaction, vc, tracks);

        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(COLORS.success)
            .setDescription(`✅ Queued playlist: **${pl.title}** (${tracks.length} tracks)`)]
        });

      } else if (yt.isYouTubeUrl(query)) {
        // Single YouTube URL
        const info = await yt.getVideoInfo(query);
        const v    = info.basic_info;
        const track = {
          id:          v.id,
          title:       v.title ?? 'Unknown',
          author:      v.author ?? 'Unknown',
          duration:    formatDur(v.duration),
          thumbnail:   v.thumbnail?.[0]?.url ?? null,
          url:         `https://www.youtube.com/watch?v=${v.id}`,
          requestedBy: interaction.user.username,
        };
        tracks = [track];
      } else {
        // Text search
        const results = await yt.search(query, 1);
        if (!results.length) return interaction.editReply({ embeds: [errorEmbed('No results found. Try a different search term.')] });
        tracks = [{ ...results[0], requestedBy: interaction.user.username }];
      }

      const track = tracks[0];
      const isQueued = await getOrCreateQueue(client, interaction, vc, tracks);

      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(COLORS.success)
          .setAuthor({ name: isQueued ? '✅ Added to Queue' : '🎵 Now Playing' })
          .setTitle(track.title)
          .setURL(track.url)
          .setDescription(`by **${track.author}** | \`${track.duration}\``)
          .setThumbnail(track.thumbnail)
          .setFooter({ text: `Requested by ${interaction.member.displayName}` })
        ]
      });
    } catch (err) {
      console.error('[/play Error]', err.message);
      return interaction.editReply({ embeds: [errorEmbed(`Could not play: \`${err.message}\``)] });
    }
  },
};

function formatDur(s) {
  if (!s) return '??:??';
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = Math.floor(s%60);
  const p = n => String(n).padStart(2,'0');
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

async function getOrCreateQueue(client, interaction, vc, tracks) {
  let queue = client.queues.get(interaction.guild.id);
  const isQueued = !!queue;

  if (!queue) {
    queue = new GuildQueue(client, interaction.guild, vc, interaction.channel);
    client.queues.set(interaction.guild.id, queue);
  }

  tracks.forEach(t => queue.addTrack(t));
  await queue.start();
  return isQueued;
}
