/**
 * Logger utility - writes logs to files and cleans up old logs
 * Also intercepts console.log to write to file
 */

import fs from 'fs/promises';
import path from 'path';

const LOGS_DIR = path.join(__dirname, '..', '..', 'logs');
const MAX_DAYS = 3;

let logsInitialized = false;

/**
 * Ensure logs directory exists
 */
async function ensureLogsDir(): Promise<void> {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  } catch (error) {
    console.error('[Logger] Error creating logs dir:', error);
  }
}

/**
 * Get today's log filename
 */
function getTodayLogFile(): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `discord-activity-${today}.log`;
}

/**
 * Write a log message to file
 */
async function writeToFile(message: string): Promise<void> {
  try {
    await ensureLogsDir();
    const logFile = path.join(LOGS_DIR, getTodayLogFile());
    await fs.appendFile(logFile, message + '\n');
  } catch (error) {
    // Silently fail to avoid infinite loops
  }
}

/**
 * Initialize logger - overwrites console.log to also write to file
 */
export function initLogger(): void {
  if (logsInitialized) return;
  logsInitialized = true;

  // Store original console.log
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  // Override console.log
  console.log = (...args: unknown[]) => {
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}`;
    
    // Write to file
    writeToFile(logLine);
    
    // Call original
    originalLog.apply(console, args);
  };

  // Override console.error
  console.error = (...args: unknown[]) => {
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [ERROR] ${message}`;
    
    writeToFile(logLine);
    originalError.apply(console, args);
  };

  // Override console.warn
  console.warn = (...args: unknown[]) => {
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [WARN] ${message}`;
    
    writeToFile(logLine);
    originalWarn.apply(console, args);
  };

  console.log('[Logger] Initialized - logs will be saved to', LOGS_DIR);
}

/**
 * Clean up logs older than MAX_DAYS
 */
export async function cleanupOldLogs(): Promise<void> {
  try {
    await ensureLogsDir();
    
    const files = await fs.readdir(LOGS_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_DAYS);

    for (const file of files) {
      if (!file.startsWith('discord-activity-') || !file.endsWith('.log')) {
        continue;
      }

      const filePath = path.join(LOGS_DIR, file);
      const stats = await fs.stat(filePath);

      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        console.log(`[Logger] Deleted old log: ${file}`);
      }
    }
  } catch (error) {
    console.error('[Logger] Error cleaning up logs:', error);
  }
}

/**
 * Run cleanup on startup and every 24 hours
 */
export async function startLogCleanup(): Promise<void> {
  // Initialize logger first (overrides console.log)
  initLogger();
  
  // Cleanup on startup
  await cleanupOldLogs();

  // Cleanup every 24 hours
  setInterval(() => {
    cleanupOldLogs();
  }, 24 * 60 * 60 * 1000);
}

// Export logger object for explicit use
export const logger = {
  info: (msg: string) => console.log(msg),
  warn: (msg: string) => console.warn(msg),
  error: (msg: string) => console.error(msg),
  debug: (msg: string) => console.log('[DEBUG]', msg),
};
