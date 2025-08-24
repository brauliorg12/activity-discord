import { GuildMember } from 'discord.js';

export interface VoiceActivityCardData {
  member: GuildMember;
  action: 'entrada' | 'salida' | 'cambio';
  color: number;
  channelName: string;
  oldChannelName?: string;
}
