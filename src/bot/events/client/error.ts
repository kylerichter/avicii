module.exports = {
  /**
   * Emitted when the client encounters an error.
   *
   * @param error - The error encountered
   */
  name: 'debug',
  async execute(error: Error) {
    console.error('An error has occurred: ', error)
  }
}
