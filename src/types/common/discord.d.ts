import { Collection } from 'discord.js'
import GuildPlayerOrchestrator from '../../bot/music/orchestrator'

declare module 'discord.js' {
  export interface Client {
    commands: Collection<unknown, any>
    guildPlayerOrchestrator: GuildPlayerOrchestrator
  }
}
