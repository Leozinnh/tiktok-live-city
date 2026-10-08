import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Task 1: Configurations and Project Structure', async (t) => {
  await t.test('package.json exists and has valid configuration', async () => {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    assert.equal(pkg.name, 'npc-world-tiktok-live');
    assert.equal(pkg.type, 'module');
    assert.ok(pkg.scripts.start);
    assert.ok(pkg.scripts.build);
    assert.ok(pkg.dependencies.three);
    assert.ok(pkg.dependencies.express);
    assert.ok(pkg.dependencies.ws);
    // SQLite nativo integrado no Node 24
    const { DatabaseSync } = await import('node:sqlite');
    assert.ok(DatabaseSync);
  });

  await t.test('config/events.json has valid gift and command mappings', () => {
    const events = JSON.parse(fs.readFileSync('./config/events.json', 'utf8'));
    assert.ok(events.gifts);
    assert.ok(events.gifts.Rose);
    assert.equal(events.gifts.Rose.action, 'spawn_resident');
    assert.ok(events.gifts.Galaxy);
    assert.equal(events.gifts.Galaxy.action, 'galaxy_cosmic');
    assert.ok(events.commands);
    assert.equal(events.commands.policia, 'spawn_police');
    assert.equal(events.commands.chuva, 'weather_rain');
    assert.ok(events.likeMilestones);
  });

  await t.test('config/game_config.json has valid engine and simulation presets', () => {
    const gameConfig = JSON.parse(fs.readFileSync('./config/game_config.json', 'utf8'));
    assert.equal(gameConfig.server.port, 3000);
    assert.ok(gameConfig.simulation.dayNightCycleMinutes > 0);
    assert.ok(gameConfig.graphics.presets.HIGH);
    assert.ok(gameConfig.graphics.presets.HIGH.maxNPCs >= 30);
    assert.ok(gameConfig.audio.masterVolume > 0);
  });
});
