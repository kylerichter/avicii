import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel
} from 'discord.js'
import { Song, SongChoicesEmbed, YouTubeSearchResult } from '../model'
import row from './row'

/**
 * Get the now playing embed for a given channel.
 * If it doesn't exist, create one.
 *
 * @returns A message containing the now playing embed
 */
const getMusicEmbeds = async (channel: TextChannel) => {
  let nowPlayingEmbed

  const messages = await channel.messages.fetch({ limit: 2 })
  for (const message of messages) {
    const author = message[1]?.embeds[0]?.author
    if (author?.name === 'Now Playing') {
      nowPlayingEmbed = message[1]
    }
  }

  if (!nowPlayingEmbed) {
    nowPlayingEmbed = await channel.send({
      embeds: [await nothingPlaying()],
      components: [await row.resume()]
    })
  }

  return nowPlayingEmbed
}

/**
 * Create an empty now playing embed.
 *
 * @returns An empty now playing embed
 */
const nothingPlaying = async () => {
  return new EmbedBuilder()
    .setColor('#d0342c')
    .setAuthor({ name: 'Now Playing' })
    .setTitle('Add a song with /play')
}

/**
 * Create a now playing embed with the given song info.
 *
 * @param song - The song playing
 * @returns A now playing embed
 */
const nowPlaying = async (song: Song) => {
  return new EmbedBuilder()
    .setColor('#d0342c')
    .setAuthor({ name: 'Now Playing' })
    .setTitle(song.title)
    .setURL(song.url)
    .setThumbnail(song.thumbnail)
    .setFooter({ text: song.user })
}

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

export default { getMusicEmbeds, nothingPlaying, nowPlaying, songChoicesEmbed }
