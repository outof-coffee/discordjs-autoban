import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import { RawGuildConfig, GuildConfig } from '../models/GuildConfig.js';

interface Data {
    guilds: Record<string, RawGuildConfig>;
}

const defaultData: Data = { guilds: {} };
const adapter = new JSONFileSync<Data>('db.json');
const db = new LowSync<Data>(adapter, defaultData);

let initialized = false;

/**
 * Lazily initializes and returns the database instance.
 */
export function getDb(): LowSync<Data> {
    if (!initialized) {
        db.read();
        if (!db.data) {
            db.data = defaultData;
            db.write();
        }
        initialized = true;
    }
    return db;
}

/**
 * Resets the initialized state of the database for test isolation.
 */
export function clearDbCache(): void {
    initialized = false;
}

/**
 * Gets the configuration for a specific guild.
 * Returns a GuildConfig wrapper or a default one if not found.
 */
export function getGuildConfig(guildId: string): GuildConfig {
    const database = getDb();
    const raw: RawGuildConfig = database.data.guilds[guildId] || {
        adminRoleId: null,
        monitoredChannelId: null,
        enabled: false,
        recentBans: []
    };
    // Ensure recentBans exists if the record was created before this change
    if (!raw.recentBans) {
        raw.recentBans = [];
    }
    return new GuildConfig(raw);
}

/**
 * Saves the configuration for a specific guild.
 */
export function saveGuildConfig(guildId: string, config: RawGuildConfig): void {
    const database = getDb();
    database.data.guilds[guildId] = config;
    database.write();
}

export default db;
