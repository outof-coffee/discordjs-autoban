import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import 'dotenv/config';
import { loadEvents } from './handlers/eventHandler.js';
import { loadCommands } from './handlers/commandHandler.js';

// Extend the Client type to include commands
export interface CustomClient extends Client {
    commands: Collection<string, any>;
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Needed for permission checks
        GatewayIntentBits.GuildModeration, // Needed for ban/kick
        GatewayIntentBits.GuildMessages, // Needed to listen for messages
        GatewayIntentBits.MessageContent, // Needed to read message content for channel checking
    ]
}) as CustomClient;

// For command storage
client.commands = new Collection();

// Error handling to keep the process alive
client.on(Events.Error, (error) => console.error('Discord Client Error:', error));
process.on('unhandledRejection', (error) => console.error('Unhandled Promise Rejection:', error));

// Initialize loaders
async function init() {
    await loadEvents(client);
    await loadCommands(client);
    
    // Login with your bot token
    await client.login(process.env.DISCORD_TOKEN);
}

init();
