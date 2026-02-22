import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MessageFlags, ChannelType } from 'discord.js';
import autoban from '../autoban.js';
import { getGuildConfig, saveGuildConfig } from '../../utils/db.js';

vi.mock('../../utils/db.js', () => ({
    getGuildConfig: vi.fn(),
    saveGuildConfig: vi.fn()
}));

describe('autoban command', () => {
    let mockInteraction: any;
    let mockGuild: any;
    let mockConfig: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockGuild = {
            id: 'guild-123',
            ownerId: 'owner-123',
            members: {
                unban: vi.fn().mockResolvedValue({})
            }
        };

        mockInteraction = {
            guildId: 'guild-123',
            guild: mockGuild,
            user: { id: 'admin-123' },
            member: {
                roles: {
                    cache: {
                        has: vi.fn().mockReturnValue(true)
                    }
                }
            },
            options: {
                getSubcommand: vi.fn(),
                getString: vi.fn(),
                getRole: vi.fn(),
                getChannel: vi.fn(),
                getBoolean: vi.fn()
            },
            reply: vi.fn().mockResolvedValue({})
        };

        mockConfig = {
            adminRoleId: 'admin-role-id',
            monitoredChannelId: 'channel-id',
            enabled: true,
            recentBans: []
        };

        (getGuildConfig as any).mockReturnValue({ raw: mockConfig });
    });

    it('should deny access if not owner and no admin role', async () => {
        mockInteraction.user.id = 'random-user';
        mockInteraction.member.roles.cache.has.mockReturnValue(false);

        await autoban.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('Unauthorized'),
            flags: [MessageFlags.Ephemeral]
        }));
    });

    it('should allow access to guild owner', async () => {
        mockInteraction.user.id = 'owner-123';
        mockInteraction.member.roles.cache.has.mockReturnValue(false);
        mockInteraction.options.getSubcommand.mockReturnValue('status');

        await autoban.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('Bot is currently'),
            flags: [MessageFlags.Ephemeral]
        }));
    });

    it('status subcommand: should show status and recent bans', async () => {
        mockInteraction.options.getSubcommand.mockReturnValue('status');
        mockConfig.recentBans = [
            { userId: 'banned-1', tag: 'Bad#1', timestamp: Date.now() }
        ];

        await autoban.execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('Bot is currently **enabled**'),
            flags: [MessageFlags.Ephemeral]
        }));
        expect(mockInteraction.reply.mock.calls[0][0].content).toContain('Bad#1');
    });

    it('toggle subcommand: should update enabled state', async () => {
        mockInteraction.options.getSubcommand.mockReturnValue('toggle');
        mockInteraction.options.getBoolean.mockReturnValue(false);

        await autoban.execute(mockInteraction);

        expect(saveGuildConfig).toHaveBeenCalledWith('guild-123', expect.objectContaining({
            enabled: false
        }));
        expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('disabled')
        }));
    });

    it('config-role subcommand: should update admin role', async () => {
        mockInteraction.options.getSubcommand.mockReturnValue('config-role');
        mockInteraction.options.getRole.mockReturnValue({ id: 'new-role-id' });

        await autoban.execute(mockInteraction);

        expect(saveGuildConfig).toHaveBeenCalledWith('guild-123', expect.objectContaining({
            adminRoleId: 'new-role-id'
        }));
    });

    it('unban subcommand: should unban by ID', async () => {
        mockInteraction.options.getSubcommand.mockReturnValue('unban');
        mockInteraction.options.getString.mockReturnValue('target-user-id');

        await autoban.execute(mockInteraction);

        expect(mockGuild.members.unban).toHaveBeenCalledWith('target-user-id', expect.any(String));
        expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('Successfully unbanned')
        }));
    });

    it('unban subcommand: should unban by index from history', async () => {
        mockInteraction.options.getSubcommand.mockReturnValue('unban');
        mockInteraction.options.getString.mockReturnValue('1');
        mockConfig.recentBans = [
            { userId: 'banned-from-history', tag: 'Bad#1', timestamp: Date.now() }
        ];

        await autoban.execute(mockInteraction);

        expect(mockGuild.members.unban).toHaveBeenCalledWith('banned-from-history', expect.any(String));
        expect(saveGuildConfig).toHaveBeenCalled();
        expect(mockInteraction.reply).toHaveBeenCalled();
    });
});
