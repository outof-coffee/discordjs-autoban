# DiscordJS AutoBan (TypeScript)

A specialized Discord bot designed to combat spam by immediately banning anyone who posts in a monitored channel, unless they are the guild owner or have a specific administrative role.

## Getting Started

### Prerequisites

- Node.js (v18.x or later)
- A Discord Bot Token and Client ID from the [Discord Developer Portal](https://discord.com/developers/applications).

### Installation

1. Clone the repository and navigate to the project root.
2. Copy `example.env` to `.env` and fill in your credentials:
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
