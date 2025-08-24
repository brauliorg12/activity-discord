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
import { sendVoiceCard } from './utils/sendVoiceCard';
import { VoiceActivityCardData } from './types/activity';

dotenv.config();

const token = process.env.DISCORD_TOKEN!;
const channelId = process.env.CHANNEL_ID!;
const clientId = process.env.CLIENT_ID!;

if (!token || !channelId || !clientId) {
  console.error('Faltan variables de entorno. Revisa tu archivo .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

// Registro de comandos slash global
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Verifica si el bot está activo')
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(token);

async function registerCommands() {
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`[Comandos] Comando /ping registrado globalmente`);
  } catch (error) {
    console.error('[Comandos] Error al registrar comandos:', error);
  }
}

client.once('ready', async () => {
  let channel: TextChannel | null = null;
  let guild: Guild | null = null;
  for (const [, g] of client.guilds.cache) {
    if (g.channels.cache.has(channelId)) {
      guild = g;
      channel = g.channels.cache.get(channelId) as TextChannel;
      break;
    }
  }
  if (!channel) {
    for (const [, g] of client.guilds.cache) {
      try {
        const fetched = await g.channels.fetch(channelId);
        if (fetched && fetched.isTextBased()) {
          guild = g;
          channel = fetched as TextChannel;
          break;
        }
      } catch {}
    }
  }
  const now = new Date();
  console.log('='.repeat(50));
  console.log(`[INFO] Bot iniciado como: ${client.user?.tag}`);
  console.log(`[INFO] Estado: ${client.user?.presence?.status ?? 'online'}`);
  if (guild) {
    console.log(`[INFO] Servidor conectado: ${guild.name} (${guild.id})`);
  } else {
    console.log(`[INFO] Servidor no encontrado para el canal (${channelId})`);
  }
  if (channel) {
    console.log(`[INFO] Canal conectado: ${channel.name} (${channel.id})`);
  } else {
    console.log(`[INFO] Canal no encontrado (${channelId})`);
  }
  console.log(`[INFO] Hora de inicio: ${now.toLocaleString()}`);
  console.log('='.repeat(50));
  await registerCommands();
});

client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'ping') {
    await interaction.reply({
      content: '🟢 ¡El bot está activo y conectado!',
      ephemeral: true,
    });
  }
});

// Evento para cambios en canales de voz (entrada, salida y cambio)
client.on('voiceStateUpdate', async (oldState, newState) => {
  const member = newState.member || oldState.member;
  if (!member || member.user.bot) return;

  let data: VoiceActivityCardData | null = null;

  if (!oldState.channel && newState.channel) {
    data = {
      member,
      action: 'entrada',
      color: 0x57f287,
      channelName: newState.channel.name,
    };
  } else if (oldState.channel && !newState.channel) {
    data = {
      member,
      action: 'salida',
      color: 0xed4245,
      channelName: oldState.channel.name,
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
      oldChannelName: oldState.channel.name,
    };
  }

  if (data) {
    await sendVoiceCard(client, channelId, data);
  }
});

client.login(token);
