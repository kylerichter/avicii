import config from 'config'

module.exports = {
  /**
   * Emitted when the client encounters an error.
   *
   * @param error - The error encountered
   */
  name: 'error',
  async execute(error: Error) {
    if (config.get('enableEvent.error')) {
      console.error('An error has occurred: ', error)
    }
  }
}
