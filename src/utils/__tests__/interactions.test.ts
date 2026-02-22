import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { handleInteractionError } from '../interactions.js';

describe('interactions utility', () => {
    let mockInteraction: any;

    beforeEach(() => {
        mockInteraction = {
            replied: false,
            deferred: false,
            reply: vi.fn().mockResolvedValue(undefined),
        };
        // Mock console.error to keep test output clean
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('calls interaction.reply when not replied or deferred', async () => {
        const error = new Error('Test error');
        await handleInteractionError(mockInteraction as unknown as ChatInputCommandInteraction, error);

        expect(console.error).toHaveBeenCalledWith(error);
        expect(mockInteraction.reply).toHaveBeenCalledWith({
            content: 'There was an error while executing this command!',
            flags: [MessageFlags.Ephemeral]
        });
    });

    it('does NOT call interaction.reply when already replied', async () => {
        mockInteraction.replied = true;
        const error = new Error('Test error');
        await handleInteractionError(mockInteraction as unknown as ChatInputCommandInteraction, error);

        expect(console.error).toHaveBeenCalledWith(error);
        expect(mockInteraction.reply).not.toHaveBeenCalled();
    });

    it('does NOT call interaction.reply when already deferred', async () => {
        mockInteraction.deferred = true;
        const error = new Error('Test error');
        await handleInteractionError(mockInteraction as unknown as ChatInputCommandInteraction, error);

        expect(console.error).toHaveBeenCalledWith(error);
        expect(mockInteraction.reply).not.toHaveBeenCalled();
    });
});
