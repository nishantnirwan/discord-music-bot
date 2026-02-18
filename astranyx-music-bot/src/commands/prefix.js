const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getPrefix, setPrefix, resetPrefix } = require('../utils/prefixManager');
const { successEmbed, errorEmbed, COLORS } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prefix')
    .setDescription('View or change the bot prefix for this server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set a new prefix.')
        .addStringOption(o =>
          o.setName('prefix')
            .setDescription('The new prefix (1–5 characters)')
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(5)
        )
    )
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View the current prefix.')
    )
    .addSubcommand(sub =>
      sub.setName('reset')
        .setDescription('Reset to the default prefix.')
    ),

  async execute(interaction, client) {
    // Guard: slash command permissions are already enforced by setDefaultMemberPermissions,
    // but double-check for safety
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        embeds: [errorEmbed('You need the **Manage Server** permission to change the prefix.')],
        flags: 64,
      });
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'view') {
      const current = getPrefix(guildId);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(COLORS.primary)
          .setDescription(`📌 Current prefix: \`${current}\`\nUse \`${current}play\`, \`${current}skip\`, etc.`)
        ],
      });
    }

    if (sub === 'reset') {
      const def = process.env.DEFAULT_PREFIX ?? '!';
      resetPrefix(guildId);
      return interaction.reply({
        embeds: [successEmbed(`Prefix reset to \`${def}\``)],
      });
    }

    if (sub === 'set') {
      const newPrefix = interaction.options.getString('prefix', true).trim();

      if (!newPrefix) {
        return interaction.reply({ embeds: [errorEmbed('Prefix cannot be empty.')], flags: 64 });
      }

      setPrefix(guildId, newPrefix);
      return interaction.reply({
        embeds: [successEmbed(`✅ Prefix updated to \`${newPrefix}\`\nNow use \`${newPrefix}play\`, \`${newPrefix}skip\`, etc.`)],
      });
    }
  },

  // ── Text command handler (called by prefixHandler) ────────────────────────
  // Usage: !prefix set $   |   !prefix reset   |   !prefix
  async executePrefix(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({ embeds: [errorEmbed('You need the **Manage Server** permission to change the prefix.')] });
    }

    const guildId = message.guild.id;
    const sub = args[0]?.toLowerCase();

    if (!sub || sub === 'view') {
      const current = getPrefix(guildId);
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(COLORS.primary)
          .setDescription(`📌 Current prefix: \`${current}\``)
        ],
      });
    }

    if (sub === 'reset') {
      const def = process.env.DEFAULT_PREFIX ?? '!';
      resetPrefix(guildId);
      return message.reply({ embeds: [successEmbed(`Prefix reset to \`${def}\``)] });
    }

    if (sub === 'set') {
      const newPrefix = args[1]?.trim();
      if (!newPrefix) return message.reply({ embeds: [errorEmbed('Usage: `prefix set <newprefix>`')] });
      if (newPrefix.length > 5) return message.reply({ embeds: [errorEmbed('Prefix must be 5 characters or fewer.')] });
      setPrefix(guildId, newPrefix);
      return message.reply({
        embeds: [successEmbed(`✅ Prefix updated to \`${newPrefix}\``)],
      });
    }

    return message.reply({ embeds: [errorEmbed('Usage: `prefix set <prefix>` | `prefix reset` | `prefix view`')] });
  },
};
