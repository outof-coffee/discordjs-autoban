import { vi, describe, it, expect, beforeEach } from 'vitest';
import { loadEvents } from '../eventHandler.js';
import { CustomClient } from '../../index.js';

// Mock the file system
vi.mock('node:fs', () => ({
    default: {
        readdirSync: vi.fn().mockReturnValue(['test-event.js']),
        existsSync: vi.fn().mockReturnValue(true),
        mkdirSync: vi.fn()
    }
}));

// Mock the dynamic import of the event file
vi.mock('/Users/tsal/github/discordjs-autoban/src/events/test-event.js', () => ({
    default: {
        name: 'test-event',
        execute: vi.fn()
    }
}));

describe('eventHandler', () => {
    let mockClient: any;

    beforeEach(() => {
        mockClient = {
            on: vi.fn(),
            once: vi.fn(),
            commands: new Map()
        };
    });

    it('loadEvents registers normal listeners correctly on the client', async () => {
        await loadEvents(mockClient as unknown as CustomClient);

        // Should register the 'test-event' and the built-in 'interactionCreate'
        expect(mockClient.on).toHaveBeenCalled();
        const eventNames = mockClient.on.mock.calls.map((call: any[]) => call[0]);
        expect(eventNames).toContain('test-event');
        expect(eventNames).toContain('interactionCreate');
    });

    it('loadEvents registers "once" listeners correctly on the client', async () => {
        // Change the mock to be a 'once' event
        vi.doMock('/Users/tsal/github/discordjs-autoban/src/events/test-event.js', () => ({
            default: {
                name: 'once-event',
                once: true,
                execute: vi.fn()
            }
        }));

        await loadEvents(mockClient as unknown as CustomClient);
        
        const onceCalls = mockClient.once.mock.calls;
        expect(onceCalls.some((call: any[]) => call[0] === 'once-event')).toBe(true);
    });
});
