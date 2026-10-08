import test from 'node:test';
import assert from 'node:assert/strict';
import { ChainEventEngine } from '../server/director/chain_events.js';
import { EventDirector } from '../server/director/event_director.js';

test('Task 5: Event Director & Chain Reaction Engine', async (t) => {
  await t.test('ChainEventEngine executes multi-step chained reactions', async () => {
    const executedSteps = [];
    const engine = new ChainEventEngine({
      emit: (step) => executedSteps.push(step),
      timeScale: 100 // 100x fast-forward for testing
    });

    const chain = engine.startChain('bank_robbery', { suspect: 'npc-criminal-1' });
    assert.ok(chain);
    assert.equal(chain.name, 'bank_robbery');

    // Wait for the chain to progress
    await new Promise((resolve) => setTimeout(resolve, 250));

    assert.ok(executedSteps.length >= 3, 'Should have progressed through multiple chain steps');
    const stepNames = executedSteps.map((s) => s.step);
    assert.ok(stepNames.includes('bank_robbery'));
    assert.ok(stepNames.includes('police_chase'));
  });

  await t.test('EventDirector transitions states and triggers autonomous events when calm', () => {
    const triggeredEvents = [];
    const director = new EventDirector({
      minCalmSeconds: 1, // fast test interval
      onTrigger: (event) => triggeredEvents.push(event)
    });

    assert.equal(director.getState(), 'CALM');

    // Simulate 2 seconds of calmness passing
    director.update(1.5);
    assert.ok(triggeredEvents.length >= 1, 'Should trigger an autonomous event when calm threshold exceeded');
    assert.notEqual(director.getState(), 'CALM');
  });

  await t.test('EventDirector resets calm timer on user activity', () => {
    const triggeredEvents = [];
    const director = new EventDirector({
      minCalmSeconds: 5,
      onTrigger: (event) => triggeredEvents.push(event)
    });

    director.update(4.0);
    assert.equal(triggeredEvents.length, 0);

    director.notifyActivity(); // Viewer sent a gift or comment
    director.update(2.0); // Now 2s elapsed since activity, not 6s
    assert.equal(triggeredEvents.length, 0, 'Activity should reset the idle timer');
  });
});
