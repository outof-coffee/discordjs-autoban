import { Message } from 'discord.js';

export interface BanEntry {
    userId: string;
    tag: string;
    timestamp: number;
}

export interface RawGuildConfig {
    adminRoleId: string | null;
    monitoredChannelId: string | null;
    enabled: boolean;
    recentBans: BanEntry[];
}

export class GuildConfig {
    constructor(private data: RawGuildConfig) {}

    get isConfigured(): boolean {
        return !!this.data.adminRoleId && !!this.data.monitoredChannelId;
    }

    get isReady(): boolean {
        return this.data.enabled && this.isConfigured;
    }

    /**
     * Determines if a message author should be banned based on the guild configuration.
     * Short-circuits if not ready, wrong channel, or if the author is the owner/admin.
     */
    shouldBan(message: Message): boolean {
        // Fail-safe: ensure bot is ready and configured
        if (!this.isReady) return false;

        // Only monitor the specified channel
        if (message.channelId !== this.data.monitoredChannelId) return false;

        // Guild owner is immune
        if (message.author.id === message.guild?.ownerId) return false;
        
        // Members with the admin role are immune
        const member = message.member;
        if (this.data.adminRoleId && member?.roles.cache.has(this.data.adminRoleId)) {
            return false;
        }

        // Aggressive: everyone else (including bots) is banned
        return true;
    }

    get raw(): RawGuildConfig {
        return { ...this.data };
    }
}
