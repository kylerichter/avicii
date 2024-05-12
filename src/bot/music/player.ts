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
  ChatInputCommandInteraction,
  Client,
  Guild,
  GuildMember,
  VoiceChannel
} from 'discord.js'
import fs from 'node:fs'
import path from 'path'
import { Payload } from 'youtube-dl-exec'
import YouTubeClient from './youTube'

const baseFilePath = '../../files'

/**
 * Represents a music player bound to a single guild.
 */
export default class GuildPlayer {
  guild: Guild
  private readonly _client: Client
  private _youTubeClient: YouTubeClient

  private _connection?: VoiceConnection
  private _player?: AudioPlayer
  private _subscription?: PlayerSubscription

  private _paused = false
  private _playing = false
  private _queue: string[] = []
  private _queueIndex = 0

  /**
   * Constructs a new GuildPlayer instance.
   *
   * @param client - The Client
   * @param guild - The guild for which to initialize a player
   */
  constructor(client: Client, guild: Guild, youTubeClient: YouTubeClient) {
    this._client = client
    this.guild = guild
    this._youTubeClient = youTubeClient
  }

  /**
   * Initalize GuildPlayer instance.
   *
   * @remarks
   *
   * This method should be called after constructing GuildPlayer to perform setup.
   */
  init = async () => {
    console.log(`GuildPlayer initialized for ${this.guild.name}`)
  }

  /**
   * Add song(s) to queue and start playing if no song is currently playing or paused.
   *
   * @param urls - The list of song(s) to add
   * @returns Number of songs added to queue
   */
  private _addSongsToQueue = async (urls: string[]) => {
    let songsAdded = 0
    for (const url of urls) {
      try {
        var songInfo = await this._youTubeClient.getYoutubeInfo(url)
      } catch (err) {
        console.log(`Error getting YouTube info for ${url}`, err)
        continue
      }

      await this._downloadSong(songInfo)

      this._queue.push(songInfo.id)
      songsAdded++

      if (!this._playing && !this._paused) {
        await this._playSong()
      }
    }

    return songsAdded
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
   * Destroy the currect connection and set the player to a clean state.
   *
   * @returns None
   */
  private _destroyConnection = async () => {
    this._player?.stop()
    this._player = undefined

    this._subscription?.unsubscribe()
    this._subscription = undefined

    this._connection?.destroy()
    this._connection = undefined

    this._playing = false

    // TODO: delete song files

    this._queue = []
    this._queueIndex = 0
  }

  /**
   * Download song from YouTube.
   *
   * @param songInfo - The YouTube song info to download
   * @returns None
   */
  private _downloadSong = async (songInfo: Payload) => {
    await fs.promises.writeFile(
      path.join(__dirname, `${baseFilePath}/videoInfo-${songInfo.id}.json`),
      JSON.stringify(songInfo)
    )

    await this._youTubeClient.getFromInfo(
      path.join(__dirname, `${baseFilePath}/videoInfo-${songInfo.id}.json`),
      {
        listThumbnails: true
      }
    )

    await this._youTubeClient.getFromInfo(
      path.join(__dirname, `${baseFilePath}/videoInfo-${songInfo.id}.json`),
      {
        output: path.join(__dirname, `${baseFilePath}/song-${songInfo.id}.webm`)
      }
    )
  }

  /**
   * Get the list of songs to search on YouTube.
   * If given a YouTube link to a playlist, get all the songs in the playlist.
   *
   * @param url - The song or playlist to search on YouTube
   * @returns Array of song(s) to search
   */
  private _getSearchList = async (url: string) => {
    const playlistId = url.includes('&list=')
      ? url.split('&list=')[1].split('&index=')[0]
      : undefined

    const playlistResults = playlistId
      ? await this._youTubeClient.searchYoutubePlaylist(playlistId)
      : undefined

    return playlistResults ?? [url]
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
   *
   * @returns None
   */
  private _playSong = async () => {
    const songId = this._queue[this._queueIndex]

    //prettier-ignore
    const webmFilePath = path.join(__dirname,`${baseFilePath}/song-${songId}.webm`)
    //prettier-ignore
    const mkvFilePath = path.join(__dirname,`${baseFilePath}/song-${songId}.webm.mkv`)

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
    this._playing = true
  }

  /**
   * Add songs to the music queue. If no song is playing and the player is not paused,
   * it will be played right away.
   *
   * @param interaction - The interaction to reply to
   * @returns Interaction reply
   */
  playSong = async (interaction: ChatInputCommandInteraction) => {
    const member = interaction.member as GuildMember
    const channel = member.voice.channel as VoiceChannel
    const song = interaction.options.getString('song')

    if (!channel) {
      return interaction.editReply({
        content: 'You must be connected to a voice channel!'
      })
    }

    if (!song) {
      return interaction.editReply({
        content: 'Something went wrong!'
      })
    }

    if (!song.includes('youtube.com')) {
      // TODO: get song choices
    }

    const songUrls = await this._getSearchList(song)

    await interaction.editReply({
      content:
        songUrls.length > 1 ? 'Adding songs to queue!' : 'Adding song to queue!'
    })

    if (!this._player) await this._createConnection(channel)

    const songsAdded = await this._addSongsToQueue(songUrls)

    return interaction.editReply({
      content: `Added ${songsAdded} ${songsAdded > 1 ? 'songs' : 'song'} to queue!`
    })
  }
}
