/**
 * Shard Manager - Entry point for sharded bot execution.
 * 
 * Uses discord.js ShardingManager to spawn multiple bot instances,
 * distributing the load across multiple processes. This is only needed
 * for bots with 2500+ servers.
 * 
 * @module shard-manager
 */

import { ShardingManager } from 'discord.js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const token = process.env.DISCORD_TOKEN!;

if (!token) {
  console.error('[ShardManager] Error: DISCORD_TOKEN es requerido');
  process.exit(1);
}

/**
 * Creates and configures the ShardingManager instance.
 * 
 * @remarks
 * - mode: 'process' spawns child processes for each shard
 * - Each shard runs its own instance of the bot
 */
const shardManager = new ShardingManager(path.join(__dirname, 'bot.js'), {
  token,
  mode: 'process',
});

/**
 * Logs when a new shard is created and sets up event listeners.
 */
shardManager.on('shardCreate', (shard) => {
  console.log(`[ShardManager] Launched shard ${shard.id}`);

  // Handle shard termination
  shard.on('death', (processObj) => {
    const exitCode = 'exitCode' in processObj ? processObj.exitCode : 'unknown';
    console.error(`[Shard ${shard.id}] Proceso terminado unexpectedly: ${exitCode}`);
  });

  // Handle disconnection
  shard.on('disconnect', () => {
    console.warn(`[Shard ${shard.id}] Desconectado de Discord Gateway`);
  });

  // Handle reconnection
  shard.on('reconnecting', () => {
    console.log(`[Shard ${shard.id}] Reconectando...`);
  });
});

// Start all shards
console.log('[ShardManager] Iniciando sistema de sharding...');

shardManager
  .spawn()
  .then((shards) => {
    console.log(`[ShardManager] Shards iniciados: ${shards.size}`);
  })
  .catch((error) => {
    console.error('[ShardManager] Error iniciando shards:', error);
    process.exit(1);
  });

/**
 * Gracefully shuts down all shards when receiving termination signals.
 * 
 * @param signal - The signal that triggered the shutdown (e.g., SIGINT, SIGTERM)
 */
const shutdown = async (signal: string): Promise<void> => {
  console.log(`[ShardManager] Recibido ${signal}, cerrando shards...`);
  try {
    await shardManager.broadcastEval((c) => {
      return c.destroy();
    });
    console.log('[ShardManager] Shards cerrados correctamente');
    process.exit(0);
  } catch (error) {
    console.error('[ShardManager] Error durante shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
