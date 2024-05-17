import { SlashCommandBuilder } from '@discordjs/builders'
import {
  ChannelType,
  ChatInputCommandInteraction,
  TextChannel
} from 'discord.js'

module.exports = {
  /**
   * Set slash command for music player
   */
  data: new SlashCommandBuilder()
    .setName('set')
    .setDescription('Set the music channel')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Text channel for music embeds')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const { client } = interaction
    const channel = interaction.options.getChannel('channel') as TextChannel

    if (!channel) {
      return await interaction.reply({
        content: 'Something went wrong!',
        ephemeral: true
      })
    }

    await client.db.updateGuild(channel.guild.id, {
      musicChannelId: channel?.id
    })

    await interaction.reply({
      content: 'Music channel set!',
      ephemeral: true
    })
  }
}
