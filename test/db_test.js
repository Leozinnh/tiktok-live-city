import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  initDatabase,
  getOrCreateViewer,
  recordInteraction,
  saveNPC,
  getAllNPCs,
  updateNPCStatus,
  logEvent,
  getTopViewers,
  getCityEconomy,
  updateCityEconomy,
  closeDatabase
} from '../server/db/database.js';

const TEST_DB_PATH = './test/test_npc_world.sqlite';

test('Task 2: SQLite Persistence Layer', async (t) => {
  // Clean up any test database before start
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  const db = initDatabase(TEST_DB_PATH);

  await t.test('initDatabase creates tables properly', () => {
    assert.ok(db);
    assert.ok(fs.existsSync(TEST_DB_PATH));
  });

  await t.test('getOrCreateViewer creates and retrieves viewer', () => {
    const viewer1 = getOrCreateViewer('joaosilva', 'João Silva');
    assert.equal(viewer1.username, 'joaosilva');
    assert.equal(viewer1.nickname, 'João Silva');
    assert.equal(viewer1.likes_count, 0);
    assert.equal(viewer1.gifts_value, 0);

    const viewer1Retrieved = getOrCreateViewer('joaosilva');
    assert.equal(viewer1Retrieved.username, 'joaosilva');
  });

  await t.test('recordInteraction updates likes and gifts', () => {
    recordInteraction('joaosilva', 'like', 5);
    recordInteraction('joaosilva', 'gift', 100);

    const updated = getOrCreateViewer('joaosilva');
    assert.equal(updated.likes_count, 5);
    assert.equal(updated.gifts_value, 100);
  });

  await t.test('saveNPC and getAllNPCs works properly', () => {
    saveNPC({
      id: 'npc-1',
      viewer_username: 'joaosilva',
      name: 'João Silva',
      personality: 'Worker',
      job: 'Entregador',
      money: 350,
      home_id: 'bldg-res-1',
      work_id: 'bldg-comm-1'
    });

    const npcs = getAllNPCs();
    assert.equal(npcs.length, 1);
    assert.equal(npcs[0].id, 'npc-1');
    assert.equal(npcs[0].viewer_username, 'joaosilva');
    assert.equal(npcs[0].job, 'Entregador');
    assert.equal(npcs[0].money, 350);
  });

  await t.test('updateNPCStatus modifies attributes', () => {
    updateNPCStatus('npc-1', { money: 420, job: 'Gerente' });
    const npcs = getAllNPCs();
    assert.equal(npcs[0].money, 420);
    assert.equal(npcs[0].job, 'Gerente');
  });

  await t.test('logEvent and event history', () => {
    logEvent('gift_rose', 'joaosilva', { roseCount: 1 });
    logEvent('police_chase', 'system', { suspectId: 'npc-99' });

    const top = getTopViewers(5);
    assert.equal(top.length, 1);
    assert.equal(top[0].username, 'joaosilva');
  });

  await t.test('city economy statistics', () => {
    updateCityEconomy({ total_money: 150000, population: 35, active_jobs: 28 });
    const eco = getCityEconomy();
    assert.equal(eco.total_money, 150000);
    assert.equal(eco.population, 35);
    assert.equal(eco.active_jobs, 28);
  });

  // Teardown
  closeDatabase();
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});
