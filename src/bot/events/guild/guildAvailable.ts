import { Guild } from 'discord.js'

module.exports = {
  /**
   * Emitted whenever a guild becomes available.
   *
   * @param guild - The guild that became available
   */
  name: 'guildAvailable',
  async execute(guild: Guild) {
    try {
      const currentTime = new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago'
      })
      console.log(`Guild available: ${guild.name} | ${currentTime}`)
    } catch (error) {
      console.error('guildAvailable event error', error)
    }
  }
}
