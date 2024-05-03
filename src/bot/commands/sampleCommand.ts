import { SlashCommandBuilder } from '@discordjs/builders'
import { ChatInputCommandInteraction } from 'discord.js'

module.exports = {
  /**
   * Sample command to show how to create a simple slash command.
   */
  data: new SlashCommandBuilder()
    .setName('sample-command')
    .setDescription('sample slash command'),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: 'Hello!' })
  }
}
