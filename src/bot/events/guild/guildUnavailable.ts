import { Guild } from 'discord.js'

module.exports = {
  /**
   * Emitted whenever a guild becomes unavailable, likely due to a server outage.
   *
   * @param guild - The guild that has become unavailable
   */
  name: 'guildUnavailable',
  async execute(guild: Guild) {
    try {
      const currentTime = new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago'
      })
      console.warn(`Guild unavailable: ${guild.name} | ${currentTime}`)
    } catch (error) {
      console.error('guildUnavailable event error', error)
    }
  }
}
