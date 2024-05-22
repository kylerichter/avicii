import {
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
  VoiceChannel
} from 'discord.js'

export type Song = {
  title: string
  id: string
  duration: number
  durationString: string
  url: string
  thumbnail: string
  user: string
}

export type SongChoice = {
  chatInteraction: ChatInputCommandInteraction
  channel: VoiceChannel
  message: Message
  songs: YouTubeSearchResult[]
}

export type SongChoicesEmbed = {
  embeds: EmbedBuilder[]
  components: ActionRowBuilder<ButtonBuilder>[]
}

export type YouTubeSearchResult = {
  kind: string
  etag: string
  id: { kind: string; videoId: string }
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    channelTitle: string
    liveBroadcastContent: string
    publishTime: string
  }
}
