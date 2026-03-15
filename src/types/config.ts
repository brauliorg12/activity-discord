/**
 * Configuration types for multi-guild support
 */

export interface GuildChannelConfig {
  [guildId: string]: string[];
}

export interface BotConfig {
  token: string;
  clientId: string;
  shardingEnabled: boolean;
  guildConfig: GuildChannelConfig | null;
  legacyChannelId: string | null;
}
