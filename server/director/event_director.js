import { ChainEventEngine } from './chain_events.js';

export class EventDirector {
  constructor(options = {}) {
    this.minCalmSeconds = options.minCalmSeconds || 120; // 2 minutes calm default
    this.onTrigger = options.onTrigger || (() => {});
    this.state = 'CALM'; // CALM -> TENSION -> ACTION -> COOLDOWN -> CALM
    this.idleSeconds = 0;
    this.stateTimer = 0;

    this.chainEngine = new ChainEventEngine({
      emit: (step) => {
        this.onTrigger({
          type: step.step,
          chain: step.chain,
          user: 'EventDirector',
          payload: step.data,
          timestamp: step.timestamp
        });
      },
      timeScale: options.timeScale || 1
    });
  }

  notifyActivity() {
    // Reset calm counter on live interaction
    this.idleSeconds = 0;
  }

  getState() {
    return this.state;
  }

  triggerChain(chainName, initialData = {}) {
    this.state = 'ACTION';
    this.stateTimer = 0;
    return this.chainEngine.startChain(chainName, initialData);
  }

  update(deltaSeconds) {
    if (this.state === 'CALM') {
      this.idleSeconds += deltaSeconds;

      if (this.idleSeconds >= this.minCalmSeconds) {
        this.idleSeconds = 0;
        this.triggerAutonomousEvent();
      }
    } else if (this.state === 'TENSION') {
      this.stateTimer += deltaSeconds;
      if (this.stateTimer >= 5) {
        this.state = 'ACTION';
        this.stateTimer = 0;
      }
    } else if (this.state === 'ACTION') {
      this.stateTimer += deltaSeconds;
      if (this.stateTimer >= 15) {
        this.state = 'COOLDOWN';
        this.stateTimer = 0;
      }
    } else if (this.state === 'COOLDOWN') {
      this.stateTimer += deltaSeconds;
      if (this.stateTimer >= 10) {
        this.state = 'CALM';
        this.stateTimer = 0;
        this.idleSeconds = 0;
      }
    }
  }

  triggerAutonomousEvent() {
    const roll = Math.random();

    if (roll < 0.35) {
      // Robbery and pursuit
      this.state = 'ACTION';
      this.chainEngine.startChain('bank_robbery', { reason: 'autonomous_event' });
    } else if (roll < 0.65) {
      // Illegal street race
      this.state = 'ACTION';
      this.chainEngine.startChain('illegal_race', { reason: 'autonomous_event' });
    } else if (roll < 0.85) {
      // Weather change
      this.state = 'COOLDOWN';
      const weathers = ['weather_rain', 'weather_storm', 'weather_fog', 'weather_clear'];
      const chosenWeather = weathers[Math.floor(Math.random() * weathers.length)];
      this.onTrigger({
        type: chosenWeather,
        user: 'EventDirector',
        payload: { autonomous: true }
      });
    } else {
      // City festival
      this.state = 'ACTION';
      this.onTrigger({
        type: 'city_festival',
        user: 'EventDirector',
        payload: { autonomous: true }
      });
    }
  }

  stop() {
    this.chainEngine.cancelAll();
  }
}
