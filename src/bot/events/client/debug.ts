import config from 'config'

module.exports = {
  /**
   * Emitted for general debugging information.
   *
   * @param info - The debug information
   */
  name: 'debug',
  async execute(info: string) {
    if (config.get('enableEvent.debug')) {
      console.debug(info)
    }
  }
}
