import { BaseInteraction } from 'discord.js'

module.exports = {
  /**
   * Emitted when an interaction is created.
   *
   * @param interaction - The interaction which was created
   */
  name: 'interactionCreate',
  async execute(interaction: BaseInteraction) {
    if (!interaction.isCommand()) return

    const command = interaction.client.commands.get(interaction.commandName)
    if (!command) return

    try {
      await command.execute(interaction)
    } catch (error) {
      console.error('interactionCreate error', error)
      interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true
      })
    }
  }
}
