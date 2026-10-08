import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import fs from 'node:fs';
import { startServer, stopServer } from '../server/index.js';

const TEST_PORT = 3031;
const TEST_DB = './test/test_ws_backend.sqlite';

test('Task 3: Backend Server and WebSocket Hub', async (t) => {
  if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
  }

  const { server, wsHub } = await startServer({
    port: TEST_PORT,
    dbPath: TEST_DB
  });

  await t.test('REST /api/health responds with status ok', async () => {
    const res = await fetch(`http://localhost:${TEST_PORT}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.ok(data.timestamp);
  });

  await t.test('REST /api/stats returns city stats and top viewers', async () => {
    const res = await fetch(`http://localhost:${TEST_PORT}/api/stats`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.economy);
    assert.ok(Array.isArray(data.topViewers));
  });

  await t.test('WebSocket client connects and receives broadcast events', async () => {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);

    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });

    const receivedMessages = [];
    ws.on('message', (msg) => {
      receivedMessages.push(JSON.parse(msg.toString()));
    });

    // Trigger an event via REST API
    const triggerRes = await fetch(`http://localhost:${TEST_PORT}/api/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'test_event',
        user: 'admin',
        payload: { message: 'Hello NPC World' }
      })
    });

    assert.equal(triggerRes.status, 200);

    // Wait briefly for WS broadcast
    await new Promise((resolve) => setTimeout(resolve, 200));

    assert.ok(receivedMessages.length >= 1);
    const testMsg = receivedMessages.find((m) => m.type === 'test_event');
    assert.ok(testMsg);
    assert.equal(testMsg.user, 'admin');
    assert.equal(testMsg.payload.message, 'Hello NPC World');

    ws.close();
  });

  // Teardown
  await stopServer();
  if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
  }
});
