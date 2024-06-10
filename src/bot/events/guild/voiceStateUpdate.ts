import { VoiceState } from 'discord.js'

module.exports = {
  /**
   * Emitted whenever a member changes voice state - e.g. joins/leaves a channel, mutes/unmutes.
   *
   * @param oldState - The voice state before the update
   * @param newState - The voice state after the update
   */
  name: 'voiceStateUpdate',
  async execute(oldState: VoiceState, newState: VoiceState) {
    const channel = oldState.channel || newState.channel
    if (!channel) return

    const voiceChannel =
      await channel.client.guildPlayerOrchestrator.voiceChannel(
        channel.guild.id
      )
    if (channel.id !== voiceChannel) return

    if (channel.members.size === 1) {
      await channel.client.guildPlayerOrchestrator.stop(channel.guild.id)
    }
  }
}
