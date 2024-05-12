import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const addGuild = async (id: string, joinedAt: Date) => {
  try {
    await prisma.guild.create({ data: { id, joinedAt } })
  } catch (err) {
    console.error('Prisma addGuild error:', err)
  }
}

const deleteGuild = async (id: string) => {
  try {
    await prisma.guild.delete({ where: { id } })
  } catch (err) {
    console.error('Prisma deleteGuild error:', err)
  }
}

const getAllGuilds = async () => {
  try {
    return await prisma.guild.findMany()
  } catch (err) {
    console.error('Prisma getAllGuilds error:', err)
  }
}

const getGuild = async (id: string) => {
  try {
    return await prisma.guild.findUnique({ where: { id } })
  } catch (err) {
    console.error('Prisma getGuild error:', err)
  }
}

const updateGuild = async (id: string, data: any) => {
  try {
    await prisma.guild.update({ where: { id }, data })
  } catch (err) {
    console.error('Prisma updateGuild error:', err)
  }
}

export default { addGuild, deleteGuild, getAllGuilds, getGuild, updateGuild }
