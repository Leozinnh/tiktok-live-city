import { WebSocketServer, WebSocket } from 'ws';

export class WsHub {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Set();

    this.wss.on('connection', (ws, req) => {
      ws.isAlive = true;
      this.clients.add(ws);

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          if (data.type) {
            // Broadcast client message to all other connected clients
            this.broadcast(data.type, data.payload || {}, data.user || 'client');
          }
        } catch (e) {
          console.warn('[WsHub] Error parsing client message:', e.message);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', (err) => {
        console.error('[WsHub] Client error:', err.message);
        this.clients.delete(ws);
      });

      // Send initial welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        timestamp: Date.now(),
        message: 'Connected to NPC WORLD Server'
      }));
    });

    // Heartbeat check every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      for (const ws of this.clients) {
        if (!ws.isAlive) {
          this.clients.delete(ws);
          ws.terminate();
          continue;
        }
        ws.isAlive = false;
        ws.ping();
      }
    }, 30000);
  }

  broadcast(type, payload = {}, user = 'system') {
    const message = JSON.stringify({
      type,
      user,
      payload,
      timestamp: Date.now()
    });

    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  close() {
    clearInterval(this.heartbeatInterval);
    for (const ws of this.clients) {
      ws.terminate();
    }
    this.clients.clear();
    this.wss.close();
  }
}
