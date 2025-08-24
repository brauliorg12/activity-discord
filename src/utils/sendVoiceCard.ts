import { EmbedBuilder, TextChannel, Client } from 'discord.js';
import { VoiceActivityCardData } from '../types/activity';

const channelTypeText = 0;

export async function sendVoiceCard(
  client: Client,
  channelId: string,
  { member, action, color, channelName, oldChannelName }: VoiceActivityCardData
) {
  let textChannel: TextChannel | null = null;
  for (const [, g] of client.guilds.cache) {
    if (g.channels.cache.has(channelId)) {
      const channel = g.channels.cache.get(channelId) as TextChannel;
      if (channel && channel.type === channelTypeText) textChannel = channel;
    }
  }
  if (!textChannel) {
    for (const [, g] of client.guilds.cache) {
      try {
        const fetched = await g.channels.fetch(channelId);
        if (
          fetched &&
          fetched.isTextBased() &&
          fetched.type === channelTypeText
        ) {
          textChannel = fetched as TextChannel;
          break;
        }
      } catch {}
    }
  }
  if (!textChannel) return;

  const displayName = member.displayName || member.user.username;

  let description = '';
  if (action === 'cambio') {
    description = `cambió de canal de voz de **${oldChannelName}** a **${channelName}**`;
  } else if (action === 'entrada') {
    description = `entró a **${channelName}**`;
  } else if (action === 'salida') {
    description = `salió de **${channelName}**`;
  }

  const now = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setTitle(displayName)
    .setDescription(`${description}\n\n<t:${now}:R>`)
    .setColor(color)
    .setThumbnail(member.user.displayAvatarURL());

  await textChannel.send({ embeds: [embed] });
}
