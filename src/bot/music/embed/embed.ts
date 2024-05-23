import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel
} from 'discord.js'
import { Queue, SongChoicesEmbed, YouTubeSearchResult } from '../model'
import row from './row'

/**
 * Get the now playing and queue embed for a given channel.
 * If they don't exist, create them.
 *
 * @param channel - The channel to get the embeds from
 * @returns An object containing the now playing and queue embed messages
 */
const getMusicEmbeds = async (channel: TextChannel) => {
  let nowPlaying, queue

  const messages = await channel.messages.fetch({ limit: 2 })
  for (const message of messages) {
    const author = message[1]?.embeds[0]?.author
    const title = message[1]?.embeds[0]?.title
    if (author?.name === 'Now Playing') {
      nowPlaying = message[1]
    }

    if (title === 'Queue') {
      queue = message[1]
    }
  }

  if (!nowPlaying) {
    nowPlaying = await channel.send({
      embeds: [await nothingPlaying()],
      components: [await row.resume()]
    })

    queue = await channel.send({
      embeds: [await queueEmbed([], 0)]
    })
  }

  if (!queue) {
    queue = await channel.send({
      embeds: [await queueEmbed([], 0)]
    })
  }

  return { nowPlayingEmbed: nowPlaying, queueEmbed: queue }
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
const nowPlaying = async (song: Queue) => {
  return new EmbedBuilder()
    .setColor('#d0342c')
    .setAuthor({ name: 'Now Playing' })
    .setTitle(song.title)
    .setURL(song.url)
    .setThumbnail(song.thumbnail)
    .setFooter({ text: song.user })
}

/**
 * Create a queue embed with the given song queue.
 * Display up to the next 3 songs and the last 2 songs.
 *
 * @param queue - The song queue
 * @param index - The current queue index
 * @returns A queue embed
 */
const queueEmbed = async (queue: Queue[], index: number) => {
  const embed = new EmbedBuilder().setColor('#d0342c').setTitle('Queue')

  let queueString = ''
  const previousSongs = queue.slice(Math.max(0, index - 2), index)
  const previousSongsCnt = Math.max(0, index - previousSongs.length)

  if (previousSongs.length >= 1) {
    let cnt = previousSongs.length
    queueString += '**Song History**\n\n'

    if (previousSongsCnt > 0) {
      queueString += `+ ${previousSongsCnt} other song(s)\n\n`
    }

    previousSongs.forEach((song) => {
      queueString += `${cnt}. ${song.title}\n\n`
      cnt--
    })
  }

  const nextSongs = queue.slice(index + 1, index + 4)
  // prettier-ignore
  const nextSongsCnt = Math.max(0, queue.length - 1 - (index + nextSongs.length))

  if (nextSongs.length >= 1) {
    queueString += '**Next in Queue**\n\n'

    let cnt = 1
    nextSongs.forEach((song) => {
      queueString += `${cnt}. ${song.title}\n\n`
      cnt++
    })

    if (nextSongsCnt > 0) {
      queueString += `+ ${nextSongsCnt} other song(s)`
    }
  }

  if (queueString) {
    embed.setDescription(queueString)
  } else {
    embed.setDescription('Nothing in Queue')
  }
  return embed
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

export default {
  getMusicEmbeds,
  nothingPlaying,
  nowPlaying,
  queueEmbed,
  songChoicesEmbed
}
