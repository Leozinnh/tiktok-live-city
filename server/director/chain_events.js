export const CHAIN_DEFINITIONS = {
  bank_robbery: [
    { event: 'bank_robbery', delay: 0 },
    { event: 'police_chase', delay: 3000 },
    { event: 'vehicle_crash', delay: 7000 },
    { event: 'ambulance_dispatch', delay: 10000 },
    { event: 'arrest_made', delay: 14000 }
  ],
  meteor_strike: [
    { event: 'siren_alert', delay: 0 },
    { event: 'sky_red', delay: 2000 },
    { event: 'meteor_impact', delay: 5000 },
    { event: 'panic_flee', delay: 6500 },
    { event: 'rescue_crew', delay: 11000 }
  ],
  illegal_race: [
    { event: 'race_countdown', delay: 0 },
    { event: 'race_start', delay: 2500 },
    { event: 'police_intercept', delay: 8000 }
  ],
  city_blackout: [
    { event: 'lights_off', delay: 0 },
    { event: 'siren_alert', delay: 1500 },
    { event: 'generator_restore', delay: 12000 }
  ]
};

export class ChainEventEngine {
  constructor(options = {}) {
    this.emit = options.emit || (() => {});
    this.timeScale = options.timeScale || 1;
    this.activeTimeouts = new Set();
  }

  startChain(chainName, initialData = {}) {
    const chainDef = CHAIN_DEFINITIONS[chainName];
    if (!chainDef) {
      console.warn(`[ChainEventEngine] Cadeia desconhecida: ${chainName}`);
      return null;
    }

    const chainId = `chain_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    chainDef.forEach((stepDef) => {
      const adjustedDelay = Math.max(0, stepDef.delay / this.timeScale);
      if (adjustedDelay === 0) {
        this.emit({
          chainId,
          chain: chainName,
          step: stepDef.event,
          data: initialData,
          timestamp: Date.now()
        });
      } else {
        const timeout = setTimeout(() => {
          this.activeTimeouts.delete(timeout);
          this.emit({
            chainId,
            chain: chainName,
            step: stepDef.event,
            data: initialData,
            timestamp: Date.now()
          });
        }, adjustedDelay);

        this.activeTimeouts.add(timeout);
      }
    });

    return {
      id: chainId,
      name: chainName,
      totalSteps: chainDef.length
    };
  }

  cancelAll() {
    for (const t of this.activeTimeouts) {
      clearTimeout(t);
    }
    this.activeTimeouts.clear();
  }
}
