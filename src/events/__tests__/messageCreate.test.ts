import { vi, describe, it, expect, beforeEach } from 'vitest';
import messageCreate from '../messageCreate.js';
import { getGuildConfig, saveGuildConfig } from '../../utils/db.js';

vi.mock('../../utils/db.js', () => ({
    getGuildConfig: vi.fn(),
    saveGuildConfig: vi.fn()
}));

describe('messageCreate event', () => {
    let mockMessage: any;
    let mockGuild: any;
    let mockConfig: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockGuild = {
            id: 'guild-123',
            name: 'Test Guild',
            members: {
                ban: vi.fn().mockResolvedValue({})
            }
        };

        mockMessage = {
            guild: mockGuild,
            author: { id: 'user-123', bot: false, tag: 'User#123' },
            content: 'test message'
        };

        mockConfig = {
            shouldBan: vi.fn(),
            raw: { recentBans: [] }
        };

        (getGuildConfig as any).mockReturnValue(mockConfig);
    });

    it('should ignore messages from bots', async () => {
        mockMessage.author.bot = true;
        await messageCreate.execute(mockMessage);
        expect(getGuildConfig).not.toHaveBeenCalled();
    });

    it('should ignore messages if no guild exists', async () => {
        mockMessage.guild = null;
        await messageCreate.execute(mockMessage);
        expect(getGuildConfig).not.toHaveBeenCalled();
    });

    it('should short-circuit if shouldBan returns false', async () => {
        mockConfig.shouldBan.mockReturnValue(false);
        await messageCreate.execute(mockMessage);
        expect(mockGuild.members.ban).not.toHaveBeenCalled();
    });

    it('should ban user and record to history if shouldBan returns true', async () => {
        mockConfig.shouldBan.mockReturnValue(true);
        await messageCreate.execute(mockMessage);

        expect(mockGuild.members.ban).toHaveBeenCalledWith('user-123', {
            deleteMessageSeconds: 86400,
            reason: 'Auto-ban: Unauthorized post in monitored channel.'
        });

        expect(saveGuildConfig).toHaveBeenCalledWith('guild-123', expect.objectContaining({
            recentBans: expect.arrayContaining([
                expect.objectContaining({
                    userId: 'user-123',
                    tag: 'User#123'
                })
            ])
        }));
    });
});
