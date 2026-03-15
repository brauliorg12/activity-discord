/**
 * Main entry point - decides between sharded or single-process mode
 */

import * as dotenv from 'dotenv';
import { isShardingEnabled } from './config/guild-config';

dotenv.config();

// Load configuration and determine mode of operation
const shardingEnabled = isShardingEnabled();

// Log configuration
console.log('='.repeat(50));
console.log('[Main] Iniciando Discord Activity Bot...');

if (shardingEnabled) {
  console.log('[Main] Modo: SHARDING habilitado');
} else {
  console.log('[Main] Modo: Single-process');
}
console.log('='.repeat(50));

if (shardingEnabled) {
  // Import and run ShardingManager
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('./shard-manager');
} else {
  // Run single-process bot directly
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('./bot');
}
