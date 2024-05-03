module.exports = {
  /**
   * Emitted for general debugging information.
   *
   * @param info - The debug information
   */
  name: 'debug',
  async execute(info: string) {
    console.debug(info)
  }
}
