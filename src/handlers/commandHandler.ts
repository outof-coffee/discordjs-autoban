import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CustomClient } from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadCommands(client: CustomClient) {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const module = await import(filePath);
        const command = module.default;
        
        // Add to client commands collection
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }
}
