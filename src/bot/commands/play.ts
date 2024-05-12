import { SlashCommandBuilder } from '@discordjs/builders'
import { ChatInputCommandInteraction } from 'discord.js'

module.exports = {
  /**
   * Sample command to show how to create a simple slash command.
   */
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song')
    .addStringOption((option) =>
      option
        .setName('song')
        .setDescription('Song name or URL to YouTube song/playlist')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    const client = interaction.client
    await client.guildPlayerOrchestrator.playSong(interaction)
  }
}
