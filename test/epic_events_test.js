import test from 'node:test';
import assert from 'node:assert/strict';
import { EpicEventManager } from '../client/src/world/epic_events.js';

test('Task 12: Epic & Legendary Events Manager', async (t) => {
  await t.test('EpicEventManager defines all major event handlers', () => {
    const mockScene = { add: () => {}, remove: () => {} };
    const mockCameraDirector = { triggerCinematicShot: () => {}, focusOnVehicle: () => {} };
    const mockNpcManager = { triggerPanic: () => {} };
    const mockVehicleManager = { spawnVehicle: () => ({ group: { position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 } } }), spawnPoliceCruiser: () => {} };
    const mockCityBuilder = { setNightLights: () => {} };

    const epic = new EpicEventManager({
      scene: mockScene,
      cameraDirector: mockCameraDirector,
      npcManager: mockNpcManager,
      vehicleManager: mockVehicleManager,
      cityBuilder: mockCityBuilder
    });

    assert.ok(epic.triggerMeteorStrike);
    assert.ok(epic.triggerGalaxyEvent);
    assert.ok(epic.triggerStreetRace);
    assert.ok(epic.triggerCityFestival);
    assert.ok(epic.triggerBlackout);
    assert.ok(epic.triggerBankRobbery);
  });

  await t.test('Meteor strike sequence initiates state and calls panic', () => {
    let panicTriggered = false;
    let cinematicTriggered = false;

    const epic = new EpicEventManager({
      scene: { add: () => {}, remove: () => {} },
      cameraDirector: { triggerCinematicShot: () => { cinematicTriggered = true; } },
      npcManager: { triggerPanic: () => { panicTriggered = true; } },
      vehicleManager: { spawnVehicle: () => {}, spawnPoliceCruiser: () => {}, spawnAmbulance: () => {} },
      cityBuilder: { setNightLights: () => {} }
    });

    const eventData = epic.triggerMeteorStrike({ x: 0, z: 0 });
    assert.equal(eventData.name, 'meteor_strike');
    assert.equal(cinematicTriggered, true);

    // Fast-forward update loop
    epic.update(7.0);
    assert.equal(panicTriggered, true);
  });
});
