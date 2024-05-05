import { Client } from 'discord.js'
import GuildPlayer from './player'

/**
 * Orchestrates the management of multiple GuildPlayer instances.
 */
export default class GuildPlayerOrchestrator {
  private readonly _client: Client
  private _guildPlayers: GuildPlayer[] = []

  /**
   * Constructs a new GuildPlayerOrchestrator instance.
   *
   * @param client - The Client
   */
  constructor(client: Client) {
    this._client = client
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
      const guildPlayer = new GuildPlayer(this._client, guild[1])
      await guildPlayer.init()

      this._guildPlayers.push(guildPlayer)
    }

    console.log(`GuildPlayerOrchestrator initialized ${guilds.size} guild(s)`)
  }
}
