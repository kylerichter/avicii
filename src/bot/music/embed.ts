import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js'
import { SongChoicesEmbed, YouTubeSearchResult } from './model'

/**
 * Create an embed of the YouTube query results.
 *
 * @param songs - The list of songs to display
 * @returns An object containing the embed and button components
 */
const songChoicesEmbed = async (
  songs: YouTubeSearchResult[]
): Promise<SongChoicesEmbed> => {
  let cnt = 1
  let songChoices = ''

  songs.forEach((song) => {
    songChoices += `${cnt}. **${song.snippet.channelTitle}**\n${song.snippet.title}\n\n`
    cnt++
  })

  const embed = new EmbedBuilder()
    .setColor('#d0342c')
    .setTitle('Select a Song to Add to Queue')
    .setDescription(songChoices.trimEnd())

  const buttonInfo = [
    { customId: 'music_choice_one', emoji: '1️⃣' },
    { customId: 'music_choice_two', emoji: '2️⃣' },
    { customId: 'music_choice_three', emoji: '3️⃣' }
  ]

  const buttons: ButtonBuilder[] = []
  buttonInfo.forEach((button) => {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(button.customId)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(button.emoji)
    )
  })

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    ...buttons
  )

  return { embeds: [embed], components: [buttonRow] }
}

export { songChoicesEmbed }
