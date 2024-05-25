import config from 'config'

/**
 * Converts seconds to a human-readable format.
 *
 * @param seconds - The time in seconds
 * @returns The time in a human-readable format
 */
const prettyTime = async (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor((seconds % 3600) % 60)

  const hDisplay = h > 0 ? h + ':' : ''
  const mDisplay = m > 0 ? (m < 10 && h > 0 ? '0' : '') + m + ':' : '00:'
  const sDisplay = s > 0 ? (s < 10 ? '0' : '') + s : '00'

  const convertedTime = hDisplay + mDisplay + sDisplay
  return convertedTime.trimEnd()
}

/**
 * Create a progress bar for the current song.
 *
 * @param duration - The duration of the song
 * @param elapsedTime - The elapsed time of the song
 * @param barLength - The length of the progress bar
 * @returns A progress bar
 */
const progressBar = async (
  duration: number,
  elapsedTime: number,
  barLength: number = 12
) => {
  const cdEmoji = `<a:cd:${config.get('emojis.cd')}>`
  const progress = elapsedTime / duration
  const position = Math.round(barLength * progress)

  let progressBar = ''
  for (let i = 0; i < barLength; i++) {
    progressBar += i === position ? cdEmoji : '▬'
  }

  return progressBar
}

export { prettyTime, progressBar }
