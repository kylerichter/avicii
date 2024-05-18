import { ActionRowBuilder, ButtonBuilder } from 'discord.js'
import button from './button'

/**
 * Create a pause row for the now playing embed.
 *
 * @returns A row
 */
const pause = async () => {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    await button.back(),
    await button.pause(),
    await button.skip()
  )
}

/**
 * Create a resume row for the now playing embed.
 *
 * @returns A row
 */
const resume = async () => {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    await button.back(),
    await button.resume(),
    await button.skip()
  )
}

export default { pause, resume }
