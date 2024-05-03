import { Guild } from 'discord.js'

module.exports = {
  /**
   * Emitted whenever the client joins a guild.
   *
   * @param guild - The created guild
   */
  name: 'guildCreate',
  async execute(guild: Guild) {
    try {
      const currentTime = new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago'
      })
      console.log(`Joined new guild: ${guild.name} | ${currentTime}`)
    } catch (error) {
      console.error('guildCreate event error', error)
    }
  }
}
