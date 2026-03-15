# Discord Activity Bot

Bot de Discord en Node.js + TypeScript para mostrar tarjetas (cards) con las últimas actividades de los usuarios en canales de voz: quién entra, sale o cambia de canal, junto con la hora.

## Características

- 👋 **Bienvenida**: Envía una tarjeta cuando un nuevo miembro se une al servidor
- 📥 **Entrada de voz**: Envía card cuando un usuario entra a un canal de voz
- 📤 **Salida de voz**: Envía card cuando un usuario sale de un canal de voz
- 🔄 **Cambio de canal**: Envía card cuando un usuario cambia de canal de voz
- 🔢 **Contador de conexiones**: Muestra cuántas veces un usuario se ha conectado a voz hoy
- 🌐 **Multi-server**: Funciona en múltiples servidores automáticamente
- 💾 **Persistencia automática**: Guarda la configuración por servidor en JSON
- ⚙️ **Configuración por servidor**: Cada server tiene su propio canal
- 📝 **Logs en archivo**: Guarda logs diarios en `logs/`, elimina los de más de 3 días
- 🔗 **Menciones clickeables**: Usuario y canal en las tarjetas son clickeables

## Requisitos

- Node.js >= 16.9
- Una aplicación de Discord creada ([Guía oficial](https://discord.com/developers/applications))
- Permisos del bot:
  - `View Channels`
  - `Send Messages`
  - `Embed Links`
  - `Read Message History`

## Instalación

1. Clona el repositorio y entra a la carpeta:

   ```bash
   git clone <url-del-repo>
   cd discord-activity
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Copia el archivo `.env.example` a `.env`:

   ```bash
   cp .env.example .env
   ```

   Edita `.env` con tus datos (solo TOKEN y CLIENT_ID son obligatorios):

   ```env
   DISCORD_TOKEN=tu_token_aqui
   CLIENT_ID=tu_client_id_aqui
   ```

4. Compila el proyecto:

   ```bash
   npm run build
   ```

5. Ejecuta el bot:

   ```bash
   npm start
   ```

   O en modo desarrollo:

   ```bash
   npm run dev
   ```

## Invitar el Bot

**[Haz clic aquí para invitar el bot a tu servidor](https://discord.com/oauth2/authorize?client_id=1407996388725493800&permissions=84992&integration_type=0&scope=bot+applications.commands)**

O manualmente:

Al invitar el bot, asegúrate de incluir los siguientes permisos:

**Permisos:**
- `View Channels` (Ver canales)
- `Send Messages` (Enviar mensajes)
- `Embed Links` (Insertar enlaces)
- `Read Message History` (Leer historial de mensajes)

Genera el enlace desde el [Developer Portal de Discord](https://discord.com/developers/applications) o usa:

```
https://discord.com/oauth2/authorize?client_id=TU_CLIENT_ID&scope=bot%20applications.commands&permissions=334187728
```

## Configuración

El bot se configura automáticamente en cada servidor. Solo necesitás ejecutar el comando `/setchannel` para indicar dónde se enviarán las tarjetas.

### Por comando (recomendado)

En cada servidor donde esté el bot, escribí:

```
/setchannel #nombre-del-canal
```

El bot recordará la configuración en `data/guilds.json`.

### Sharding (opcional)

Si tenés más de 2500 servidores, podés habilitar sharding:

```env
ENABLE_SHARDING=true
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `/ping` | Verifica si el bot está activo |
| `/guilds` | Lista todos los servidores y sus canales configurados |
| `/setchannel #canal` | Configura el canal de texto para las tarjetas |

## Persistencia

El bot guarda la configuración en `data/guilds.json`:

```json
{
  "version": 1,
  "guilds": {
    "123456789": {
      "guildId": "123456789",
      "guildName": "Mi Servidor",
      "channelIds": ["987654321"],
      "active": true,
      "joinedAt": "2026-03-15T12:00:00.000Z"
    }
  }
}
```

- Cuando el bot se une a un servidor → se guarda automáticamente
- Cuando el bot se va de un servidor → se marca como `active: false`
- Cada servidor puede tener múltiples canales configurados

## Estructura del Proyecto

```
discord-activity/
├── src/
│   ├── bot.ts              # Lógica principal del bot
│   ├── index.ts           # Entry point
│   ├── shard-manager.ts   # Sharding (opcional)
│   ├── config/
│   │   ├── guild-config.ts       # Configuración
│   │   ├── guild-persistence.ts  # Persistencia JSON de guilds
│   │   └── voice-tracker.ts      # Contador de conexiones de voz
│   ├── types/
│   │   ├── activity.ts   # Tipos de tarjetas
│   │   └── config.ts     # Tipos de configuración
│   ├── utils/
│   │   ├── send-voice-card.ts  # Envío de tarjetas de voz
│   │   └── logger.ts            # Sistema de logs
│   └── cards/
│       └── send-connection-card.ts  # Tarjeta de bienvenida
├── data/
│   ├── guilds.json           # Base de datos de servidores
│   └── voice-connections.json # Contador de conexiones de voz
├── logs/
│   └── discord-activity-YYYY-MM-DD.log  # Logs diarios
└── .env                   # Tus credenciales (no subir al repo)
```

## Personalización

Podés modificar los mensajes y colores de las tarjetas en:
- `src/utils/send-voice-card.ts` - Tarjetas de voz
- `src/cards/send-connection-card.ts` - Tarjeta de bienvenida

## Archivo .gitignore

Asegurate de tener `data/`, `logs/` y `.env` en tu `.gitignore`:

```gitignore
node_modules/
dist/
.env
data/
logs/
```

---

Para más detalles de uso, ver [USAGE.md](USAGE.md)
