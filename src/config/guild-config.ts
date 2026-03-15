/**
 * Guild configuration loader for multi-guild support
 */

import dotenv from 'dotenv';
import { GuildChannelConfig } from '../types/config';

dotenv.config();

let cachedConfig: GuildChannelConfig | null = null;

/**
 * Load and parse GUILDS_CONFIG from environment variables
 * @returns Parsed guild configuration or null if not set/invalid
 */
export function loadGuildConfig(): GuildChannelConfig | null {
  // Return cached config if already loaded
  if (cachedConfig !== null) {
    return cachedConfig;
  }

  const guildsConfigStr = process.env.GUILDS_CONFIG;

  if (!guildsConfigStr) {
    cachedConfig = null;
    return null;
  }

  try {
    const parsed = JSON.parse(guildsConfigStr);

    // Validate that it's an object with string keys
    if (typeof parsed !== 'object' || parsed === null) {
      console.error('[Config] GUILDS_CONFIG debe ser un objeto JSON');
      cachedConfig = null;
      return null;
    }

    // Validate structure: { guildId: [channelId1, channelId2] }
    for (const [guildId, channels] of Object.entries(parsed)) {
      if (!Array.isArray(channels)) {
        console.error(`[Config] GUILDS_CONFIG: ${guildId} debe tener un array de canales`);
        cachedConfig = null;
        return null;
      }
      for (const channel of channels) {
        if (typeof channel !== 'string') {
          console.error(`[Config] GUILDS_CONFIG: los IDs de canal deben ser strings`);
          cachedConfig = null;
          return null;
        }
      }
    }

    cachedConfig = parsed as GuildChannelConfig;
    console.log(`[Config] GUILDS_CONFIG cargado: ${Object.keys(cachedConfig).length} guilds`);
    return cachedConfig;
  } catch (error) {
    console.error(`[Config] Error parseando GUILDS_CONFIG: ${error}`);
    cachedConfig = null;
    return null;
  }
}

/**
 * Get configured channel IDs for a specific guild
 * @param config Guild configuration object
 * @param guildId Discord guild ID
 * @returns Array of channel IDs or null if guild not configured
 */
export function getChannelsForGuild(
  config: GuildChannelConfig,
  guildId: string
): string[] | null {
  const channels = config[guildId];
  if (!channels || channels.length === 0) {
    return null;
  }
  return channels;
}

/**
 * Check if a guild has configuration
 * @param guildId Discord guild ID
 * @returns true if guild is configured
 */
export function isGuildConfigured(guildId: string): boolean {
  const config = loadGuildConfig();
  if (!config) {
    return false;
  }
  return guildId in config && config[guildId].length > 0;
}

/**
 * Get the legacy CHANNEL_ID for backwards compatibility
 * @returns Channel ID string or null if not set
 */
export function getLegacyChannelId(): string | null {
  return process.env.CHANNEL_ID || null;
}

/**
 * Check if sharding is enabled
 * @returns true if ENABLE_SHARDING is set to "true"
 */
export function isShardingEnabled(): boolean {
  return process.env.ENABLE_SHARDING === 'true';
}

/**
 * Clear cached configuration (useful for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}
