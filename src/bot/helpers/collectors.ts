import { ButtonInteraction } from 'discord.js'
import client from '..'

const buttonCollector = async (interaction: ButtonInteraction) => {
  const playerControlChoices = ['music_back', 'music_toggle', 'music_skip']

  const playerSongChoices = [
    'music_choice_one',
    'music_choice_two',
    'music_choice_three'
  ]

  if (playerSongChoices.includes(interaction.customId)) {
    return await client.guildPlayerOrchestrator.addChoice(interaction)
  }

  if (playerControlChoices.includes(interaction.customId)) {
    return await _musicCollector(interaction)
  }
}

const _musicCollector = async (interaction: ButtonInteraction) => {
  switch (interaction.customId) {
    case 'music_back':
      await interaction.deferReply({ ephemeral: true })
      await client.guildPlayerOrchestrator.back(interaction)
      break
    case 'music_toggle':
      await interaction.deferReply({ ephemeral: true })
      await client.guildPlayerOrchestrator.toggle(interaction)
      break
    case 'music_skip':
      await interaction.deferReply({ ephemeral: true })
      await client.guildPlayerOrchestrator.skip(interaction)
      break
  }
}

export { buttonCollector }
