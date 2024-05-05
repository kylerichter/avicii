import { Client, Guild } from 'discord.js'

/**
 * Represents a music player bound to a single guild.
 */
export default class GuildPlayer {
  guild: Guild
  private readonly _client: Client

  /**
   * Constructs a new GuildPlayer instance.
   *
   * @param client - The Client
   * @param guild - The guild for which to initialize a player
   */
  constructor(client: Client, guild: Guild) {
    this._client = client
    this.guild = guild
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
}
