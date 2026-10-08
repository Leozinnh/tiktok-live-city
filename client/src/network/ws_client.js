export class WsClient {
  constructor(url = null) {
    this.url = url || `ws://${window.location.hostname || 'localhost'}:3000`;
    this.ws = null;
    this.listeners = new Map();
    this.retryDelay = 1000;
    this.maxRetryDelay = 10000;
    this.isConnected = false;

    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.retryDelay = 1000;
        this.emit('connected', { timestamp: Date.now() });
        console.log('[WsClient] Conectado ao servidor NPC WORLD!');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
          if (data.type) {
            this.emit(data.type, data);
          }
        } catch (err) {
          console.warn('[WsClient] Mensagem não parseável:', event.data);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('disconnected', {});
        console.warn(`[WsClient] Conexão encerrada. Reconectando em ${this.retryDelay / 1000}s...`);
        setTimeout(() => this.connect(), this.retryDelay);
        this.retryDelay = Math.min(this.retryDelay * 1.5, this.maxRetryDelay);
      };

      this.ws.onerror = (err) => {
        this.emit('error', err);
      };
    } catch (e) {
      setTimeout(() => this.connect(), this.retryDelay);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        cb(data);
      }
    }
  }

  send(type, payload = {}, user = 'client') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload, user, timestamp: Date.now() }));
    }
  }
}
