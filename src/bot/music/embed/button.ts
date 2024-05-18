import config from 'config'
import { ButtonBuilder, ButtonStyle } from 'discord.js'

/**
 * Create a back button for the now playing embed.
 *
 * @returns A button
 */
const back = async () => {
  return new ButtonBuilder()
    .setCustomId('music_back')
    .setLabel('Back')
    .setStyle(ButtonStyle.Primary)
    .setEmoji(config.get('emojis.animatedLeftArrow'))
}

/**
 * Create a pause button for the now playing embed.
 *
 * @returns A button
 */
const pause = async () => {
  return new ButtonBuilder()
    .setCustomId('music_toggle')
    .setLabel('Pause')
    .setStyle(ButtonStyle.Danger)
}

/**
 * Create a resume button for the now playing embed.
 *
 * @returns A button
 */
const resume = async () => {
  return new ButtonBuilder()
    .setCustomId('music_toggle')
    .setLabel('Resume')
    .setStyle(ButtonStyle.Success)
    .setEmoji(config.get('emojis.playstationLogo'))
}

/**
 * Create a skip button for the now playing embed.
 *
 * @returns A button
 */
const skip = async () => {
  return new ButtonBuilder()
    .setCustomId('music_skip')
    .setLabel('Skip')
    .setStyle(ButtonStyle.Primary)
    .setEmoji(config.get('emojis.animatedRightArrow'))
}

export default { back, pause, resume, skip }
