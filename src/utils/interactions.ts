import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';

/**
 * Handles errors that occur during interaction execution.
 * Logs the error and sends an ephemeral reply if no response has been sent.
 */
export async function handleInteractionError(interaction: ChatInputCommandInteraction, error: unknown) {
    console.error(error);
    
    if (!interaction.replied && !interaction.deferred) {
        try {
            await interaction.reply({ 
                content: 'There was an error while executing this command!', 
                flags: [MessageFlags.Ephemeral] 
            });
        } catch (replyError) {
            console.error('Failed to send error reply:', replyError);
        }
    }
}
