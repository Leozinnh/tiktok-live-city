import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

export function initDatabase(dbPath = './database/npc_world.sqlite') {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  dbInstance = new DatabaseSync(dbPath);

  // Enable WAL mode for high concurrency
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  dbInstance.exec('PRAGMA synchronous = NORMAL;');

  // Load and execute schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  dbInstance.exec(schema);

  // Initialize city economy row if not exists
  const existingEconomy = dbInstance.prepare('SELECT id FROM city_economy WHERE id = 1').get();
  if (!existingEconomy) {
    dbInstance.prepare(`
      INSERT INTO city_economy (id, total_money, population, active_jobs, updated_at)
      VALUES (1, 100000, 0, 0, ?)
    `).run(Date.now());
  }

  return dbInstance;
}

export function getDatabase() {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function getOrCreateViewer(username, nickname = null) {
  const db = getDatabase();
  const cleanUsername = String(username || '').toLowerCase().trim().replace(/^@/, '');
  const now = Date.now();

  let viewer = db.prepare('SELECT * FROM viewers WHERE username = ?').get(cleanUsername);
  if (!viewer) {
    db.prepare(`
      INSERT INTO viewers (username, nickname, likes_count, gifts_value, is_follower, created_at, updated_at)
      VALUES (?, ?, 0, 0, 0, ?, ?)
    `).run(cleanUsername, nickname || cleanUsername, now, now);

    viewer = db.prepare('SELECT * FROM viewers WHERE username = ?').get(cleanUsername);
  } else if (nickname && nickname !== viewer.nickname) {
    db.prepare('UPDATE viewers SET nickname = ?, updated_at = ? WHERE username = ?')
      .run(nickname, now, cleanUsername);
    viewer.nickname = nickname;
  }

  return viewer;
}

export function recordInteraction(username, type, value = 1) {
  const db = getDatabase();
  const viewer = getOrCreateViewer(username);
  const now = Date.now();

  if (type === 'like') {
    db.prepare('UPDATE viewers SET likes_count = likes_count + ?, updated_at = ? WHERE username = ?')
      .run(Number(value) || 1, now, viewer.username);
  } else if (type === 'gift') {
    db.prepare('UPDATE viewers SET gifts_value = gifts_value + ?, updated_at = ? WHERE username = ?')
      .run(Number(value) || 1, now, viewer.username);
  } else if (type === 'follow') {
    db.prepare('UPDATE viewers SET is_follower = 1, updated_at = ? WHERE username = ?')
      .run(now, viewer.username);
  }

  return getOrCreateViewer(viewer.username);
}

export function saveNPC(npcData) {
  const db = getDatabase();
  const now = Date.now();

  const existing = db.prepare('SELECT id FROM npcs WHERE id = ?').get(npcData.id);
  if (existing) {
    db.prepare(`
      UPDATE npcs SET
        name = ?,
        personality = ?,
        job = ?,
        money = ?,
        energy = ?,
        hunger = ?,
        mood = ?,
        home_id = ?,
        work_id = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      npcData.name,
      npcData.personality || 'Worker',
      npcData.job || 'Civil',
      npcData.money ?? 100,
      npcData.energy ?? 100,
      npcData.hunger ?? 0,
      npcData.mood ?? 100,
      npcData.home_id || null,
      npcData.work_id || null,
      now,
      npcData.id
    );
  } else {
    db.prepare(`
      INSERT INTO npcs (
        id, viewer_username, name, personality, job, money, energy, hunger, mood, home_id, work_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      npcData.id,
      npcData.viewer_username || null,
      npcData.name,
      npcData.personality || 'Worker',
      npcData.job || 'Civil',
      npcData.money ?? 100,
      npcData.energy ?? 100,
      npcData.hunger ?? 0,
      npcData.mood ?? 100,
      npcData.home_id || null,
      npcData.work_id || null,
      now,
      now
    );
  }

  return db.prepare('SELECT * FROM npcs WHERE id = ?').get(npcData.id);
}

export function getAllNPCs() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM npcs ORDER BY created_at ASC').all();
}

export function updateNPCStatus(id, updates) {
  const db = getDatabase();
  const fields = [];
  const values = [];

  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(val);
  }
  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  db.prepare(`UPDATE npcs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM npcs WHERE id = ?').get(id);
}

export function logEvent(type, triggerUser = 'system', payload = {}) {
  const db = getDatabase();
  const now = Date.now();
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

  db.prepare(`
    INSERT INTO events_history (event_type, trigger_user, payload_json, created_at)
    VALUES (?, ?, ?, ?)
  `).run(type, triggerUser, payloadStr, now);
}

export function getTopViewers(limit = 10) {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM viewers
    ORDER BY gifts_value DESC, likes_count DESC
    LIMIT ?
  `).all(limit);
}

export function getCityEconomy() {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM city_economy WHERE id = 1').get();
  return row || { total_money: 100000, population: 0, active_jobs: 0 };
}

export function updateCityEconomy(economyData) {
  const db = getDatabase();
  const now = Date.now();
  db.prepare(`
    UPDATE city_economy SET
      total_money = COALESCE(?, total_money),
      population = COALESCE(?, population),
      active_jobs = COALESCE(?, active_jobs),
      updated_at = ?
    WHERE id = 1
  `).run(
    economyData.total_money ?? null,
    economyData.population ?? null,
    economyData.active_jobs ?? null,
    now
  );
  return getCityEconomy();
}
