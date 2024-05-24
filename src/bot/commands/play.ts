import { SlashCommandBuilder } from '@discordjs/builders'
import { ChatInputCommandInteraction } from 'discord.js'

module.exports = {
  /**
   * Play slash command for music player
   */
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song')
    .addStringOption((option) =>
      option
        .setName('song')
        .setDescription('Search query, YouTube URL, or Spotify URL')
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('next')
        .setDescription('Add track to the front of the queue')
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    const client = interaction.client
    await client.guildPlayerOrchestrator.playSong(interaction)
  }
}
