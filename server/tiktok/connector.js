import { sanitizeUsername, sanitizeComment, mapGiftToAction, mapCommentToCommand } from './sanitizer.js';
import { MockFeeder } from './mock_feeder.js';

export class TikTokConnector {
  constructor(options = {}) {
    this.onEvent = options.onEvent || (() => {});
    this.connected = false;
    this.username = null;
    this.isMockMode = false;
    this.mockFeeder = null;
  }

  async connect(liveUsername) {
    this.username = liveUsername;
    const cleanUser = String(liveUsername || '').replace(/^@/, '').trim();

    if (!cleanUser || cleanUser.startsWith('mock')) {
      console.log(`[TikTokConnector] Iniciando em Modo Mock/Simulação para @${cleanUser || 'cidade'}`);
      this.isMockMode = true;
      this.connected = true;

      this.mockFeeder = new MockFeeder({
        intervalMs: 8000,
        onEvent: (event) => this.onEvent(event)
      });
      this.mockFeeder.start();

      return { success: true, mode: 'mock' };
    }

    try {
      // Try importing tiktok-live-connector if present in node_modules
      let TikTokLiveConnector;
      try {
        const module = await import('@tobiasmue91/tiktok-live-connector');
        TikTokLiveConnector = module.WebcastPushConnection;
      } catch (err) {
        // Fallback gracefully
        console.warn('[TikTokConnector] Conector nativo TikTok não instalado. Usando simulador resiliente.');
        this.isMockMode = true;
        this.connected = true;
        this.mockFeeder = new MockFeeder({
          intervalMs: 8000,
          onEvent: (event) => this.onEvent(event)
        });
        this.mockFeeder.start();
        return { success: true, mode: 'mock_fallback' };
      }

      const connection = new TikTokLiveConnector(cleanUser, {
        processInitialData: false,
        enableExtendedGiftInfo: true
      });

      const state = await connection.connect();
      this.connected = true;
      this.connection = connection;

      connection.on('chat', (data) => {
        const cleanComment = sanitizeComment(data.comment);
        const command = mapCommentToCommand(cleanComment);
        this.onEvent({
          type: 'comment',
          user: sanitizeUsername(data.uniqueId),
          nickname: data.nickname,
          comment: cleanComment,
          command,
          action: command || null,
          timestamp: Date.now()
        });
      });

      connection.on('gift', (data) => {
        if (data.giftType === 1 && !data.repeatEnd) {
          // Streak in progress, avoid spamming
          return;
        }

        const giftAction = mapGiftToAction(data.giftName);
        this.onEvent({
          type: 'gift',
          user: sanitizeUsername(data.uniqueId),
          nickname: data.nickname,
          gift: data.giftName,
          quantity: data.repeatCount || 1,
          value: (giftAction.value || 1) * (data.repeatCount || 1),
          action: giftAction.action,
          tier: giftAction.tier,
          description: giftAction.description,
          timestamp: Date.now()
        });
      });

      connection.on('like', (data) => {
        this.onEvent({
          type: 'like',
          user: sanitizeUsername(data.uniqueId),
          count: data.likeCount || 1,
          totalLikes: data.totalLikeCount,
          timestamp: Date.now()
        });
      });

      connection.on('follow', (data) => {
        this.onEvent({
          type: 'follow',
          user: sanitizeUsername(data.uniqueId),
          nickname: data.nickname,
          action: 'spawn_resident',
          timestamp: Date.now()
        });
      });

      connection.on('share', (data) => {
        this.onEvent({
          type: 'share',
          user: sanitizeUsername(data.uniqueId),
          action: 'city_bonus',
          timestamp: Date.now()
        });
      });

      connection.on('disconnected', () => {
        console.warn('[TikTokConnector] Desconectado da live.');
        this.connected = false;
      });

      return { success: true, mode: 'live', roomId: state.roomId };
    } catch (error) {
      console.error(`[TikTokConnector] Erro ao conectar na live @${cleanUser}:`, error.message);
      console.log('[TikTokConnector] Alternando automaticamente para Mock Feeder.');

      this.isMockMode = true;
      this.connected = true;
      this.mockFeeder = new MockFeeder({
        intervalMs: 4000,
        onEvent: (event) => this.onEvent(event)
      });
      this.mockFeeder.start();

      return { success: true, mode: 'mock_fallback', error: error.message };
    }
  }

  disconnect() {
    if (this.mockFeeder) {
      this.mockFeeder.stop();
      this.mockFeeder = null;
    }
    if (this.connection) {
      try {
        this.connection.disconnect();
      } catch (err) {}
      this.connection = null;
    }
    this.connected = false;
    this.isMockMode = false;
  }

  isConnected() {
    return this.connected;
  }

  getStatus() {
    return {
      connected: this.connected,
      username: this.username,
      mode: this.isMockMode ? 'mock' : 'live'
    };
  }
}
