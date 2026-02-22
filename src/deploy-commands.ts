import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
    const module = await import(filePath);
    const command = module.default;
	if ('data' in command && 'execute' in command) {
		commands.push(command.data.toJSON());
	}
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Register global commands
		const data = await rest.put(
			Routes.applicationCommands(process.env.CLIENT_ID!),
			{ body: commands },
		) as any[];

        // If you need guild-specific commands for testing, use:
        // const data = await rest.put(
        //     Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
        //     { body: commands },
        // ) as any[];

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();
