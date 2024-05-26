import {
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
  VoiceChannel
} from 'discord.js'

export type Cache = {
  spotifyTracks: Record<string, CacheEntry>
  youtubeQueries: Record<string, CacheEntry>
  youtubeTracks: Record<string, CacheEntry>
}

export type CacheEntry = {
  song: Song
  lastAccessed?: number
}

export type CacheKind = 'spotifyTracks' | 'youtubeQueries' | 'youtubeTracks'

export type Queue = Song & {
  user: string
  userImage: string
}

export type Song = {
  title: string
  id: string
  duration: number
  durationString: string
  url: string
  thumbnail: string
}

export type SongChoice = {
  chatInteraction: ChatInputCommandInteraction
  channel: VoiceChannel
  message: Message
  songs: YouTubeSearchResult[]
  next: boolean
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
