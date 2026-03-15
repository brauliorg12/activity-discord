/**
 * Guild persistence manager - stores guild configuration in JSON file
 * Automatically tracks guilds the bot is in
 */

import fs from 'fs/promises';
import path from 'path';

export interface GuildRecord {
  guildId: string;
  guildName: string;
  channelIds: string[];  // Canales donde enviar tarjetas de voz
  active: boolean;
  joinedAt: string;
  leftAt?: string;
}

export interface GuildDatabase {
  version: number;
  guilds: Record<string, GuildRecord>;
}

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'guilds.json');

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  const dataDir = path.dirname(DB_PATH);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch {
    // Directory already exists
  }
}

/**
 * Load guild database from JSON file
 */
export async function loadGuildDatabase(): Promise<GuildDatabase> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data) as GuildDatabase;
  } catch {
    // Return empty database if file doesn't exist
    return { version: 1, guilds: {} };
  }
}

/**
 * Save guild database to JSON file
 */
export async function saveGuildDatabase(db: GuildDatabase): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

/**
 * Get all active guilds
 */
export function getActiveGuilds(db: GuildDatabase): GuildRecord[] {
  return Object.values(db.guilds).filter(g => g.active);
}

/**
 * Get guild by ID
 */
export function getGuild(db: GuildDatabase, guildId: string): GuildRecord | null {
  return db.guilds[guildId] || null;
}

/**
 * Check if guild is active and configured
 */
export function isGuildActive(db: GuildDatabase, guildId: string): boolean {
  const guild = db.guilds[guildId];
  return guild !== undefined && guild.active;
}

/**
 * Add or update a guild when bot joins
 */
export async function addGuild(
  guildId: string,
  guildName: string,
  defaultChannelId?: string
): Promise<GuildDatabase> {
  const db = await loadGuildDatabase();
  
  const existing = db.guilds[guildId];
  
  // If defaultChannelId is provided, use it. Otherwise keep existing channels.
  const channelIds = defaultChannelId 
    ? [defaultChannelId] 
    : (existing?.channelIds || []);
  
  db.guilds[guildId] = {
    guildId,
    guildName,
    channelIds,
    active: true,
    joinedAt: existing?.joinedAt || new Date().toISOString(),
    leftAt: undefined,
  };
  
  await saveGuildDatabase(db);
  console.log(`[GuildDB] Añadido/actualizado: ${guildName} (${guildId}) - Canales: ${channelIds.join(', ')}`);
  
  return db;
}

/**
 * Mark guild as inactive when bot is removed
 */
export async function removeGuild(guildId: string): Promise<GuildDatabase> {
  const db = await loadGuildDatabase();
  
  if (db.guilds[guildId]) {
    db.guilds[guildId].active = false;
    db.guilds[guildId].leftAt = new Date().toISOString();
    await saveGuildDatabase(db);
    console.log(`[GuildDB] Marcado como inactivo: ${db.guilds[guildId].guildName} (${guildId})`);
  }
  
  return db;
}

/**
 * Add a channel to a guild's configuration
 */
export async function addChannelToGuild(
  guildId: string,
  channelId: string
): Promise<GuildDatabase> {
  const db = await loadGuildDatabase();
  
  if (db.guilds[guildId] && !db.guilds[guildId].channelIds.includes(channelId)) {
    db.guilds[guildId].channelIds.push(channelId);
    await saveGuildDatabase(db);
    console.log(`[GuildDB] Canal ${channelId} añadido a guild ${guildId}`);
  }
  
  return db;
}

/**
 * Remove a channel from a guild's configuration
 */
export async function removeChannelFromGuild(
  guildId: string,
  channelId: string
): Promise<GuildDatabase> {
  const db = await loadGuildDatabase();
  
  if (db.guilds[guildId]) {
    db.guilds[guildId].channelIds = db.guilds[guildId].channelIds.filter(
      c => c !== channelId
    );
    await saveGuildDatabase(db);
  }
  
  return db;
}

/**
 * Set channels for a specific guild
 */
export async function setGuildChannels(
  guildId: string,
  channelIds: string[]
): Promise<GuildDatabase> {
  const db = await loadGuildDatabase();
  
  if (db.guilds[guildId]) {
    db.guilds[guildId].channelIds = channelIds;
    await saveGuildDatabase(db);
  }
  
  return db;
}

/**
 * Get all guilds (for debugging/logging)
 */
export async function getAllGuildsSummary(): Promise<string> {
  const db = await loadGuildDatabase();
  const lines: string[] = [];
  
  lines.push('=== Guild Database ===');
  lines.push(`Total: ${Object.keys(db.guilds).length}`);
  lines.push('');
  
  for (const guild of Object.values(db.guilds)) {
    const status = guild.active ? '🟢' : '🔴';
    lines.push(`${status} ${guild.guildName} (${guild.guildId})`);
    lines.push(`   Canales: ${guild.channelIds.join(', ') || 'ninguno'}`);
    lines.push(`   Joined: ${guild.joinedAt}`);
    if (guild.leftAt) {
      lines.push(`   Left: ${guild.leftAt}`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}
