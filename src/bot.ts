/**
 * Bot entry point - executed by each shard
 * This file contains all the Discord client logic
 */

import {
  Client,
  GatewayIntentBits,
  TextChannel,
  REST,
  Routes,
  SlashCommandBuilder,
  Interaction,
  Guild,
} from 'discord.js';
import * as dotenv from 'dotenv';
import { sendVoiceCard } from './utils/send-voice-card';
import { VoiceActivityCardData } from './types/activity';
import {
  loadGuildDatabase,
  addGuild,
  removeGuild,
  isGuildActive,
  getGuild,
} from './config/guild-persistence';
import { logger, startLogCleanup } from './utils/logger';

dotenv.config();

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;

// Validate required environment variables
if (!token || !clientId) {
  console.error(
    '[Bot] Faltan variables de entorno: DISCORD_TOKEN y CLIENT_ID son requeridos',
  );
  process.exit(1);
}

console.log('[Config] Usando configuración por servidor (/setchannel)');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

// Start log cleanup (runs on startup and every 24 hours)
startLogCleanup().catch((err) =>
  console.error('[Logger] Error starting cleanup:', err),
);

// Registro de comandos slash global
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Verifica si el bot está activo')
    .setName('guilds')
    .setDescription('Lista los servidores conectados')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('Configura el canal para tarjetas de voz')
    .addChannelOption((option) =>
      option
        .setName('canal')
        .setDescription('Canal de texto donde enviar las tarjetas')
        .setRequired(true),
    )
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(token);

async function registerCommands() {
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`[Comandos] Comandos registrados globalmente`);
  } catch (error) {
    console.error('[Comandos] Error al registrar comandos:', error);
  }
}

/**
 * Initialize guild database with current guilds
 */
async function initializeGuildDatabase(): Promise<void> {
  console.log('[GuildDB] Iniciando base de datos de guilds...');

  const db = await loadGuildDatabase();

  // Sync: ensure all current guilds are in the database
  for (const [, guild] of client.guilds.cache) {
    const existing = db.guilds[guild.id];

    if (!existing || !existing.active) {
      // New guild or re-joined - don't assign channel automatically
      await addGuild(guild.id, guild.name);
    }
  }

  // Log summary
  const activeGuilds = Object.values(db.guilds).filter((g) => g.active);
  console.log(`[GuildDB] Guilds activos en BD: ${activeGuilds.length}`);
  console.log(`[GuildDB] Guilds conocidos: ${Object.keys(db.guilds).length}`);
}

client.once('ready', async () => {
  // Log startup info (adapted for multi-guild)
  const now = new Date();
  console.log('='.repeat(50));
  console.log(`[INFO] Bot iniciado como: ${client.user?.tag}`);
  console.log(
    `[INFO] Shard: ${client.shard?.ids.join(', ') ?? 'single-process'}`,
  );
  console.log(`[INFO] Estado: ${client.user?.presence?.status ?? 'online'}`);
  console.log(`[INFO] Servidores conectados: ${client.guilds.cache.size}`);

  // Initialize guild database
  await initializeGuildDatabase();

  console.log(`[INFO] Hora de inicio: ${now.toLocaleString()}`);
  console.log('='.repeat(50));
  await registerCommands();
});

client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply({
      content: `🟢 Bot activo en ${client.guilds.cache.size} servidores`,
      ephemeral: true,
    });
  }

  if (interaction.commandName === 'guilds') {
    const db = await loadGuildDatabase();
    const lines: string[] = [];

    for (const guild of client.guilds.cache.values()) {
      const record = db.guilds[guild.id];
      const channels = record?.channelIds.join(', ') || 'no configurado';
      lines.push(`**${guild.name}** (${guild.id})\n   Canales: ${channels}`);
    }

    await interaction.reply({
      content: lines.join('\n\n') || 'No hay servidores',
      ephemeral: true,
    });
  }

  if (interaction.commandName === 'setchannel') {
    const channel = interaction.options.getChannel('canal');
    if (!channel || !('send' in channel)) {
      await interaction.reply({
        content: '❌ Debes seleccionar un canal de texto',
        ephemeral: true,
      });
      return;
    }

    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply({
        content: '❌ Este comando debe usarse en un servidor',
        ephemeral: true,
      });
      return;
    }

    const guild = interaction.guild;
    await addGuild(guildId, guild?.name || 'Unknown', channel.id);

    await interaction.reply({
      content: `✅ Canal configurado: ${channel.name} (${channel.id}) para ${guild?.name}`,
      ephemeral: true,
    });
  }
});

/**
 * Handle guild join
 */
client.on('guildCreate', async (guild) => {
  console.log(`[Guild] Bot añadido a: ${guild.name} (${guild.id})`);
  // No asignar canal automáticamente - el usuario debe configurar con /setchannel
  await addGuild(guild.id, guild.name);
});

/**
 * Handle guild leave/delete
 */
client.on('guildDelete', async (guild) => {
  console.log(`[Guild] Bot removido de: ${guild.name} (${guild.id})`);
  await removeGuild(guild.id);
});

/**
 * Send voice activity card to appropriate channels based on guild configuration
 */
async function sendVoiceActivityCard(
  guildId: string,
  data: VoiceActivityCardData,
): Promise<void> {
  console.log(`[Voice] Evento detectado para guild: ${guildId}`);

  // First check guild database for active guild
  const db = await loadGuildDatabase();
  console.log(`[Voice] Guilds en BD: ${Object.keys(db.guilds).length}`);

  const guildRecord = getGuild(db, guildId);
  console.log(`[Voice] Guild record:`, guildRecord);

  // Check if guild is active in our database
  if (!guildRecord) {
    console.log(`[Voice] Guild ${guildId} NO encontrado en BD`);
    return;
  }

  if (!guildRecord.active) {
    console.log(
      `[Voice] Guild ${guildId} no está activo en la base de datos, ignorando evento`,
    );
    return;
  }

  // Get channels from database
  let targetChannels: string[] | null = null;

  if (guildRecord.channelIds && guildRecord.channelIds.length > 0) {
    // Use channels from database
    targetChannels = guildRecord.channelIds;
    console.log(
      `[Voice] Usando canales del JSON: ${targetChannels.join(', ')}`,
    );
  } else {
    console.log(`[Voice] Sin configuración de canales`);
  }

  if (!targetChannels || targetChannels.length === 0) {
    console.log(
      `[Voice] Guild ${guildRecord.guildName} (${guildId}) no tiene canales configurados`,
    );
    return;
  }

  // Send card to all configured channels for this guild
  for (const channelId of targetChannels) {
    try {
      await sendVoiceCard(client, channelId, data);
      console.log(
        `[Voice] ✅ Tarjeta enviada a canal ${channelId} en ${guildRecord.guildName}`,
      );
    } catch (error) {
      console.error(
        `[Voice] Error enviando tarjeta al canal ${channelId}:`,
        error,
      );
    }
  }
}

// Evento para cambios en canales de voz (entrada, salida y cambio)
client.on('voiceStateUpdate', async (oldState, newState) => {
  const member = newState.member || oldState.member;
  if (!member || member.user.bot) return;

  // Get guild ID from the voice state
  const guildId = oldState.guild.id || newState.guild.id;
  if (!guildId) return;

  let data: VoiceActivityCardData | null = null;

  if (!oldState.channel && newState.channel) {
    data = {
      member,
      action: 'entrada',
      color: 0x57f287,
      channelName: newState.channel.name,
      channelId: newState.channel.id,
      guildId,
    };
  } else if (oldState.channel && !newState.channel) {
    data = {
      member,
      action: 'salida',
      color: 0xed4245,
      channelName: oldState.channel.name,
      channelId: oldState.channel.id,
      guildId,
    };
  } else if (
    oldState.channel &&
    newState.channel &&
    oldState.channel.id !== newState.channel.id
  ) {
    data = {
      member,
      action: 'cambio',
      color: 0x5865f2,
      channelName: newState.channel.name,
      channelId: newState.channel.id,
      guildId,
      oldChannelName: oldState.channel.name,
    };
  }

  if (data) {
    await sendVoiceActivityCard(guildId, data);
  }
});

/**
 * Handle new member join - send welcome card
 */
client.on('guildMemberAdd', async (member) => {
  if (member.user.bot) return;

  const guildId = member.guild.id;
  const db = await loadGuildDatabase();
  const guildRecord = getGuild(db, guildId);

  if (!guildRecord || !guildRecord.active) return;
  if (!guildRecord.channelIds || guildRecord.channelIds.length === 0) return;

  // Send to first configured channel
  const channelId = guildRecord.channelIds[0];
  
  try {
    const { sendConnectionCard } = await import('./cards/send-connection-card');
    await sendConnectionCard(client, channelId, member);
    console.log(`[Member] Bienvenida enviada a ${member.user.tag} en guild ${guildRecord.guildName}`);
  } catch (error) {
    console.error(`[Member] Error enviando bienvenida:`, error);
  }
});

// Export client for ShardingManager
export { client };

// Start the bot
client.login(token);
