import express from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WsHub } from './websocket/ws_hub.js';
import { EventDirector } from './director/event_director.js';
import { TikTokConnector } from './tiktok/connector.js';
import {
  initDatabase,
  closeDatabase,
  getCityEconomy,
  getTopViewers,
  getAllNPCs,
  saveNPC,
  logEvent,
  recordInteraction,
  getOrCreateViewer
} from './db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let currentServer = null;
let currentWsHub = null;
let currentDirector = null;
let currentConnector = null;
let directorInterval = null;

export async function startServer(options = {}) {
  const port = options.port || process.env.PORT || 3000;
  const dbPath = options.dbPath || './database/npc_world.sqlite';
  const autoMock = options.autoMock !== undefined ? options.autoMock : true;

  // Initialize DB
  initDatabase(dbPath);

  const app = express();
  app.use(express.json());

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  const server = http.createServer(app);
  const wsHub = new WsHub(server);

  // Initialize Event Director
  const director = new EventDirector({
    minCalmSeconds: options.minCalmSeconds || 120,
    onTrigger: (event) => {
      logEvent(event.type, event.user || 'EventDirector', event.payload || {});
      wsHub.broadcast(event.type, event.payload || {}, event.user || 'EventDirector');
    }
  });

  currentDirector = director;
  directorInterval = setInterval(() => {
    director.update(1);
  }, 1000);

  // Initialize TikTok Connector
  const connector = new TikTokConnector({
    onEvent: (event) => {
      director.notifyActivity();

      // Record in database
      if (event.user) {
        getOrCreateViewer(event.user, event.nickname);
        if (event.type === 'like') {
          recordInteraction(event.user, 'like', event.count || 1);
        } else if (event.type === 'gift') {
          recordInteraction(event.user, 'gift', event.value || 1);
        } else if (event.type === 'follow') {
          recordInteraction(event.user, 'follow', 1);
        }
      }

      logEvent(event.type, event.user || 'tiktok', event);
      wsHub.broadcast(event.type, event, event.user || 'tiktok');
    }
  });

  currentConnector = connector;

  if (autoMock && options.connectTikTok !== false) {
    connector.connect('@mock_cidade').catch((err) => {
      console.warn('[Server] Falha ao iniciar conector padrão:', err.message);
    });
  }

  // REST API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'NPC WORLD Server',
      directorState: director.getState(),
      timestamp: Date.now()
    });
  });

  app.get('/api/stats', (req, res) => {
    const economy = getCityEconomy();
    const topViewers = getTopViewers(10);
    const npcs = getAllNPCs();

    res.json({
      economy,
      topViewers,
      population: npcs.length,
      directorState: director.getState(),
      timestamp: Date.now()
    });
  });

  app.get('/api/npcs', (req, res) => {
    const npcs = getAllNPCs();
    res.json(npcs);
  });

  app.post('/api/npcs', (req, res) => {
    const npc = saveNPC(req.body);
    wsHub.broadcast('npc_created', npc, req.body.viewer_username || 'system');
    res.json(npc);
  });

  app.post('/api/trigger', (req, res) => {
    const { type, user, payload } = req.body;
    if (!type) {
      return res.status(400).json({ error: 'Event type is required' });
    }

    director.notifyActivity();
    logEvent(type, user || 'system', payload || {});
    wsHub.broadcast(type, payload || {}, user || 'system');

    res.json({ success: true, type, user: user || 'system' });
  });

  app.post('/api/tiktok/connect', async (req, res) => {
    const { username } = req.body;
    const result = await connector.connect(username || '@mock_cidade');
    res.json(result);
  });

  app.post('/api/tiktok/disconnect', (req, res) => {
    connector.disconnect();
    res.json({ success: true, status: connector.getStatus() });
  });

  currentServer = server;
  currentWsHub = wsHub;

  await new Promise((resolve) => {
    server.listen(port, '0.0.0.0', () => {
      console.log(`[NPC WORLD] Server running on http://127.0.0.1:${port}`);
      resolve();
    });
  });

  return { server, wsHub, app, director, connector };
}

export async function stopServer() {
  if (directorInterval) {
    clearInterval(directorInterval);
    directorInterval = null;
  }
  if (currentDirector) {
    currentDirector.stop();
    currentDirector = null;
  }
  if (currentConnector) {
    currentConnector.disconnect();
    currentConnector = null;
  }
  if (currentWsHub) {
    currentWsHub.close();
    currentWsHub = null;
  }
  if (currentServer) {
    await new Promise((resolve) => currentServer.close(resolve));
    currentServer = null;
  }
  closeDatabase();
}

// Auto start if executed directly
const isDirectRun = process.argv[1] && (
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
  process.argv[1].replace(/\\/g, '/').endsWith('server/index.js')
);

if (isDirectRun) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
