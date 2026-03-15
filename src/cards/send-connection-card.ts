/**
 * Send Connection Card - Utility for sending member connection notifications.
 * 
 * Sends an embed card when a member joins the server.
 * 
 * @module cards/send-connection-card
 */

import { EmbedBuilder, TextChannel, Client, GuildMember } from 'discord.js';

/**
 * Discord channel type for text channels.
 */
const CHANNEL_TYPE_TEXT = 0;

/**
 * Sends a connection card to the specified channel.
 * 
 * @param client - The Discord client instance
 * @param channelId - The ID of the text channel to send the card to
 * @param member - The guild member who joined
 * @returns Promise that resolves when the card is sent
 * 
 * @example
 * ```typescript
 * await sendConnectionCard(client, '123456789', member);
 * ```
 */
export async function sendConnectionCard(
  client: Client,
  channelId: string,
  member: GuildMember
): Promise<void> {
  let channel: TextChannel | null = null;
  
  // First try: find channel in cache
  for (const [, g] of client.guilds.cache) {
    if (g.channels.cache.has(channelId)) {
      channel = g.channels.cache.get(channelId) as TextChannel;
      break;
    }
  }
  
  // Second try: fetch channel if not in cache
  if (!channel) {
    for (const [, g] of client.guilds.cache) {
      try {
        const fetched = await g.channels.fetch(channelId);
        if (fetched && fetched.isTextBased()) {
          channel = fetched as TextChannel;
          break;
        }
      } catch {
        // Channel not found in this guild, continue
      }
    }
  }
  
  if (!channel || channel.type !== CHANNEL_TYPE_TEXT) {
    return;
  }

  // Build clickable mention
  const userMention = `<@!${member.id}>`;
  const timestamp = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setDescription(`¡Bienvenido/a ${userMention} al servidor! 🎉\n\n<a:nuevos:1344790894829105172> Recuerda leer las reglas y divertirte!`)
    .setColor(0x57f287)
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: `Miembro #${member.guild.memberCount}` });

  await channel.send({ embeds: [embed] });
}
