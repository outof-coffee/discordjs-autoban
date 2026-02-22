import { Events, Message } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/db.js';

export default {
    name: Events.MessageCreate,
    async execute(message: Message) {
        const guild = message.guild;
        // Ignore messages outside of guilds or from the bot itself (though shouldBan handles bots)
        if (!guild || message.author.bot) return;

        const config = getGuildConfig(guild.id);

        // 2. Short-Circuit Verification
        if (!config.shouldBan(message)) return;

        try {
            // 3. Execute Ban
            await guild.members.ban(message.author.id, {
                deleteMessageSeconds: 60 * 60 * 24, // Clean up 24 hours of messages
                reason: 'Auto-ban: Unauthorized post in monitored channel.'
            });

            // 4. Record Ban
            const raw = config.raw;
            const newBan = {
                userId: message.author.id,
                tag: message.author.tag,
                timestamp: Date.now()
            };

            raw.recentBans.push(newBan);
            // Ensure only the last 10 bans are kept
            raw.recentBans = raw.recentBans.slice(-10);

            saveGuildConfig(guild.id, raw);

            // 5. Silent Operation - No feedback sent to channel
            console.log(`[Auto-Ban] Banned ${message.author.tag} (${message.author.id}) in guild ${guild.name}`);

        } catch (error) {
            console.error(`[Auto-Ban] Failed to ban ${message.author.tag}:`, error);
        }
    },
};
