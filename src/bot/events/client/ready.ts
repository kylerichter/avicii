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

        const guildData = await client.db.getGuild(guild[0])
        if (!guildData) {
          await client.db.addGuild(guild[0], guild[1].joinedAt)
        }
      }

      console.log(`Ready! Logged in as ${user?.tag} at ${readyAt}`)
      console.log(`Guilds: ${guilds.slice(0, -2)}`)

      await client.guildPlayerOrchestrator.init()
    } catch (error) {
      console.error('ready event error', error)
    }
  }
}
