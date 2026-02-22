import { 
    SlashCommandBuilder, 
    MessageFlags, 
    ChatInputCommandInteraction, 
    ChannelType, 
    PermissionFlagsBits 
} from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/db.js';

export default {
    data: new SlashCommandBuilder()
        .setName('autoban')
        .setDescription('Manage and view auto-ban history and configuration')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('View the current status and the history of the last 10 auto-bans')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unban')
                .setDescription('Unban a user by ID or by index from the status list')
                .addStringOption(option =>
                    option.setName('target')
                        .setDescription('User ID or index (1-10) from /autoban status')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('config-role')
                .setDescription('Updates the admin role allowed to use this bot')
                .addRoleOption(option =>
                    option.setName('role').setDescription('The new admin role').setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('config-channel')
                .setDescription('Updates the monitored channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to monitor for auto-bans')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Updates the enabled state')
                .addBooleanOption(option =>
                    option.setName('enabled').setDescription('Whether the bot is enabled').setRequired(true)
                )
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild;
        if (!interaction.guildId || !guild) return;

        const configWrapper = getGuildConfig(interaction.guildId);
        const config = configWrapper.raw;
        const isOwner = interaction.user.id === guild.ownerId;
        const hasAdminRole = config.adminRoleId && 
                            interaction.member?.roles && 
                            'cache' in interaction.member.roles &&
                            interaction.member.roles.cache.has(config.adminRoleId);

        // Access Control
        if (!isOwner && !hasAdminRole) {
            return interaction.reply({ 
                content: 'Unauthorized. Only the guild owner or members with the admin role can use this command.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'status') {
            const bans = config.recentBans || [];
            const statusMessage = `Bot is currently **${config.enabled ? 'enabled' : 'disabled'}**.`;

            if (bans.length === 0) {
                return interaction.reply({
                    content: `${statusMessage}\nNo recent bans recorded.`,
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const historyList = bans
                .map((ban, index) => {
                    const time = Math.floor(ban.timestamp / 1000);
                    return `${index + 1}. **${ban.tag}** (${ban.userId}) - <t:${time}:R>`;
                })
                .reverse() // Most recent first
                .join('\n');

            await interaction.reply({
                content: `### Bot Status\n${statusMessage}\n\n### Recent Auto-Bans (Last ${bans.length})\n${historyList}`,
                flags: [MessageFlags.Ephemeral]
            });
        } else if (subcommand === 'unban') {
            const targetInput = interaction.options.getString('target', true);
            let userId = targetInput;

            // Target Resolution: Check if it's an index (1-10)
            const index = parseInt(targetInput);
            if (!isNaN(index) && index >= 1 && index <= 10) {
                const banEntry = config.recentBans[index - 1];
                if (banEntry) {
                    userId = banEntry.userId;
                }
            }

            try {
                // Execute Unban
                await guild.members.unban(userId, 'Manual unban via bot command');

                // Cleanup History
                const originalLength = config.recentBans.length;
                config.recentBans = config.recentBans.filter(b => b.userId !== userId);

                // Persist if history changed
                if (config.recentBans.length !== originalLength) {
                    saveGuildConfig(interaction.guildId, config);
                }

                await interaction.reply({
                    content: `Successfully unbanned user (${userId}) and updated recent history.`,
                    flags: [MessageFlags.Ephemeral]
                });
            } catch (error: any) {
                console.error(`[Unban Error] Failed to unban ${userId}:`, error);
                const errorMessage = error.code === 10013 || error.code === 10026 
                    ? 'User not found or not banned.' 
                    : 'Failed to unban user. Check bot permissions.';
                
                await interaction.reply({
                    content: `Error: ${errorMessage}`,
                    flags: [MessageFlags.Ephemeral]
                });
            }
        } else if (subcommand === 'config-role') {
            const role = interaction.options.getRole('role', true);
            config.adminRoleId = role.id;
            saveGuildConfig(interaction.guildId, config);
            return interaction.reply({
                content: `Admin role set to <@&${role.id}>.`,
                flags: [MessageFlags.Ephemeral]
            });
        } else if (subcommand === 'config-channel') {
            const channel = interaction.options.getChannel('channel', true);
            config.monitoredChannelId = channel.id;
            saveGuildConfig(interaction.guildId, config);
            return interaction.reply({
                content: `Monitored channel set to <#${channel.id}>.`,
                flags: [MessageFlags.Ephemeral]
            });
        } else if (subcommand === 'toggle') {
            const enabled = interaction.options.getBoolean('enabled', true);
            config.enabled = enabled;
            saveGuildConfig(interaction.guildId, config);
            return interaction.reply({
                content: `Auto-ban functionality is now **${enabled ? 'enabled' : 'disabled'}**.`,
                flags: [MessageFlags.Ephemeral]
            });
        }
    },
};
