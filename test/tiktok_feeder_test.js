import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeUsername, sanitizeComment, mapGiftToAction, mapCommentToCommand } from '../server/tiktok/sanitizer.js';
import { MockFeeder } from '../server/tiktok/mock_feeder.js';
import { TikTokConnector } from '../server/tiktok/connector.js';

test('Task 4: TikTok Live Ingestor & Mock Feeder', async (t) => {
  await t.test('sanitizeUsername cleans dangerous and oversized inputs', () => {
    assert.equal(sanitizeUsername('@Maria_123'), 'maria_123');
    assert.equal(sanitizeUsername('   @Joao<script>alert(1)</script>   '), 'joaoalert1');
    const oversized = 'a'.repeat(60);
    assert.equal(sanitizeUsername(oversized).length, 32);
    assert.equal(sanitizeUsername(''), 'anonimo');
  });

  await t.test('sanitizeComment trims and removes HTML tags', () => {
    assert.equal(sanitizeComment('  <b>chuva</b>  '), 'chuva');
    const longComment = 'x'.repeat(200);
    assert.equal(sanitizeComment(longComment).length, 120);
  });

  await t.test('mapGiftToAction matches configured gifts properly', () => {
    const roseAction = mapGiftToAction('Rose');
    assert.equal(roseAction.action, 'spawn_resident');
    assert.equal(roseAction.tier, 'common');

    const galaxyAction = mapGiftToAction('Galaxy');
    assert.equal(galaxyAction.action, 'galaxy_cosmic');
    assert.equal(galaxyAction.tier, 'legendary');

    const unknownAction = mapGiftToAction('UnknownGift123');
    assert.equal(unknownAction.action, 'city_bonus');
  });

  await t.test('mapCommentToCommand identifies valid trigger commands', () => {
    assert.equal(mapCommentToCommand('manda policia ai'), 'spawn_police');
    assert.equal(mapCommentToCommand('quero chuva agora'), 'weather_rain');
    assert.equal(mapCommentToCommand('vai ter meteoro?'), 'meteor_strike');
    assert.equal(mapCommentToCommand('ola boa tarde live top'), null);
  });

  await t.test('MockFeeder emits generated events to listeners', async () => {
    const events = [];
    const feeder = new MockFeeder({
      intervalMs: 50,
      onEvent: (event) => events.push(event)
    });

    feeder.triggerManual({
      type: 'gift',
      user: 'lucas_stream',
      gift: 'Rose',
      quantity: 1
    });

    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'gift');
    assert.equal(events[0].user, 'lucas_stream');
    assert.equal(events[0].action, 'spawn_resident');

    feeder.start();
    await new Promise((resolve) => setTimeout(resolve, 150));
    feeder.stop();

    assert.ok(events.length >= 2, 'Mock feeder should have generated periodic events');
  });

  await t.test('TikTokConnector handles connect, disconnect, and status', async () => {
    let lastEvent = null;
    const connector = new TikTokConnector({
      onEvent: (evt) => { lastEvent = evt; }
    });

    assert.equal(connector.isConnected(), false);
    await connector.connect('@mock_channel');
    assert.ok(connector.getStatus());
    connector.disconnect();
    assert.equal(connector.isConnected(), false);
  });
});
