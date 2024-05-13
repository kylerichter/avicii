import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * Add a guild to the database.
 *
 * @param id - The guild ID
 * @param joinedAt - The timestamp the guild was joined
 */
const addGuild = async (id: string, joinedAt: Date) => {
  try {
    await prisma.guild.create({ data: { id, joinedAt } })
  } catch (err) {
    console.error('Prisma addGuild error:', err)
  }
}

/**
 * Delete a guild from the database.
 *
 * @param id - The guild ID
 */
const deleteGuild = async (id: string) => {
  try {
    await prisma.guild.delete({ where: { id } })
  } catch (err) {
    console.error('Prisma deleteGuild error:', err)
  }
}

/**
 * Get all guilds in the database.
 *
 * @returns List of guilds in the database or undefined
 */
const getAllGuilds = async () => {
  try {
    return await prisma.guild.findMany()
  } catch (err) {
    console.error('Prisma getAllGuilds error:', err)
  }
}

/**
 * Get a guild from the database.
 *
 * @param id - The guild ID
 * @returns The guild in the database or undefined
 */
const getGuild = async (id: string) => {
  try {
    return await prisma.guild.findUnique({ where: { id } })
  } catch (err) {
    console.error('Prisma getGuild error:', err)
  }
}

/**
 * Update a guild in the database.
 *
 * @param id - The guild ID
 * @param data - The data to update
 */
const updateGuild = async (id: string, data: any) => {
  try {
    await prisma.guild.update({ where: { id }, data })
  } catch (err) {
    console.error('Prisma updateGuild error:', err)
  }
}

export default { addGuild, deleteGuild, getAllGuilds, getGuild, updateGuild }
