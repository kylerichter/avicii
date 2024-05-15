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

  /**
   * Add a guild to the database.
   *
   * @param id - The guild ID
   * @param joinedAt - The timestamp the guild was joined
   */
  addGuild = async (id: string, joinedAt: Date) => {
    await service.addGuild(id, joinedAt)
  }

  /**
   * Delete a guild from the database.
   *
   * @param id - The guild ID
   */
  deleteGuild = async (id: string) => {
    await service.deleteGuild(id)
  }

  /**
   * Get all guilds in the database.
   *
   * @returns List of guilds in the database or undefined
   */
  getAllGuilds = async () => {
    return await service.getAllGuilds()
  }

  /**
   * Get a guild from the database.
   *
   * @param id - The guild ID
   * @returns The guild in the database or undefined
   */
  getGuild = async (id: string) => {
    return await service.getGuild(id)
  }

  /**
   * Update a guild in the database.
   *
   * @param id - The guild ID
   * @param data - The data to update
   */
  updateGuild = async (id: string, data: any) => {
    await service.updateGuild(id, data)
  }
}
