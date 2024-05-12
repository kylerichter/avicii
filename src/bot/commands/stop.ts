import { SlashCommandBuilder } from '@discordjs/builders'
import { ChatInputCommandInteraction } from 'discord.js'

module.exports = {
  /**
   * Stop slash command for music player
   */
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playing'),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    const client = interaction.client
    await client.guildPlayerOrchestrator.stopSong(interaction)
  }
}
