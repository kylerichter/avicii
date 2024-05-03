import { Guild } from 'discord.js'

module.exports = {
  /**
   * Emitted whenever a guild kicks the client or the guild is deleted/left.
   *
   * @param guild - The guild that was deleted
   */
  name: 'guildDelete',
  async execute(guild: Guild) {
    try {
      const currentTime = new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago'
      })
      console.log(`Left guild: ${guild.name} | ${currentTime}`)
    } catch (error) {
      console.error('guildDelete event error', error)
    }
  }
}
