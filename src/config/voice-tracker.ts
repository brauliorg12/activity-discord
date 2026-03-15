/**
 * Voice Connections Tracker - Tracks daily voice channel connections.
 * 
 * Stores connection counts per user per day.
 * NOTE: Discord already stores messages with dates, so this is optional.
 * 
 * @module config/voice-tracker
 */

import fs from 'fs/promises';
import path from 'path';

export interface VoiceConnectionRecord {
  userId: string;
  guildId: string;
  date: string; // YYYY-MM-DD
  count: number;
}

export interface VoiceConnectionDatabase {
  version: number;
  connections: VoiceConnectionRecord[];
}

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'voice-connections.json');

/**
 * Get today's date string
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Ensure data directory exists
 */
async function ensureDataDir(): Promise<void> {
  const dataDir = path.dirname(DB_PATH);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch {
    // Already exists
  }
}

/**
 * Load voice connections database
 */
export async function loadVoiceConnections(): Promise<VoiceConnectionDatabase> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data) as VoiceConnectionDatabase;
  } catch {
    return { version: 1, connections: [] };
  }
}

/**
 * Save voice connections database
 */
async function saveVoiceConnections(db: VoiceConnectionDatabase): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

/**
 * Record a voice connection and get the updated count.
 * 
 * @param userId - The user's ID
 * @param guildId - The guild's ID
 * @returns The connection count for today
 */
export async function recordVoiceConnection(
  userId: string,
  guildId: string
): Promise<number> {
  const db = await loadVoiceConnections();
  const today = getTodayDate();

  // Find existing record
  const existingIndex = db.connections.findIndex(
    c => c.userId === userId && c.guildId === guildId && c.date === today
  );

  let count = 1;

  if (existingIndex >= 0) {
    // Increment existing count
    db.connections[existingIndex].count += 1;
    count = db.connections[existingIndex].count;
  } else {
    // Add new record
    db.connections.push({
      userId,
      guildId,
      date: today,
      count: 1,
    });
  }

  await saveVoiceConnections(db);
  return count;
}

/**
 * Get today's connection count for a user in a guild.
 * 
 * @param userId - The user's ID
 * @param guildId - The guild's ID
 * @returns Connection count or 0 if none
 */
export async function getTodayConnectionCount(
  userId: string,
  guildId: string
): Promise<number> {
  const db = await loadVoiceConnections();
  const today = getTodayDate();

  const record = db.connections.find(
    c => c.userId === userId && c.guildId === guildId && c.date === today
  );

  return record?.count || 0;
}
