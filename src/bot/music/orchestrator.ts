import { ChatInputCommandInteraction, Client } from 'discord.js'
import GuildPlayer from './player'
import YouTubeClient from './youTube'

/**
 * Orchestrates the management of multiple GuildPlayer instances.
 */
export default class GuildPlayerOrchestrator {
  private readonly _client: Client
  private _guildPlayers: GuildPlayer[] = []
  private _youTubeClient: YouTubeClient

  /**
   * Constructs a new GuildPlayerOrchestrator instance.
   *
   * @param client - The Client
   */
  constructor(client: Client) {
    this._client = client
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
    const guilds = this._client.guilds.cache
    for (const guild of guilds) {
      const guildPlayer = new GuildPlayer(
        this._client,
        guild[1],
        this._youTubeClient
      )
      await guildPlayer.init()

      this._guildPlayers.push(guildPlayer)
    }

    console.log(`GuildPlayerOrchestrator initialized ${guilds.size} guild(s)`)
  }

  /**
   * Query the given song or play the given YouTube link or playlist.
   *
   * @param interaction - The interaction sent
   */

  playSong = async (interaction: ChatInputCommandInteraction) => {
    const guildPlayer = this._guildPlayers.find(
      (guildPlayer) => guildPlayer.guild.id === interaction.guildId
    )

    if (guildPlayer) {
      guildPlayer.playSong(interaction)
    } else {
      return interaction.editReply({
        content: 'Something went wrong!'
      })
    }
  }
}
