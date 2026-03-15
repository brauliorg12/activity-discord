/**
 * Send Voice Activity Card - Utility for sending voice activity embed messages.
 * 
 * Sends a formatted embed card to a text channel when a user enters,
 * leaves, or changes voice channels.
 * 
 * @module utils/send-voice-card
 */

import { EmbedBuilder, TextChannel, Client } from 'discord.js';
import { VoiceActivityCardData } from '../types/activity';
import { recordVoiceConnection, getTodayConnectionCount } from '../config/voice-tracker';

/**
 * Discord channel type for text channels.
 */
const CHANNEL_TYPE_TEXT = 0;

/**
 * Sends a voice activity card to the specified channel.
 * 
 * @param client - The Discord client instance
 * @param channelId - The ID of the text channel to send the card to
 * @param data - Voice activity data including member, action, and channel info
 * @returns Promise that resolves when the card is sent
 * 
 * @example
 * ```typescript
 * await sendVoiceCard(client, '123456789', {
 *   member: guildMember,
 *   action: 'entrada',
 *   color: 0x57f287,
 *   channelName: 'General'
 * });
 * ```
 */
export async function sendVoiceCard(
  client: Client,
  channelId: string,
  data: VoiceActivityCardData
): Promise<void> {
  const { member, action, color, channelName, channelId: voiceChannelId, guildId } = data;
  
  let textChannel: TextChannel | null = null;
  
  // First try: find channel in cache
  for (const [, g] of client.guilds.cache) {
    if (g.channels.cache.has(channelId)) {
      const channel = g.channels.cache.get(channelId) as TextChannel;
      if (channel && channel.type === CHANNEL_TYPE_TEXT) {
        textChannel = channel;
      }
    }
  }
  
  // Second try: fetch channel if not in cache
  if (!textChannel) {
    for (const [, g] of client.guilds.cache) {
      try {
        const fetched = await g.channels.fetch(channelId);
        if (
          fetched &&
          fetched.isTextBased() &&
          fetched.type === CHANNEL_TYPE_TEXT
        ) {
          textChannel = fetched as TextChannel;
          break;
        }
      } catch {
        // Channel not found in this guild, continue
      }
    }
  }
  
  if (!textChannel) {
    return;
  }

  // Get or record connection count for voice entries
  let connectionCount = 0;
  if (action === 'entrada' && guildId) {
    connectionCount = await recordVoiceConnection(member.id, guildId);
  } else if (action === 'entrada' && guildId) {
    connectionCount = await getTodayConnectionCount(member.id, guildId);
  }

  // Build mentions (clickable)
  const userMention = `<@!${member.id}>`;
  const channelMention = voiceChannelId ? `<#${voiceChannelId}>` : `**${channelName}**`;
  
  // Build the description based on action type
  let description = '';
  
  switch (action) {
    case 'cambio':
      description = `${userMention} cambió de canal de voz a ${channelMention}`;
      break;
    case 'entrada':
      const countText = connectionCount > 1 
        ? ` (${connectionCount} veces hoy)` 
        : '';
      description = `${userMention} entró a ${channelMention}${countText}`;
      break;
    case 'salida':
      description = `${userMention} salió de **${channelName}**`;
      break;
  }

  // Create and send the embed
  const timestamp = Math.floor(Date.now() / 1000);
  
  const embed = new EmbedBuilder()
    .setDescription(`${description}\n\n<t:${timestamp}:R>`)
    .setColor(color)
    .setThumbnail(member.user.displayAvatarURL());

  await textChannel.send({ embeds: [embed] });
}
