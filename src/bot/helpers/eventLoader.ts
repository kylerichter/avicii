import { Client } from 'discord.js'
import fs from 'node:fs'
import path from 'path'

/**
 * Load event handlers into client by looping through all files in events folder.
 *
 * @param client - The Discord client
 */
export const loadEvents = (client: Client) => {
  const eventFolders = fs.readdirSync(path.join(__dirname, '../events'))
  for (const folder of eventFolders) {
    const eventFiles = fs
      .readdirSync(path.join(__dirname, `../events/${folder}`))
      .filter((file) => file.endsWith('.js'))
    for (const file of eventFiles) {
      const event = require(path.join(__dirname, `../events/${folder}/${file}`))
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args))
      } else {
        client.on(event.name, (...args) => event.execute(...args))
      }
    }
  }
}
