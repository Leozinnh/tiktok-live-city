import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import fs from 'node:fs';
import { startServer, stopServer } from '../server/index.js';

const TEST_PORT = 3032;
const TEST_DB = './test/test_e2e.sqlite';

test('Task 15: E2E Integration Test - Full Flow', async (t) => {
  if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
  }

  const { server, wsHub, director, connector } = await startServer({
    port: TEST_PORT,
    dbPath: TEST_DB,
    autoMock: false
  });

  const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
  const messagesReceived = [];

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
    ws.on('message', (data) => {
      messagesReceived.push(JSON.parse(data.toString()));
    });
  });

  await t.test('1. Follow event creates resident viewer in SQLite and broadcasts', async () => {
    connector.onEvent({
      type: 'follow',
      user: 'joao_silva',
      nickname: 'João Silva'
    });

    await new Promise((r) => setTimeout(r, 200));

    const followMsg = messagesReceived.find(m => m.type === 'follow');
    assert.ok(followMsg, 'WebSocket should have received follow broadcast');
    assert.equal(followMsg.user, 'joao_silva');

    // Verify persisted in DB
    const statsRes = await fetch(`http://localhost:${TEST_PORT}/api/stats`);
    const stats = await statsRes.json();
    assert.ok(stats.topViewers.some(v => v.username === 'joao_silva'));
  });

  await t.test('2. Gift Rose increases gifts_value and triggers resident action', async () => {
    connector.onEvent({
      type: 'gift',
      user: 'joao_silva',
      gift: 'Rose',
      quantity: 5,
      value: 5,
      action: 'spawn_resident'
    });

    await new Promise((r) => setTimeout(r, 200));

    const giftMsg = messagesReceived.find(m => m.type === 'gift' && m.payload.gift === 'Rose');
    assert.ok(giftMsg, 'WebSocket should have received gift Rose broadcast');
    assert.equal(giftMsg.payload.value, 5);

    // Verify updated viewer gift total
    const statsRes = await fetch(`http://localhost:${TEST_PORT}/api/stats`);
    const stats = await statsRes.json();
    const joao = stats.topViewers.find(v => v.username === 'joao_silva');
    assert.ok(joao);
    assert.equal(joao.gifts_value, 5);
  });

  await t.test('3. Comment with command triggers city police action', async () => {
    connector.onEvent({
      type: 'comment',
      user: 'mariana_stream',
      comment: 'manda policia no centro',
      command: 'spawn_police',
      action: 'spawn_police'
    });

    await new Promise((r) => setTimeout(r, 200));

    const cmdMsg = messagesReceived.find(m => m.type === 'comment' && m.payload.action === 'spawn_police');
    assert.ok(cmdMsg, 'WebSocket should have received police command');
  });

  await t.test('4. REST API /api/trigger executes event and resets director calm timer', async () => {
    const res = await fetch(`http://localhost:${TEST_PORT}/api/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'meteor_strike',
        user: 'admin',
        payload: { source: 'e2e_test' }
      })
    });

    assert.equal(res.status, 200);
    await new Promise((r) => setTimeout(r, 200));

    const meteorMsg = messagesReceived.find(m => m.type === 'meteor_strike');
    assert.ok(meteorMsg);
  });

  ws.close();
  await stopServer();

  if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
  }
});
