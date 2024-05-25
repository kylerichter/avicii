import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client
} from 'discord.js'
import PlayerCache from './cache'
import GuildPlayer from './player'
import SpotifyClient from './spotify'
import YouTubeClient from './youTube'

/**
 * Orchestrates the management of multiple GuildPlayer instances.
 */
export default class GuildPlayerOrchestrator {
  private readonly _client: Client
  private _cache: PlayerCache
  private _guildPlayers: GuildPlayer[] = []
  private _spotifyClient: SpotifyClient
  private _youTubeClient: YouTubeClient

  /**
   * Constructs a new GuildPlayerOrchestrator instance.
   *
   * @param client - The Client
   */
  constructor(client: Client) {
    this._client = client
    this._cache = new PlayerCache()
    this._spotifyClient = new SpotifyClient()
    this._youTubeClient = new YouTubeClient()
  }

  /**
   * Initalize GuildPlayerOrchestrator instance.
   * Create and initalize GuildPlayer instances for each guild.
   *
   * @remarks
   *
   * This method should be called after constructing GuildPlayerOrchestrator to perform setup.
   */
  init = async () => {
    await this._cache.init()

    const guilds = this._client.guilds.cache
    for (const guild of guilds) {
      const guildPlayer = new GuildPlayer(
        this._client,
        guild[1],
        this._cache,
        this._spotifyClient,
        this._youTubeClient
      )
      await guildPlayer.init()

      this._guildPlayers.push(guildPlayer)
    }

    console.log(`GuildPlayerOrchestrator initialized ${guilds.size} guild(s)`)
  }

  /**
   * Check if any GuildPlayer instances are playing.
   *
   * @returns True if any guild players are playing, otherwise False
   */
  isPlaying = () => {
    for (const player of this._guildPlayers) {
      if (player.isPlaying()) {
        return true
      }
    }

    return false
  }

  /**
   * Initiate a shutdown.
   * Signal all GuildPlayer instances to stop taking requests.
   * Wait for all songs to finish playing.
   */
  processShutdown = async () => {
    for (const guildPlayer of this._guildPlayers) {
      guildPlayer.processShutdown()
    }

    while (this.isPlaying()) {
      await new Promise((r) => setTimeout(r, 5000)) // 5 second backoff
    }
  }

  /**
   * Send the song choice button interaction to the correct GuildPlayer.
   *
   * @param interaction - The button interaction sent
   */
  addChoice = async (interaction: ButtonInteraction) => {
    const guildPlayer = this._guildPlayers.find(
      (guildPlayer) => guildPlayer.guild.id === interaction.guildId
    )

    if (guildPlayer) {
      guildPlayer.addChoice(interaction)
    } else {
      return interaction.editReply({
        content: 'Something went wrong!'
      })
    }
  }

  /**
   * Send the back button interaction to the correct GuildPlayer.
   *
   * @param interaction - The button interaction sent
   */
  back = async (interaction: ButtonInteraction) => {
    const guildPlayer = this._guildPlayers.find(
      (guildPlayer) => guildPlayer.guild.id === interaction.guildId
    )

    if (guildPlayer) {
      guildPlayer.back(interaction)
    } else {
      return interaction.editReply({
        content: 'Something went wrong!'
      })
    }
  }

  /**
   * Send the play command to the correct GuildPlayer.
   *
   * @param interaction - The interaction sent
   */
  play = async (interaction: ChatInputCommandInteraction) => {
    const guildPlayer = this._guildPlayers.find(
      (guildPlayer) => guildPlayer.guild.id === interaction.guildId
    )

    if (guildPlayer) {
      guildPlayer.play(interaction)
    } else {
      return interaction.editReply({
        content: 'Something went wrong!'
      })
    }
  }

  /**
   * Send the shuffle command to the correct GuildPlayer.
   *
   * @param interaction - The interaction sent
   */
  shuffle = async (interaction: ChatInputCommandInteraction) => {
    const guildPlayer = this._guildPlayers.find(
      (guildPlayer) => guildPlayer.guild.id === interaction.guildId
    )

    if (guildPlayer) {
      guildPlayer.shuffle(interaction)
    } else {
      return interaction.editReply({
        content: 'Something went wrong!'
      })
    }
  }

  /**
   * Send the skip button interaction to the correct GuildPlayer.
   *
   * @param interaction - The button interaction sent
   */
  skip = async (interaction: ButtonInteraction) => {
    const guildPlayer = this._guildPlayers.find(
      (guildPlayer) => guildPlayer.guild.id === interaction.guildId
    )

    if (guildPlayer) {
      guildPlayer.skip(interaction)
    } else {
      return interaction.editReply({
        content: 'Something went wrong!'
      })
    }
  }

  /**
   * Send the stop command to the correct GuildPlayer.
   *
   * @param interaction - The interaction sent
   */
  stop = async (interaction: ChatInputCommandInteraction) => {
    const guildPlayer = this._guildPlayers.find(
      (guildPlayer) => guildPlayer.guild.id === interaction.guildId
    )

    if (guildPlayer) {
      guildPlayer.stop(interaction)
    } else {
      return interaction.editReply({
        content: 'Something went wrong!'
      })
    }
  }

  /**
   * Send the pause/resume button interaction to the correct GuildPlayer.
   *
   * @param interaction - The button interaction sent
   */
  toggle = async (interaction: ButtonInteraction) => {
    const guildPlayer = this._guildPlayers.find(
      (guildPlayer) => guildPlayer.guild.id === interaction.guildId
    )

    if (guildPlayer) {
      guildPlayer.toggle(interaction)
    } else {
      return interaction.editReply({
        content: 'Something went wrong!'
      })
    }
  }
}
