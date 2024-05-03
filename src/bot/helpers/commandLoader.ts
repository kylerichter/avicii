import { Client, Collection } from 'discord.js'
import fs from 'node:fs'
import path from 'path'

/**
 * Load slash commands into client by looping through all files in commands folder.
 *
 * @param client - The Discord client
 */
export const loadCommands = (client: Client) => {
  client.commands = new Collection()
  const commandFiles = fs
    .readdirSync(path.join(__dirname, '../commands/'))
    .filter((file) => file.endsWith('.js'))
  for (const file of commandFiles) {
    const command = require(path.join(__dirname, `../commands/${file}`))
    client.commands.set(command.data.name, command)
  }
}
