import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, ChatInputCommandInteraction } from 'discord.js';
import type { Interaction } from 'discord.js';
import { CustomClient } from '../index.js';
import { handleInteractionError } from '../utils/interactions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadEvents(client: CustomClient) {
    const eventsPath = path.join(__dirname, '../events');
    if (!fs.existsSync(eventsPath)) {
        fs.mkdirSync(eventsPath);
    }
    
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const module = await import(filePath);
        const event = module.default;
        
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }

    client.on('interactionCreate', async (interaction: Interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            await handleInteractionError(interaction, error);
        }
    });
}
