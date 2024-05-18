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
  VoiceChannel
} from 'discord.js'
import fs from 'node:fs'
import path from 'path'
import { Payload } from 'youtube-dl-exec'
import embed from './embed/embed'
import row from './embed/row'
import { Song, SongChoice } from './model'
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
  private _queue: Song[] = []
  private _queueIndex = 0
  private _musicChoiceQueue: SongChoice[] = []

  private _musicChannel?: TextChannel
  private _nowPlayingEmbed?: Message

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
      this._nowPlayingEmbed = await embed.getMusicEmbeds(this._musicChannel)
    }

    if (this._nowPlayingEmbed) {
      await this._nowPlayingEmbed.edit({
        embeds: [await embed.nothingPlaying()],
        components: [await row.resume()]
      })
    }

    console.log(`GuildPlayer initialized for ${this.guild.name}`)
  }

  /**
   * Add song(s) to queue and start playing if no song is currently playing or paused.
   *
   * @param urls - The list of song(s) to add
   * @param user - The user that requested the song
   * @returns Number of songs added to queue
   */
  private _addSongsToQueue = async (urls: string[], user: string) => {
    let songsAdded = 0
    for (const url of urls) {
      try {
        var songInfo = await this._youTubeClient.getYoutubeInfo(url)
      } catch (err) {
        console.log(`Error getting YouTube info for ${url}`, err)
        continue
      }

      await this._downloadSong(songInfo)

      this._queue.push({
        title: songInfo.title,
        id: songInfo.id,
        url: songInfo.webpage_url,
        thumbnail: songInfo.thumbnail,
        user: user
      })
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
   * Destroy the current connection and set the player to a clean state.
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
    this._musicChoiceQueue = []

    await this._nowPlayingEmbed?.edit({
      embeds: [await embed.nothingPlaying()],
      components: [await row.resume()]
    })
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
    const songChoiceEmbed = await embed.songChoicesEmbed(songChoices)
    const message = await interaction.editReply(songChoiceEmbed)

    this._musicChoiceQueue.push({
      chatInteraction: interaction,
      channel: channel,
      message: message,
      songs: songChoices
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
    this._playing = true

    await this._nowPlayingEmbed?.edit({
      embeds: [await embed.nowPlaying(song)],
      components: [await row.pause()]
    })
  }

  /**
   * Determine the song chosen and add it to the queue.
   *
   * @param interaction - The button interaction to reply to
   * @returns Interaction update
   */
  addSongChoice = async (interaction: ButtonInteraction) => {
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

    const { channel, songs } = choiceQueue
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
    await interaction.update({
      content: 'Added song to queue',
      embeds: [],
      components: []
    })

    const songUrl = `https://www.youtube.com/watch?v=${song?.id.videoId}`
    await this._addSongsToQueue([songUrl], interaction.user.username)
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
      return await this._getSongChoices(interaction, channel, song)
    }

    const songUrls = await this._getSearchList(song)

    await interaction.editReply({
      content:
        songUrls.length > 1 ? 'Adding songs to queue!' : 'Adding song to queue!'
    })

    if (!this._player) await this._createConnection(channel)

    const songsAdded = await this._addSongsToQueue(
      songUrls,
      interaction.user.username
    )

    return interaction.editReply({
      content: `Added ${songsAdded} ${songsAdded > 1 ? 'songs' : 'song'} to queue!`
    })
  }

  /**
   * Stop the music player and destroy the connection.
   *
   * @param interaction - The interaction to reply to
   * @returns Interaction reply
   */
  stopPlaying = async (interaction: ChatInputCommandInteraction) => {
    if (!this._connection) {
      return interaction.editReply({
        content: 'Nothing is playing!'
      })
    }

    await this._destroyConnection()
    return interaction.editReply({
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
  toggleSong = async (interaction: ButtonInteraction) => {
    if (!this._player) {
      return await interaction.editReply({
        content: 'Nothing is currently playing! Add a song with `/play`'
      })
    }

    const embed = this._nowPlayingEmbed?.embeds[0]
    if (!embed) return

    if (this._paused) {
      this._player?.unpause()
      this._paused = false
      this._playing = true

      await this._nowPlayingEmbed?.edit({
        embeds: [embed],
        components: [await row.pause()]
      })

      await interaction.editReply({
        content: 'Resumed playing!'
      })
    } else {
      this._player?.pause()
      this._paused = true
      this._playing = false

      await this._nowPlayingEmbed?.edit({
        embeds: [embed],
        components: [await row.resume()]
      })

      await interaction.editReply({
        content: 'Paused song!'
      })
    }
  }
}
