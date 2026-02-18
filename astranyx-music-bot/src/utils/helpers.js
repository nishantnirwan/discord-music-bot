const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

const COLORS = { primary: 0x5865F2, success: 0x57F287, error: 0xED4245, warning: 0xFEE75C };

function ephemeral(content) {
  return { content, flags: MessageFlags.Ephemeral };
}

function errorEmbed(description) {
  return new EmbedBuilder().setColor(COLORS.error).setDescription(`❌ ${description}`);
}

function successEmbed(description) {
  return new EmbedBuilder().setColor(COLORS.success).setDescription(`✅ ${description}`);
}

/**
 * Now Playing embed with control buttons.
 * Works with our plain track objects { title, author, duration, thumbnail, url }
 */
function nowPlayingEmbed(track, queue) {
  const repeatLabels = ['🚫 Off', '🔂 Track', '🔁 Queue'];
  const isPaused = queue?.paused ?? false;

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setAuthor({ name: isPaused ? '⏸️  Paused' : '🎵  Now Playing' })
    .setTitle(track.title)
    .setURL(track.url)
    .setThumbnail(track.thumbnail)
    .addFields(
      { name: '🎤 Artist',   value: track.author   ?? 'Unknown',                          inline: true },
      { name: '⏱ Duration', value: `\`${track.duration ?? '??:??'}\``,                    inline: true },
      { name: '🔁 Loop',    value: repeatLabels[queue?.loop ?? 0],                        inline: true },
      { name: '🔊 Volume',  value: `${queue?.volume ?? 50}%`,                             inline: true },
      { name: '📋 Queue',   value: `${queue?.tracks?.length ?? 0} track(s) remaining`,   inline: true },
      { name: '👤 By',      value: track.requestedBy ?? 'Unknown',                        inline: true },
    )
    .setFooter({ text: `Requested by ${track.requestedBy ?? 'Unknown'} • YouTube` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('music_skip_back').setEmoji('⏮️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_pause_resume').setEmoji(isPaused ? '▶️' : '⏸️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('music_skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('music_shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row] };
}

module.exports = { ephemeral, errorEmbed, successEmbed, nowPlayingEmbed, COLORS };
