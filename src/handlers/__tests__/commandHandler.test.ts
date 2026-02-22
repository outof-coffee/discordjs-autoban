import { vi, describe, it, expect } from 'vitest';
import { Collection } from 'discord.js';
import { loadCommands } from '../commandHandler.js';
import { CustomClient } from '../../index.js';

// Mock the file system
vi.mock('node:fs', () => ({
    default: {
        readdirSync: vi.fn().mockReturnValue(['test-command.js']),
    }
}));

// Mock the dynamic import of the command file
// Note: We use the absolute path that commandHandler constructs internally
vi.mock('/Users/tsal/github/discordjs-autoban/src/commands/test-command.js', () => ({
    default: {
        data: { name: 'test-command' },
        execute: vi.fn()
    }
}));

describe('commandHandler', () => {
    it('loadCommands populates the client.commands collection with valid command objects', async () => {
        // Mock CustomClient
        const mockClient = {
            commands: new Collection<string, any>()
        } as unknown as CustomClient;

        await loadCommands(mockClient);

        expect(mockClient.commands.has('test-command')).toBe(true);
        expect(mockClient.commands.get('test-command')?.data.name).toBe('test-command');
    });
});
