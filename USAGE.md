# Guía de Uso - Discord Activity Bot

## Inicio Rápido

### 1. Configuración Inicial

```bash
# Instalar dependencias
npm install

# Copiar .env.example a .env y completar con tus datos
cp .env.example .env

# Compilar
npm run build

# Ejecutar
npm start
```

### 2. Invitar el Bot

1. Ve al [Discord Developer Portal](https://discord.com/developers/applications)
2. Selecciona tu aplicación
3. Ve a "OAuth2" > "URL Generator"
4. Selecciona los scopes:
   - `bot`
   - `applications.commands`
5. Selecciona los permisos:
   - `View Channels`
   - `Send Messages`
   - `Embed Links`
   - `Read Message History`
6. Copia el URL generado e invita al bot

### 3. Configurar el Canal

Ejecutá el comando `/setchannel` en el servidor:

```
/setchannel #nombre-del-canal
```

Discord te mostrará automáticamente la lista de canales disponibles.

---

## Comandos

### `/ping`
Verifica que el bot esté funcionando.

**Uso:**
```
/ping
```

**Respuesta:**
```
🟢 Bot activo en 1 servidores
```

---

### `/guilds`
Lista todos los servidores donde está el bot y sus canales configurados.

**Uso:**
```
/guilds
```

**Respuesta:**
```
**Mi Servidor** (123456789012345678)
   Canales: 987654321098765432, 555555555555555555
```

---

### `/setchannel`
Configura el canal de texto donde se enviarán las tarjetas de actividad de voz.

**Uso:**
```
/setchannel #actividad
```

**Nota:** Discord te mostrará automáticamente la lista de canales disponibles en el servidor.

**Respuesta:**
```
✅ Canal configurado: #actividad (987654321098765432) para Mi Servidor
```

---

## Cómo Funciona

### Persistencia Automática

El bot mantiene un registro de todos los servidores en `data/guilds.json`:

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

### Eventos Rastreados

1. **Entrada**: Usuario entra a un canal de voz
2. **Salida**: Usuario sale de un canal de voz
3. **Cambio**: Usuario cambia de un canal a otro

### Flujo

```
Usuario entra a canal de voz
        ↓
Bot detecta evento voiceStateUpdate
        ↓
Obtiene guildId del evento
        ↓
Busca canales configurados en data/guilds.json
        ↓
Envía tarjeta al/los canal/es configurados
        ↓
Logs: [Voice] Tarjeta enviada a canal X en Guild Y
```

---

## Configuración por Servidor

### Un Canal por Servidor

```
/setchannel #general
```

### Múltiples Canales por Servidor

Por ahora, cada servidor usa un solo canal. Para agregar más, editá `data/guilds.json` directamente:

```json
{
  "guilds": {
    "123456789": {
      "channelIds": ["111", "222", "333"]
    }
  }
}
```

---

## Solución de Problemas

### El bot no responde a comandos

1. Verificá que el bot esté online (`/ping`)
2. Asegurate de que el bot tenga permisos de `applications.commands`
3. Revisa los logs en la consola

### No llega la tarjeta de voz

1. Verificá que el canal esté configurado: `/guilds`
2. Si no hay canal, usá `/setchannel #canal`
3. Revisá que el bot tenga permisos en ese canal
4. Verificá los logs de la consola

### Error: "Channel not found"

El ID del canal puede ser incorrecto. Para obtener el ID:
1. Activá "Developer Mode" en Discord (Configuración > Avanzado > Modo desarrollador)
2. Click derecho en el canal > "Copiar ID de canal"

### El bot no detecta todos los servidores

- El bot solo detecta servidores donde está presente
- Cada servidor debe tener al menos un canal configurado para recibir tarjetas

---

## Sharding (Avanzado)

Solo necesario si tenés **más de 2500 servidores**.

```env
ENABLE_SHARDING=true
```

El sharding reparte la carga en múltiples procesos.

---

## Producción

### Variables de Entorno

```env
DISCORD_TOKEN=tu_bot_token
CLIENT_ID=tu_client_id
```

### Monitoreo

El bot genera logs claros:

```
[INFO] Bot iniciado como: Activity#3683
[INFO] Servidores conectados: 5
[GuildDB] Guilds activos en BD: 5
[Voice] Tarjeta enviada a canal 987654321 en Mi Servidor
```

---

## Sistema de Logs

### Ubicación

Los logs se guardan en `logs/discord-activity-YYYY-MM-DD.log`:

```
logs/
├── discord-activity-2026-03-15.log
├── discord-activity-2026-03-14.log
└── discord-activity-2026-03-13.log  ← se borra automáticamente
```

### Características

- **Logs diarios**: Un archivo por día
- **Limpieza automática**: Elimina logs de más de 3 días
- **Consola + archivo**: Todo lo que sale en consola también se guarda

### Niveles de Log

- `[INFO]` - Información general
- `[WARN]` - Advertencias
- `[ERROR]` - Errores
- `[Voice]` - Eventos de voz

### Monitoreo en Producción

```bash
# Ver logs en tiempo real
tail -f logs/discord-activity-2026-03-15.log

# Ver últimos 50 líneas
tail -n 50 logs/discord-activity-2026-03-15.log
```

### Error: "Missing Access"

Si ves el error `DiscordAPIError[50001]: Missing Access`:

1. **Reinvita el bot** al servidor con permisos completos
2. Verificá los **permisos del canal específico**:
   - Click derecho en el canal > Editar canal > Permisos
   - Asegurate que el bot tenga permisos de Enviar Mensajes
3. Probá en un **canal de texto normal** (no de announcements)

---

## Contribuir

1. Fork del repo
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agrega nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abrir Pull Request
