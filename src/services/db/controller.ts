import service from './service'

/**
 * Represents a PrismaController.
 */
export default class PrismaController {
  /**
   * Constructs a new PrismaController instance.
   */
  constructor() {
    console.log('PrismaController initialized')
  }

  addGuild = async (id: string, joinedAt: Date) => {
    await service.addGuild(id, joinedAt)
  }

  deleteGuild = async (id: string) => {
    await service.deleteGuild(id)
  }

  getAllGuilds = async () => {
    return await service.getAllGuilds()
  }

  getGuild = async (id: string) => {
    return await service.getGuild(id)
  }

  updateGuild = async (id: string, data: any) => {
    await service.updateGuild(id, data)
  }
}
