import config from 'config'
import { REST, Routes } from 'discord.js'
import fs from 'node:fs'
import path from 'path'

if (!process.env.DISCORD_TOKEN) {
  console.error('Must set DISCORD_TOKEN')
  process.exit(1)
}

const commands = []
const commandFiles = fs
  .readdirSync(path.join(__dirname, '/bot/commands/'))
  .filter((file) => file.endsWith('.js'))
for (const file of commandFiles) {
  const filePath = path.join(__dirname, `/bot/commands/${file}`)
  const command = require(filePath)
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON())
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    )
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN)

try {
  console.log(`Started refreshing ${commands.length} application (/) commands.`)

  rest
    .put(Routes.applicationCommands(config.get('clientId')), { body: commands })
    .then((data: any) =>
      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`
      )
    )
    .catch(console.error)
} catch (error) {
  console.error(error)
}
