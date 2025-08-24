# Discord Activity Bot

Bot de Discord en Node.js + TypeScript para mostrar tarjetas (cards) con las últimas actividades de los usuarios en canales de voz: quién entra, sale o cambia de canal, junto con la hora.

## Características

- Envía un card al canal configurado cuando un usuario entra, sale o cambia de canal de voz.
- Muestra nombre de usuario (nickname si tiene), avatar y hora del evento.
- Fácil configuración mediante archivo `.env`.

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

3. Copia el archivo `.env.example` a `.env` y completa los valores:

   ```bash
   cp .env.example .env
   ```

   - `DISCORD_TOKEN`: Token de tu bot de Discord.
   - `CLIENT_ID`: ID de cliente de tu aplicación de Discord.
   - `CHANNEL_ID`: ID del canal donde se enviarán los cards.

4. Compila el proyecto:

   ```bash
   npm run build
   ```

5. Ejecuta el bot:

   ```bash
   npm start
   ```

   O en modo desarrollo (hot reload):

   ```bash
   npm run dev
   ```

## Permisos necesarios

Al invitar el bot, asegúrate de incluir los siguientes scopes y permisos:

**Scopes:**

- `bot`
- `applications.commands`

**Permisos:**

- `View Channels` (Ver canales)
- `Send Messages` (Enviar mensajes)
- `Embed Links` (Insertar enlaces)
- `Read Message History` (Leer historial de mensajes)

> **Nota:** Para que el bot registre actividades en canales de voz, debes habilitar el intent "Server Members Intent" solo si quieres mostrar el nickname del usuario. Para la funcionalidad básica, basta con "Voice States".

Puedes generar el enlace de invitación desde el [Developer Portal de Discord](https://discord.com/developers/applications).

## Personalización

- Puedes modificar los mensajes y colores de los cards en `src/utils/sendVoiceCard.ts`.

## Soporte

Para dudas o mejoras, abre un issue o contacta al autor.

---
