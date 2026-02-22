import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GuildConfig, RawGuildConfig } from '../GuildConfig.js';
import { Message } from 'discord.js';

describe('GuildConfig model', () => {
    let rawConfig: RawGuildConfig;
    let mockMessage: any;

    beforeEach(() => {
        rawConfig = {
            adminRoleId: 'admin-role-123',
            monitoredChannelId: 'channel-123',
            enabled: true,
            recentBans: []
        };

        mockMessage = {
            channelId: 'channel-123',
            author: { id: 'user-123' },
            guild: { ownerId: 'owner-123' },
            member: {
                roles: {
                    cache: {
                        has: vi.fn().mockReturnValue(false)
                    }
                }
            }
        };
    });

    describe('isConfigured', () => {
        it('should return true if both adminRoleId and monitoredChannelId are set', () => {
            const config = new GuildConfig(rawConfig);
            expect(config.isConfigured).toBe(true);
        });

        it('should return false if adminRoleId is missing', () => {
            rawConfig.adminRoleId = null;
            const config = new GuildConfig(rawConfig);
            expect(config.isConfigured).toBe(false);
        });

        it('should return false if monitoredChannelId is missing', () => {
            rawConfig.monitoredChannelId = null;
            const config = new GuildConfig(rawConfig);
            expect(config.isConfigured).toBe(false);
        });
    });

    describe('isReady', () => {
        it('should return true if enabled and configured', () => {
            const config = new GuildConfig(rawConfig);
            expect(config.isReady).toBe(true);
        });

        it('should return false if disabled even if configured', () => {
            rawConfig.enabled = false;
            const config = new GuildConfig(rawConfig);
            expect(config.isReady).toBe(false);
        });

        it('should return false if unconfigured even if enabled', () => {
            rawConfig.adminRoleId = null;
            const config = new GuildConfig(rawConfig);
            expect(config.isReady).toBe(false);
        });
    });

    describe('shouldBan', () => {
        it('should return false if not ready', () => {
            rawConfig.enabled = false;
            const config = new GuildConfig(rawConfig);
            expect(config.shouldBan(mockMessage as unknown as Message)).toBe(false);
        });

        it('should return false if message is in the wrong channel', () => {
            mockMessage.channelId = 'wrong-channel';
            const config = new GuildConfig(rawConfig);
            expect(config.shouldBan(mockMessage as unknown as Message)).toBe(false);
        });

        it('should return false if author is the guild owner', () => {
            mockMessage.author.id = 'owner-123';
            const config = new GuildConfig(rawConfig);
            expect(config.shouldBan(mockMessage as unknown as Message)).toBe(false);
        });

        it('should return false if author has the admin role', () => {
            mockMessage.member.roles.cache.has.mockReturnValue(true);
            const config = new GuildConfig(rawConfig);
            expect(config.shouldBan(mockMessage as unknown as Message)).toBe(false);
            expect(mockMessage.member.roles.cache.has).toHaveBeenCalledWith('admin-role-123');
        });

        it('should return true if none of the immunity conditions are met', () => {
            const config = new GuildConfig(rawConfig);
            expect(config.shouldBan(mockMessage as unknown as Message)).toBe(true);
        });
    });

    describe('raw', () => {
        it('should return a copy of the raw data', () => {
            const config = new GuildConfig(rawConfig);
            const exported = config.raw;
            expect(exported).toEqual(rawConfig);
            expect(exported).not.toBe(rawConfig); // Should be a copy
        });
    });
});
