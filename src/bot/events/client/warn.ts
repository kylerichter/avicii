import config from 'config'

module.exports = {
  /**
   * Emitted for general warnings.
   *
   * @param info - The warning
   */
  name: 'warn',
  async execute(info: string) {
    if (config.get('enableEvent.warn')) {
      console.warn(info)
    }
  }
}
