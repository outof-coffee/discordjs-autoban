import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getGuildConfig, saveGuildConfig, clearDbCache } from '../db.js';
import { GuildConfig } from '../../models/GuildConfig.js';

vi.mock('lowdb/node', () => ({
    JSONFileSync: vi.fn().mockImplementation(function() {
        return {
            read: vi.fn().mockReturnValue(null),
            write: vi.fn()
        };
    })
}));

describe('db utility', () => {
    beforeEach(() => {
        clearDbCache();
    });

    it('getGuildConfig returns a default GuildConfig for a non-existent guild', () => {
        const config = getGuildConfig('new-guild-id');
        expect(config).toBeInstanceOf(GuildConfig);
        expect(config.raw.enabled).toBe(false);
        expect(config.raw.adminRoleId).toBeNull();
    });

    it('saveGuildConfig persists the configuration and subsequent calls return updated state', () => {
        const guildId = 'test-guild';
        const newConfig = {
            adminRoleId: 'role-123',
            monitoredChannelId: 'channel-456',
            enabled: true,
            recentBans: []
        };

        saveGuildConfig(guildId, newConfig);
        const retrieved = getGuildConfig(guildId);
        
        expect(retrieved.raw.adminRoleId).toBe('role-123');
        expect(retrieved.raw.enabled).toBe(true);
    });
});
