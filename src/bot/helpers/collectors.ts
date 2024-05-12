import { ButtonInteraction } from 'discord.js'
import client from '..'

const buttonCollector = async (interaction: ButtonInteraction) => {
  const playerSongChoices = [
    'music_choice_one',
    'music_choice_two',
    'music_choice_three'
  ]

  if (playerSongChoices.includes(interaction.customId)) {
    return await client.guildPlayerOrchestrator.addSongChoice(interaction)
  }
}

export { buttonCollector }
