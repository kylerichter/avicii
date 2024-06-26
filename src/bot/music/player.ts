import {
  AudioPlayer,
  AudioPlayerStatus,
  PlayerSubscription,
  StreamType,
  VoiceConnection,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel
} from '@discordjs/voice'
import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client,
  Guild,
  GuildMember,
  Message,
  TextChannel,
  User,
  VoiceChannel
} from 'discord.js'
import _ from 'lodash'
import fs from 'node:fs'
import path from 'path'
import PlayerCache from './cache'
import embed from './embed/embed'
import row from './embed/row'
import { CacheEntry, Queue, Song, SongChoice } from './model'
import SpotifyClient from './spotify'
import { getPosition } from './util'
import YouTubeClient from './youTube'

/**
 * Represents a music player bound to a single guild.
 */
export default class GuildPlayer {
  guild: Guild
  private readonly _client: Client
  private _shutdownTimestamp = 0
  private _takeRequests = true
  private _cache: PlayerCache
  private _spotifyClient: SpotifyClient
  private _youTubeClient: YouTubeClient

  private _connection?: VoiceConnection
  private _player?: AudioPlayer
  private _subscription?: PlayerSubscription

  private _paused = false
  private _playing = false
  private _playTimestamp = 0
  private _elapsedTime = 0
  private _pauseTimestamp: number | null
  private _startTimestamp: number | null

  private _queue: Queue[] = []
  private _queueIndex = 0
  private _queuing = false
  private _musicChoiceQueue: SongChoice[] = []

  private _musicChannel?: TextChannel
  private _nowPlayingEmbed?: Message
  private _queueEmbed?: Message
  private _updateInterval: NodeJS.Timeout | null

  /**
   * Constructs a new GuildPlayer instance.
   *
   * @param client - The Client
   * @param guild - The guild for which to initialize a player
   * @param spotifyClient - A Spotify client
   * @param youTubeClient - A YouTube client
   */
  constructor(
    client: Client,
    guild: Guild,
    cache: PlayerCache,
    spotifyClient: SpotifyClient,
    youTubeClient: YouTubeClient
  ) {
    this._client = client
    this.guild = guild
    this._cache = cache
    this._spotifyClient = spotifyClient
    this._youTubeClient = youTubeClient
  }

  /**
   * Initalize GuildPlayer instance.
   * Set the music channel and now playing embed internally.
   *
   * @remarks
   *
   * This method should be called after constructing GuildPlayer to perform setup.
   */
  init = async () => {
    const guildData = await this._client.db.getGuild(this.guild.id)
    if (!guildData) return

    const { musicChannelId } = guildData
    if (!musicChannelId) return

    const channel = this._client.channels.cache.get(musicChannelId)
    if (channel) {
      this._musicChannel = channel as TextChannel
      const { nowPlayingEmbed, queueEmbed } = await embed.get(
        this._musicChannel
      )
      this._nowPlayingEmbed = nowPlayingEmbed
      this._queueEmbed = queueEmbed
    }

    if (this._nowPlayingEmbed) {
      await this._nowPlayingEmbed.edit({
        embeds: [await embed.nothingPlaying()],
        components: [await row.resume()]
      })
    }

    if (this._queueEmbed) {
      await this._queueEmbed.edit({
        embeds: [await embed.queue([], 0)]
      })
    }

    console.log(`GuildPlayer initialized for ${this.guild.name}`)
  }

  /**
   * Add song to queue and start playing if no song is currently playing or paused.
   *
   * @param song - The song to add
   * @param user - The user that requested the song
   * @param next - If the song should be played next or not
   * @returns None
   */
  private _addSongToQueue = async (
    song: Song,
    user: User,
    next: boolean = false
  ) => {
    const songData = {
      title: song.title,
      id: song.id,
      duration: song.duration,
      durationString: song.durationString,
      url: song.url,
      thumbnail: song.thumbnail,
      user: user.username,
      userImage: user.avatarURL() ?? ''
    }

    if (next && this._playing) {
      this._queue.splice(this._queueIndex + 1, 0, songData)
    } else {
      this._queue.push(songData)
    }

    if (!this._playing && !this._paused) {
      await this._playSong()
    }

    await this._updateQueueEmbed()
  }

  /**
   * Get a list of songs based on the Spotify link and add to queue.
   * Check the queue if the playlist ID exists.
   *
   * @param interaction - The interaction
   * @returns The number of songs added
   */
  private _addSpotify = async (interaction: ChatInputCommandInteraction) => {
    const song = interaction.options.getString('song')!
    const next = interaction.options.getBoolean('next') ?? false

    const playlistId = song.includes('playlist/')
      ? song.split('playlist/')[1].split('?si=')[0]
      : undefined

    if (!playlistId) {
      const albumId = song.includes('album/')
        ? song.split('album/')[1].split('?si=')[0]
        : undefined

      if (!albumId) {
        const songId = song.split('track/')[1].split('?si=')[0]
        return await this._addTrack(interaction, songId, next)
      }

      return await this._addAlbum(interaction, albumId)
    }

    return await this._addPlaylist(interaction, playlistId)
  }

  /**
   * Handle adding a Spotify album to the queue.
   *
   * @param interaction - The interaction to reply to
   * @param albumId - The Spotify album ID
   * @returns The number of songs added
   */
  private _addAlbum = async (
    interaction: ChatInputCommandInteraction,
    albumId: string
  ) => {
    const albumItems = await this._spotifyClient.getAlbumTracks(albumId)
    const songPromises = albumItems.map((query) => {
      return this._processSong(interaction, query)
    })

    const songs = (await Promise.all(songPromises)).filter(
      (song) => song !== null
    ) as CacheEntry[]

    return songs.length
  }

  /**
   * Handle adding a Spotify playist to the queue.
   *
   * @param interaction - The interaction to reply to
   * @param playlistId - The Spotify playlist ID
   * @returns The number of songs added
   */
  private _addPlaylist = async (
    interaction: ChatInputCommandInteraction,
    playlistId: string
  ) => {
    const playlistItems = await this._spotifyClient.getPlaylistItems(playlistId)
    const songPromises = playlistItems.map(async (query) => {
      return this._processSong(interaction, query)
    })

    const songs = (await Promise.all(songPromises)).filter(
      (song) => song !== null
    ) as CacheEntry[]

    return songs.length
  }

  /**
   * Handle adding a Spotify track to the queue.
   *
   * @param interaction - The interaction to reply to
   * @param songId - The Spotify song ID
   * @param next - If the song should be played next or not
   * @returns The number of songs added
   */
  private _addTrack = async (
    interaction: ChatInputCommandInteraction,
    songId: string,
    next: boolean
  ) => {
    let cacheEntry = await this._cache.get('spotifyTracks', songId)
    if (cacheEntry && !Array.isArray(cacheEntry)) {
      await this._addSongToQueue(cacheEntry.song, interaction.user, next)
      return 1
    }

    const query = await this._spotifyClient.getTrack(songId)
    cacheEntry = await this._cache.get('youtubeQueries', query)
    if (cacheEntry && !Array.isArray(cacheEntry)) {
      await this._addSongToQueue(cacheEntry.song, interaction.user, next)
      return 1
    }

    const songChoices = await this._youTubeClient.searchYoutube(query)
    const videoId = songChoices[0]?.id.videoId
    cacheEntry = await this._cache.get('youtubeTracks', videoId)
    if (cacheEntry && !Array.isArray(cacheEntry)) {
      await this._addSongToQueue(cacheEntry.song, interaction.user, next)
      return 1
    }

    let songInfo
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    try {
      songInfo = await this._youTubeClient.getYoutubeInfo(videoUrl)
    } catch (err) {
      console.error(`Error getting YouTube info for ${videoUrl}`, err)
      return 0
    }

    await this._youTubeClient.downloadSong(songInfo)
    const songData: CacheEntry = {
      song: {
        title: songInfo.title,
        id: songInfo.id,
        duration: songInfo.duration,
        durationString: songInfo.duration_string,
        url: songInfo.webpage_url,
        thumbnail: songInfo.thumbnail
      }
    }

    await this._addSongToQueue(songData.song, interaction.user, next)
    await this._cache.add('spotifyTracks', songId, songData)
    await this._cache.add('youtubeQueries', query, songData)
    await this._cache.add('youtubeTracks', videoId, songData)
    return 1
  }

  private _processSong = async (
    interaction: ChatInputCommandInteraction,
    query: { title: string; trackId: string }
  ) => {
    let cacheEntry = await this._cache.get('youtubeQueries', query.title)
    if (cacheEntry && !Array.isArray(cacheEntry)) {
      await this._addSongToQueue(cacheEntry.song, interaction.user)
      return cacheEntry
    }

    const songChoices = await this._youTubeClient.searchYoutube(query.title)
    const videoId = songChoices[0]?.id.videoId
    cacheEntry = await this._cache.get('youtubeTracks', videoId)
    if (cacheEntry && !Array.isArray(cacheEntry)) {
      await this._addSongToQueue(cacheEntry.song, interaction.user)
      return cacheEntry
    }

    let songInfo
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    try {
      songInfo = await this._youTubeClient.getYoutubeInfo(videoUrl)
    } catch (err) {
      console.error(`Error getting YouTube info for ${videoUrl}`, err)
      return null
    }

    await this._youTubeClient.downloadSong(songInfo)
    const songData: CacheEntry = {
      song: {
        title: songInfo.title,
        id: songInfo.id,
        duration: songInfo.duration,
        durationString: songInfo.duration_string,
        url: songInfo.webpage_url,
        thumbnail: songInfo.thumbnail
      }
    }

    await this._addSongToQueue(songData.song, interaction.user)
    await this._cache.add('spotifyTracks', query.trackId, songData)
    await this._cache.add('youtubeQueries', query.title, songData)
    await this._cache.add('youtubeTracks', videoId, songData)
    return songData
  }

  /**
   * Get a list of songs based on the YouTube link and add to queue.
   * Check the queue if the video or playlist ID exists.
   *
   * @param interaction - The interaction
   * @returns The number of songs added
   */
  private _addYoutube = async (interaction: ChatInputCommandInteraction) => {
    const song = interaction.options.getString('song')!
    const next = interaction.options.getBoolean('next') ?? false

    const playlistId = song.includes('&list=')
      ? song.split('&list=')[1].split('&index=')[0]
      : undefined

    if (!playlistId) {
      const videoId = song.split('?v=')[1]
      const cacheEntry = await this._cache.get('youtubeTracks', videoId)
      if (cacheEntry && !Array.isArray(cacheEntry)) {
        await this._addSongToQueue(cacheEntry.song, interaction.user, next)
        return 1
      }

      let songInfo
      try {
        songInfo = await this._youTubeClient.getYoutubeInfo(song)
      } catch (err) {
        console.error(`Error getting YouTube info for ${song}`, err)
        return 0
      }

      await this._youTubeClient.downloadSong(songInfo)
      const songData: CacheEntry = {
        song: {
          title: songInfo.title,
          id: songInfo.id,
          duration: songInfo.duration,
          durationString: songInfo.duration_string,
          url: songInfo.webpage_url,
          thumbnail: songInfo.thumbnail
        }
      }

      await this._addSongToQueue(songData.song, interaction.user, next)
      await this._cache.add('youtubeTracks', videoId, songData)
      return 1
    }

    const playlistItems =
      await this._youTubeClient.searchYoutubePlaylist(playlistId)
    const songPromises = playlistItems.map(async (item) => {
      let cacheEntry = await this._cache.get('youtubeTracks', item)
      if (cacheEntry && !Array.isArray(cacheEntry)) {
        await this._addSongToQueue(cacheEntry.song, interaction.user)
        return cacheEntry
      }

      let songInfo
      const videoUrl = `https://www.youtube.com/watch?v=${item}`
      try {
        songInfo = await this._youTubeClient.getYoutubeInfo(videoUrl)
      } catch (err) {
        console.error(`Error getting YouTube info for ${videoUrl}`, err)
        return null
      }

      await this._youTubeClient.downloadSong(songInfo)
      const songData: CacheEntry = {
        song: {
          title: songInfo.title,
          id: songInfo.id,
          duration: songInfo.duration,
          durationString: songInfo.duration_string,
          url: songInfo.webpage_url,
          thumbnail: songInfo.thumbnail
        }
      }

      await this._addSongToQueue(songData.song, interaction.user)
      await this._cache.add('youtubeTracks', item, songData)
      return songData
    })

    const songs = (await Promise.all(songPromises)).filter(
      (song) => song !== null
    ) as CacheEntry[]

    return songs.length
  }

  /**
   * Create a connection to the given voice channel.
   *
   * @param channel - The voice channel to connect to
   * @returns None
   */
  private _createConnection = async (channel: VoiceChannel) => {
    this._player = createAudioPlayer()
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator
    })

    this._connection = connection
    this._subscription = this._connection.subscribe(this._player)
    this._player.on(AudioPlayerStatus.Idle, this._onPlayerIdle)

    this._connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000)
        ])
        // Seems to be reconnecting to a new channel - ignore disconnect
      } catch (error) {
        // Seems to be a real disconnect which SHOULDN'T be recovered from
        await this._destroyConnection()
      }
    })
  }

  /**
   * Destroy the current connection and set the player to a clean state.
   *
   * @returns None
   */
  private _destroyConnection = async () => {
    if (this._queuing) return

    this._player?.stop()
    this._player = undefined

    this._subscription?.unsubscribe()
    this._subscription = undefined

    this._connection?.destroy()
    this._connection = undefined

    this._playing = false
    this._elapsedTime = 0
    this._pauseTimestamp = null
    this._startTimestamp = null

    this._queue = []
    this._queueIndex = 0
    this._musicChoiceQueue = []
    clearInterval(this._updateInterval ?? 0)

    await this._nowPlayingEmbed?.edit({
      embeds: [await embed.nothingPlaying()],
      components: [await row.resume()]
    })

    await this._queueEmbed?.edit({
      embeds: [await embed.queue([], 0)]
    })
  }

  /**
   * Send an embed of the songs returned by YouTube query.
   *
   * @param interaction - The interaction to reply to
   * @param channel - The voice channel to join
   * @param song - The song to query on YouTube
   * @returns An embed of the YouTube search results
   */
  private _getSongChoices = async (
    interaction: ChatInputCommandInteraction,
    channel: VoiceChannel,
    song: string
  ) => {
    const songChoices = await this._youTubeClient.searchYoutube(song)
    if (songChoices.length === 0) {
      return await interaction.editReply({
        content: 'Something went wrong!'
      })
    }

    const songChoiceEmbed = await embed.songChoices(songChoices)
    const message = await interaction.editReply(songChoiceEmbed)
    const next = interaction.options.getBoolean('next') ?? false

    this._musicChoiceQueue.push({
      chatInteraction: interaction,
      channel: channel,
      message: message,
      songs: songChoices,
      next
    })
  }

  /**
   * Executed when player finishes playing an audio resource.
   * Start the next song or destroy the connection.
   *
   * @returns None
   */
  private _onPlayerIdle = async () => {
    this._playing = false
    if (this._queue.length && this._queueIndex < this._queue.length - 1) {
      this._queueIndex++
      await this._playSong()
    } else {
      await new Promise((r) => setTimeout(r, 5000))
      await this._destroyConnection()
    }
  }

  /**
   * Play the song at the current index in the queue.
   * Update the now playing embed with the current song.
   *
   * @returns None
   */
  private _playSong = async () => {
    const baseFilePath = '../../../cache'
    const song = this._queue[this._queueIndex]

    //prettier-ignore
    const webmFilePath = path.join(__dirname,`${baseFilePath}/song-${song.id}.webm`)
    //prettier-ignore
    const mkvFilePath = path.join(__dirname,`${baseFilePath}/song-${song.id}.webm.mkv`)

    let songFilePath: string
    let inputType: StreamType

    try {
      await fs.promises.access(webmFilePath)
      songFilePath = webmFilePath
      inputType = StreamType.WebmOpus
    } catch (err) {
      songFilePath = mkvFilePath
      inputType = StreamType.Opus
    }

    const resource = createAudioResource(songFilePath, { inputType })
    this._player?.play(resource)
    this._playTimestamp = Date.now()
    this._startTimestamp = Date.now()
    this._elapsedTime = 0
    this._playing = true

    if (this._updateInterval) clearInterval(this._updateInterval)
    this._updateInterval = setInterval(async () => {
      if (this._playing) {
        await this._updateNowPlayingEmbed('pause')
      }
    }, 10000)

    await this._updateNowPlayingEmbed('pause')
    await this._updateQueueEmbed()
  }

  /**
   * Update the now playing embed with the current song.
   * Debounced to prevent spamming the API.
   *
   * @param component - The row component to use
   * @returns None
   */
  private _updateNowPlayingEmbed = _.debounce(
    async (component: 'pause' | 'resume') => {
      if (this._nowPlayingEmbed) {
        const song = this._queue[this._queueIndex]

        await this._nowPlayingEmbed?.edit({
          embeds: [
            await embed.nowPlaying(
              song,
              await getPosition(
                this._elapsedTime,
                this._paused,
                this._startTimestamp
              )
            )
          ],
          components: [
            component === 'pause' ? await row.pause() : await row.resume()
          ]
        })
      }
    },
    5000,
    { leading: true, trailing: true }
  )

  /**
   * Update the queue embed with the current queue.
   * Debounced to prevent spamming the API.
   *
   * @returns None
   */
  private _updateQueueEmbed = _.debounce(
    async () => {
      if (this._queueEmbed) {
        await this._queueEmbed.edit({
          embeds: [await embed.queue(this._queue, this._queueIndex)]
        })
      }
    },
    5000,
    { leading: true, trailing: true }
  )

  /**
   * Return if the player is currently playing.
   *
   * @returns True if the player is playing, otherwise False
   */
  isPlaying = () => {
    return this._playing
  }

  /**
   * Return if the player is currently playing.
   *
   * @returns True if the player is playing, otherwise False
   */
  processShutdown = () => {
    this._takeRequests = false
    this._shutdownTimestamp = Date.now()
  }

  /**
   * Determine the song chosen and add it to the queue.
   *
   * @param interaction - The button interaction to reply to
   * @returns Interaction update
   */
  addChoice = async (interaction: ButtonInteraction) => {
    const messageId = interaction.message.id
    const choiceQueue = this._musicChoiceQueue.find(
      (choiceQueue) => choiceQueue.message.id === messageId
    )

    if (!choiceQueue) {
      return await interaction.update({
        content: 'Something went wrong!',
        embeds: [],
        components: []
      })
    }

    const { channel, next, songs } = choiceQueue
    let song
    switch (interaction.customId) {
      case 'music_choice_one':
        song = songs[0]
        break
      case 'music_choice_two':
        song = songs[1]
        break
      case 'music_choice_three':
        song = songs[2]
        break
    }

    if (!this._player) await this._createConnection(channel)
    this._queuing = true
    await interaction.update({
      content: 'Adding song to queue!',
      embeds: [],
      components: []
    })

    let songInfo
    const songUrl = `https://www.youtube.com/watch?v=${song?.id.videoId}`
    try {
      songInfo = await this._youTubeClient.getYoutubeInfo(songUrl)
    } catch (err) {
      console.log(`Error getting YouTube info for ${songUrl}`, err)
      this._queuing = false
      return await interaction.update({
        content: 'Something went wrong!',
        embeds: [],
        components: []
      })
    }

    await this._youTubeClient.downloadSong(songInfo)
    const songData = {
      title: songInfo.title,
      id: songInfo.id,
      duration: songInfo.duration,
      durationString: songInfo.duration_string,
      url: songInfo.webpage_url,
      thumbnail: songInfo.thumbnail
    }

    await this._addSongToQueue(songData, interaction.user, next)

    this._queuing = false
    await interaction.update({
      content: 'Added song to queue!',
      embeds: [],
      components: []
    })
  }

  /**
   * Restart current playing song or go back to previous song.
   * If within 10 seconds of playTimestamp go back, else restart current song.
   *
   * @param interaction - The button interaction to reply to
   * @returns Interaction reply
   */
  back = async (interaction: ButtonInteraction) => {
    if (!this._player) {
      return await interaction.editReply({
        content: 'Nothing is playing!'
      })
    }

    let reply = 'Restarted Song!'
    const timeDiff = (Date.now() - this._playTimestamp) / 1000
    if (timeDiff < 10) {
      if (this._queueIndex === 0) {
        return await interaction.editReply({
          content: "Can't go back any further!"
        })
      }

      reply = 'Went back a song!'
      this._queueIndex--
    }

    await this._playSong()

    return await interaction.editReply({
      content: reply
    })
  }

  /**
   * Clear the songs in the queue after the current playing song.
   *
   * @param interaction - The interaction to reply to
   * @returns Interaction reply
   */
  clear = async (interaction: ChatInputCommandInteraction) => {
    if (!this._player) {
      return await interaction.editReply({
        content: 'Nothing is playing!'
      })
    }

    if (this._queueIndex >= this._queue.length - 1) {
      return await interaction.editReply({
        content: 'No songs in queue to clear!'
      })
    }

    this._queue = this._queue.slice(0, this._queueIndex + 1)
    await this._updateQueueEmbed()

    return await interaction.editReply({
      content: 'Cleared queue!'
    })
  }

  /**
   * Add songs to the music queue. If no song is playing and the player is not paused,
   * it will be played right away.
   *
   * @param interaction - The interaction to reply to
   * @returns Interaction reply
   */
  play = async (interaction: ChatInputCommandInteraction) => {
    const member = interaction.member as GuildMember
    const channel = member.voice.channel as VoiceChannel
    const song = interaction.options.getString('song')

    if (!channel) {
      return await interaction.editReply({
        content: 'You must be connected to a voice channel!'
      })
    }

    if (!this._takeRequests) {
      return await interaction.editReply({
        content: `No more requests can be taken. The bot will restart <t:${Math.floor((this._shutdownTimestamp + 10 * 60 * 1000) / 1000)}:R>`
      })
    }

    if (!song) {
      return await interaction.editReply({
        content: 'Something went wrong!'
      })
    }

    if (!song.includes('youtube.com') && !song.includes('spotify.com')) {
      return await this._getSongChoices(interaction, channel, song)
    }

    this._queuing = true
    await interaction.editReply({
      content: 'Adding songs to queue!'
    })

    if (!this._player) await this._createConnection(channel)

    let songsAdded = 0
    if (song.includes('spotify.com')) {
      songsAdded = await this._addSpotify(interaction)
    }

    if (song.includes('youtube.com')) {
      songsAdded = await this._addYoutube(interaction)
    }

    this._queuing = false

    if (songsAdded === 0 && song.includes('spotify.com')) {
      return await interaction.editReply({
        content: 'No tracks found. Is the playlist private?'
      })
    }

    return await interaction.editReply({
      content: `Added ${songsAdded} ${songsAdded > 1 ? 'songs' : 'song'} to queue!`
    })
  }

  /**
   * Shuffle the songs in the queue.
   *
   * @param interaction - The interaction to reply to
   * @returns Interaction reply
   */
  shuffle = async (interaction: ChatInputCommandInteraction) => {
    if (!this._player) {
      return await interaction.editReply({
        content: 'Nothing is playing!'
      })
    }

    const nextSongs = this._queue.slice(this._queueIndex + 1)
    if (nextSongs.length < 3) {
      return await interaction.editReply({
        content: 'Not enough songs to shuffle!'
      })
    }

    const shuffledSongs = _.shuffle(nextSongs)
    this._queue.splice(this._queueIndex + 1, nextSongs.length, ...shuffledSongs)
    await this._updateQueueEmbed()

    return await interaction.editReply({
      content: 'Shuffled queue!'
    })
  }

  /**
   * Skip current playing song, stop playing if last song in queue.
   *
   * @param interaction - The button interaction to reply to
   * @returns Interaction reply
   */
  skip = async (interaction: ButtonInteraction) => {
    if (!this._player) {
      return await interaction.editReply({
        content: 'Nothing is playing!'
      })
    }

    if (this._queueIndex < this._queue.length - 1) {
      this._queueIndex++
      await this._playSong()

      return await interaction.editReply({
        content: 'Skipped song!'
      })
    }

    await this._destroyConnection()
    return await interaction.editReply({
      content: 'Stopped playing!'
    })
  }

  /**
   * Stop the music player and destroy the connection.
   *
   * @param interaction - The interaction to reply to
   * @returns Interaction reply
   */
  stop = async (interaction: ChatInputCommandInteraction) => {
    if (!this._connection) {
      return await interaction.editReply({
        content: 'Nothing is playing!'
      })
    }

    await this._destroyConnection()
    return await interaction.editReply({
      content: 'Stopped playing!'
    })
  }

  /**
   * Pause/resume the current playing song.
   * Update the now playing embed buttons appropriately.
   *
   * @param interaction - The button interaction to reply to
   * @returns Interaction update
   */
  toggle = async (interaction: ButtonInteraction) => {
    if (!this._player) {
      return await interaction.editReply({
        content: 'Nothing is currently playing! Add a song with `/play`'
      })
    }

    if (this._paused) {
      this._player?.unpause()
      this._paused = false
      this._playing = true
      this._startTimestamp = Date.now()
      this._pauseTimestamp = null

      await this._updateNowPlayingEmbed('pause')

      await interaction.editReply({
        content: 'Resumed playing!'
      })
    } else {
      this._player?.pause()
      this._paused = true
      this._playing = false

      this._pauseTimestamp = Date.now()
      this._elapsedTime +=
        this._pauseTimestamp - (this._startTimestamp ?? -this._pauseTimestamp)

      await this._updateNowPlayingEmbed('resume')

      await interaction.editReply({
        content: 'Paused song!'
      })
    }
  }
}
