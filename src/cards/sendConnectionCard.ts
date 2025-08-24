import { TextChannel, GuildMember, Client } from 'discord.js';

export async function sendConnectionCard(
  client: Client,
  channelId: string,
  member: GuildMember,
  count: number
) {
  let channel: TextChannel | null = null;
  for (const [, g] of client.guilds.cache) {
    if (g.channels.cache.has(channelId)) {
      channel = g.channels.cache.get(channelId) as TextChannel;
      break;
    }
  }
  if (!channel) {
    for (const [, g] of client.guilds.cache) {
      try {
        const fetched = await g.channels.fetch(channelId);
        if (fetched && fetched.isTextBased()) {
          channel = fetched as TextChannel;
          break;
        }
      } catch {}
    }
  }
  if (!channel || channel.type !== 0) return;

  const displayName = member.displayName || member.user.username;

  const embed = {
    title: displayName,
    description: `se conectó al servidor`,
    fields: [
      {
        name: 'Hora',
        value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
        inline: true,
      },
      {
        name: 'Conexiones hoy',
        value: `\`${count}\` ${count === 1 ? 'vez' : 'veces'}`,
        inline: true,
      },
    ],
    color: 0x57f287,
    thumbnail: { url: member.user.displayAvatarURL() },
  };

  await channel.send({ embeds: [embed] });
}
