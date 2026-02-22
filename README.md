# DiscordJS AutoBan (TypeScript)

A specialized Discord bot designed to combat spam by immediately banning anyone who posts in a monitored channel, unless they are the guild owner or have a specific administrative role.

## Core Features

- **Automated Anti-Spam**: Monitors a single specified channel and bans unauthorized users (including other bots) upon their first message.
- **Fail-Safe Mechanism**: The bot defaults to an "off" state when joining a guild to prevent accidental mass-bans.
- **Recent Ban History**: Tracks the last 10 auto-bans per guild, viewable via command.
- **Quick Unban**: Allows administrators to unban users caught by the system by their User ID or their index in the recent bans list.
- **Synchronous JSON Storage**: Uses `lowdb` for simple, lightweight, per-guild configuration.
- **Restricted Access**: All management commands are limited to the Guild Owner and members with a configurable admin role.

## Architecture & Design

This bot is built with **simplicity** and **modularity** as its primary goals. It avoids over-engineered frameworks in favor of straightforward, type-safe TypeScript implementation.

### Key Components

- **`src/models/GuildConfig.ts`**: A wrapper class that encapsulates the auto-ban logic (`shouldBan`). This provides a single point of truth for whether a message author should be banned.
- **`src/utils/db.ts`**: A synchronous API for loading and saving guild settings using `lowdb` with lazy initialization and test isolation.
- **`src/utils/interactions.ts`**: A utility for consistent, ephemeral error reporting during command execution.
- **`src/events/messageCreate.ts`**: The core listener that executes the auto-ban logic.
- **`src/commands/autoban.ts`**: A unified command structure for managing the bot's configuration, status, and ban history.

## Quality Assurance

The project maintains high reliability through a comprehensive unit test suite powered by **Vitest**.

### Testing Strategy

- **Unit Testing**: Focuses on custom logic in isolation (Models, Utils, Handlers, Events, and Commands).
- **Mocking**: Utilizes `vi.mock` to simulate Discord.js objects and environment side-effects (File System, Database).
- **Clean Architecture**: Code is refactored for testability, avoiding global state and using lazy initialization for database access.

### Running Tests

- **Run all tests**: `npm run test`
- **Build verification**: `npm run build` (Ensures type safety and excludes testing artifacts from the production `dist/` folder).

## Getting Started

### Prerequisites

- Node.js (v18.x or later)
- A Discord Bot Token and Client ID from the [Discord Developer Portal](https://discord.com/developers/applications).

### Installation

1. Clone the repository and navigate to the project root.
2. Copy `.env.example` to `.env` and fill in your credentials:
   ```env
   DISCORD_TOKEN=your_token_here
   CLIENT_ID=your_client_id_here
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Deploy the slash commands globally:
   ```bash
   npm run deploy
   ```

### Running the Bot

- **Development**: `npm run dev` (uses `ts-node` and `nodemon`).
- **Production**: `npm run build` followed by `npm start`.

## Usage & Configuration

### Initial Setup

When the bot first joins a guild, it is **disabled** and **unconfigured**.

1. **Set Admin Role**: Choose a role whose members can manage the bot.
   `/autoban config-role role:@Admin`
2. **Set Monitored Channel**: Choose the channel where any message will trigger an auto-ban.
   `/autoban config-channel channel:#mine-field`
3. **Enable the Bot**: Toggle the functionality on.
   `/autoban toggle enabled:True`

### Auto-Ban Mechanism

- **Who is Banned?**: Any user or bot who posts in the monitored channel.
- **Who is Immune?**: The Guild Owner and members with the configured Admin Role.
- **Action Taken**: The user is immediately banned from the guild, and their messages from the last 24 hours are deleted.
- **Role Hierarchy Note**: Ensure the bot's role is high enough in the hierarchy to ban the target users. Discord's hierarchy prevents the bot from banning members (including other bots) with a role higher than or equal to the bot's own role.

### Commands

The `/autoban` command is the central hub for all bot operations.

- **`status`**: Displays the bot's current enabled state and the list of the last 10 auto-bans.
- **`unban <target>`**: Reverses an auto-ban using a User ID or an index (1-10) from the status list.
- **`config-role <role>`**: Updates the administrative role for the bot.
- **`config-channel <channel>`**: Updates the channel being monitored for posts.
- **`toggle <enabled>`**: Enables or disables the auto-ban functionality.

## Development Notes

### Type Safety
The project uses a `CustomClient` interface to extend the base Discord.js `Client`, providing a type-safe `commands` collection. All interaction responses use `MessageFlags.Ephemeral` as per modern Discord.js standards (avoiding the deprecated `ephemeral: true`).

### Database
Guild data is stored in `db.json` at the project root. The structure is keyed by Guild ID and is handled synchronously to ensure data integrity during configuration updates.
