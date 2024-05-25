import { SlashCommandBuilder } from '@discordjs/builders'
import { ChatInputCommandInteraction } from 'discord.js'

module.exports = {
  /**
   * Shuffle slash command for music player
   */
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle songs in the queue'),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    const client = interaction.client
    await client.guildPlayerOrchestrator.shuffle(interaction)
  }
}
