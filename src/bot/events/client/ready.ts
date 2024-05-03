import { Client } from 'discord.js'

module.exports = {
  /**
   * Emitted when the client becomes ready to start working.
   *
   * @param client - The client
   */
  name: 'ready',
  once: true,
  async execute(client: Client) {
    try {
      const { user, readyAt } = client

      let guilds = ''
      for (const guild of client.guilds.cache) {
        guilds += `${guild[1].name}, `
      }

      console.log(`Ready! Logged in as ${user?.tag} at ${readyAt}`)
      console.log(`Guilds: ${guilds.slice(0, -2)}`)
    } catch (error) {
      console.error('ready event error', error)
    }
  }
}
