# Dashboard YOYO Helper

Funksjoner for å sende data til Dashboard YOYO fra Kimi.

## API Endepunkter

Base URL: `https://dashboardyoyo.com`

### Send Feed Update
```bash
POST /api/feed
Content-Type: application/json

{
  "type": "success|info|warning|error|system",
  "message": "Your message here",
  "agent": {
    "name": "Kimi",
    "icon": "🤖"
  },
  "metadata": {} // optional
}
```

### Send Chat Message
```bash
POST /api/chat
Content-Type: application/json

{
  "text": "Hello from Telegram!",
  "sender": "agent",
  "agentId": "kimi"
}
```

### Update Agent Status
```bash
POST /api/agents
Content-Type: application/json

{
  "agentId": "kimi",
  "status": "active|idle|error",
  "name": "Kimi",
  "icon": "🤖",
  "currentTask": "What Kimi is doing",
  "metrics": {}
}
```

### Get Stats
```bash
GET /api/stats
```

### Get Agents
```bash
GET /api/agents
```

### Get Feed
```bash
GET /api/feed?limit=20
```

### Get Chat
```bash
GET /api/chat?limit=50
```

## Telegram Bot

- **Bot:** @testkimiiibot
- **Token:** 8564487018:AAFQ4ViP3-e84znrkMOdVZoqn0BYzOO_sr8
- **Webhook:** https://dashboardyoyo.com/api/telegram
- **Chat ID:** 1715010575 (yoyokoko12)

## Hvordan det fungerer

1. **Du skriver i dashboard chat** → Melding sendes til Telegram
2. **Jeg svarer på Telegram** → Melding vises i dashboard
3. **Feed oppdateringer** → Viser live aktivitet
4. **Agent status** → Viser hva jeg jobber med
