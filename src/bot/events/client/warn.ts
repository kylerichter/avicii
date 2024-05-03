module.exports = {
  /**
   * Emitted for general warnings.
   *
   * @param info - The warning
   */
  name: 'warn',
  async execute(info: string) {
    console.warn(info)
  }
}
