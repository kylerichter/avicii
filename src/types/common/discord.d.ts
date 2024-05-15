import { Collection } from 'discord.js'
import GuildPlayerOrchestrator from '../../bot/music/orchestrator'
import PrismaController from '../../services/db/controller'

declare module 'discord.js' {
  export interface Client {
    commands: Collection<unknown, any>
    guildPlayerOrchestrator: GuildPlayerOrchestrator
    db: PrismaController
  }
}
