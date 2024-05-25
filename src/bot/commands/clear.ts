import { SlashCommandBuilder } from '@discordjs/builders'
import { ChatInputCommandInteraction } from 'discord.js'

module.exports = {
  /**
   * Clear queue slash command for music player
   */
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear queue'),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    const client = interaction.client
    await client.guildPlayerOrchestrator.clear(interaction)
  }
}
