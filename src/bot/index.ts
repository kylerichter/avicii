import { Client, GatewayIntentBits } from 'discord.js'

import PrismaController from '../services/db/controller'
import { checkEnv } from './helpers/checkEnv'
import { loadCommands } from './helpers/commandLoader'
import { loadEvents } from './helpers/eventLoader'
import GuildPlayerOrchestrator from './music/orchestrator'

checkEnv()

export const client = new Client({
  intents: [
    // GatewayIntentBits.DirectMessages,
    // GatewayIntentBits.DirectMessageReactions,
    // GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.Guilds,
    // GatewayIntentBits.GuildEmojisAndStickers,
    // GatewayIntentBits.GuildIntegrations,
    // GatewayIntentBits.GuildInvites,
    // GatewayIntentBits.GuildMembers,
    // GatewayIntentBits.GuildMessages,
    // GatewayIntentBits.GuildMessageReactions,
    // GatewayIntentBits.GuildMessageTyping,
    // GatewayIntentBits.GuildModeration,
    // GatewayIntentBits.GuildPresences,
    // GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.GuildVoiceStates
    // GatewayIntentBits.GuildWebhooks,
    // GatewayIntentBits.MessageContent
  ],
  partials: [
    // Partials.Channel,
    // Partials.GuildMember,
    // Partials.GuildScheduledEvent,
    // Partials.Message,
    // Partials.Reaction,
    // Partials.ThreadMember,
    // Partials.User
  ]
})

loadCommands(client)
loadEvents(client)

client.guildPlayerOrchestrator = new GuildPlayerOrchestrator(client)
client.db = new PrismaController()

const handleShutdown = async () => {
  console.log('Received SIGTERM. Waiting up to 10 minutes for songs to finish.')

  if (client.guildPlayerOrchestrator.isPlaying()) {
    await client.guildPlayerOrchestrator.processShutdown()
  }

  process.exit(0)
}

process.on('SIGTERM', handleShutdown)

const login = async () => {
  try {
    await client.login(process.env.DISCORD_TOKEN)
    console.log('Logged in successfully!')
  } catch (error) {
    console.error('Login failed:', error)
  }
}

login()

export default client
