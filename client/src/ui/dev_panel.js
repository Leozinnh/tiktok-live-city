export class DevPanel {
  constructor(options = {}) {
    this.epicEvents = options.epicEvents;
    this.weather = options.weather;
    this.vehicleManager = options.vehicleManager;
    this.npcManager = options.npcManager;
    this.wsClient = options.wsClient;
    this.soundEngine = options.soundEngine;
    this.hud = options.hud;
    this.cameraDirector = options.cameraDirector;
    this.environment = options.environment;

    this.panel = document.getElementById('dev-panel');
    this.chatInput = document.getElementById('dev-chat-input');
    this.sendBtn = document.getElementById('btn-send-chat');

    this.bindEvents();
    this.bindKeyboardShortcut();
  }

  toggle() {
    if (!this.panel) return;
    const isVisible = this.panel.style.display === 'block';
    this.panel.style.display = isVisible ? 'none' : 'block';
  }

  bindKeyboardShortcut() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  dispatchToBackend(type, payload = {}, user = 'admin') {
    // 1. Try WebSocket
    if (this.wsClient) {
      this.wsClient.send(type, payload, user);
    }
    // 2. Also send REST trigger for persistence
    fetch('/api/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload, user })
    }).catch(() => {});
  }

  bindEvents() {
    const bindBtn = (id, callback) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', callback);
    };

    // 🌹 Rosa (Flor) - Gift
    bindBtn('btn-gift-rose', () => {
      const mockUsers = ['ana_silva', 'pedro_gamer', 'joao_live', 'maria_stream', 'carlos_sp'];
      const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];

      if (this.npcManager) {
        const resident = this.npcManager.createResident({ user, nickname: user, value: 50 });
        if (this.cameraDirector && resident) {
          this.cameraDirector.focusOnResident(resident, 8);
        }
      }
      if (this.hud) {
        this.hud.addNotification({
          type: 'gift',
          user,
          gift: 'Rose',
          description: 'Enviou uma Rosa! Morador recebeu bônus.'
        });
      }
      if (this.soundEngine) this.soundEngine.playNotification();

      this.dispatchToBackend('gift', { gift: 'Rose', quantity: 1, action: 'spawn_resident', value: 1, description: 'Enviou uma Rosa!' }, user);
    });

    // 🌌 Galáxia - Legendary Gift
    bindBtn('btn-gift-galaxy', () => {
      if (this.epicEvents) {
        this.epicEvents.triggerGalaxyEvent();
      }
      if (this.hud) {
        this.hud.addNotification({
          type: 'gift',
          user: 'doador_lendario',
          gift: 'Galaxy',
          tier: 'legendary',
          description: 'PRESENTE LENDÁRIO: Vórtice Galáctico e Gravidade Zero!'
        });
      }
      if (this.soundEngine) this.soundEngine.playCosmicWarp();

      this.dispatchToBackend('gift', { gift: 'Galaxy', quantity: 1, action: 'galaxy_cosmic', tier: 'legendary' }, 'doador_lendario');
    });

    // ❤️ +50 Likes
    bindBtn('btn-likes', () => {
      if (this.hud) {
        this.hud.addNotification({
          type: 'like',
          user: 'comunidade',
          count: 50
        });
      }
      if (this.soundEngine) this.soundEngine.playCarHorn();
      this.dispatchToBackend('like', { count: 50 }, 'comunidade');
    });

    // ☄️ Meteoro
    bindBtn('btn-meteor', () => {
      if (this.epicEvents) this.epicEvents.triggerMeteorStrike();
      if (this.hud) {
        this.hud.addNotification({ type: 'meteor_strike', user: 'admin', description: 'Meteoro ativado!' });
      }
      this.dispatchToBackend('meteor_strike', {}, 'admin');
    });

    // 🚨 Polícia
    bindBtn('btn-police', () => {
      if (this.vehicleManager) {
        const cop = this.vehicleManager.spawnPoliceCruiser();
        if (this.cameraDirector && cop) {
          this.cameraDirector.focusOnVehicle(cop, 8);
        }
      }
      if (this.soundEngine) {
        this.soundEngine.playSiren(true);
        setTimeout(() => this.soundEngine.playSiren(false), 5000);
      }
      if (this.hud) {
        this.hud.addNotification({ type: 'spawn_police', user: 'admin', description: 'Viatura policial despachada!' });
      }
      this.dispatchToBackend('spawn_police', {}, 'admin');
    });

    // 🌧️ Chuva
    bindBtn('btn-rain', () => {
      if (this.weather) this.weather.setWeather('RAIN');
      if (this.soundEngine) this.soundEngine.playRain(1.0);
      if (this.hud) {
        this.hud.addNotification({ type: 'weather_rain', user: 'admin', description: 'Chuva iniciada!' });
      }
      this.dispatchToBackend('weather_rain', {}, 'admin');
    });

    // ⛈️ Tempestade
    bindBtn('btn-storm', () => {
      if (this.weather) this.weather.setWeather('STORM');
      if (this.soundEngine) this.soundEngine.playRain(1.5);
      if (this.hud) {
        this.hud.addNotification({ type: 'weather_storm', user: 'admin', description: 'Tempestade com raios!' });
      }
      this.dispatchToBackend('weather_storm', {}, 'admin');
    });

    // 🏎️ Corrida
    bindBtn('btn-race', () => {
      if (this.epicEvents) this.epicEvents.triggerStreetRace();
      if (this.hud) {
        this.hud.addNotification({ type: 'illegal_race', user: 'admin', description: 'Corrida clandestina iniciada!' });
      }
      this.dispatchToBackend('illegal_race', {}, 'admin');
    });

    // 🎆 Festival
    bindBtn('btn-festival', () => {
      if (this.epicEvents) this.epicEvents.triggerCityFestival();
      if (this.hud) {
        this.hud.addNotification({ type: 'city_festival', user: 'admin', description: 'Festival urbano na praça!' });
      }
      this.dispatchToBackend('city_festival', {}, 'admin');
    });

    // 💡 Apagão
    bindBtn('btn-blackout', () => {
      if (this.epicEvents) this.epicEvents.triggerBlackout();
      if (this.hud) {
        this.hud.addNotification({ type: 'city_blackout', user: 'admin', description: 'Apagão elétrico geral!' });
      }
      this.dispatchToBackend('city_blackout', {}, 'admin');
    });

    // 👤 Morador
    bindBtn('btn-resident', () => {
      const mockNames = ['lucas_stream', 'carol_gamer', 'andre_sp', 'gabriela_live'];
      const user = mockNames[Math.floor(Math.random() * mockNames.length)];
      if (this.npcManager) {
        const resident = this.npcManager.createResident({ user, nickname: user, value: 100 });
        if (this.cameraDirector && resident) {
          this.cameraDirector.focusOnResident(resident, 8);
        }
      }
      if (this.hud) {
        this.hud.addNotification({ type: 'follow', user, description: 'Novo morador registrado!' });
      }
      if (this.soundEngine) this.soundEngine.playNotification();
      this.dispatchToBackend('follow', {}, user);
    });

    // ☀️/🌙 Dia / Noite
    bindBtn('btn-toggle-time', () => {
      if (this.environment) {
        const isNight = this.environment.currentHour >= 18.5 || this.environment.currentHour < 5.5;
        this.environment.setTime(isNight ? 12.0 : 21.0);
        if (this.hud) {
          this.hud.addNotification({
            type: 'time_toggle',
            user: 'admin',
            description: isNight ? '☀️ Mudado para Dia ensolarado (12:00)!' : '🌙 Mudado para Noite iluminada (21:00)!'
          });
        }
      }
    });

    // Chat Command Handler
    const handleChat = () => {
      if (!this.chatInput) return;
      const cmd = this.chatInput.value.trim().toLowerCase();
      if (!cmd) return;
      this.chatInput.value = '';

      if (this.hud) {
        this.hud.addNotification({ type: 'comment', user: 'admin', comment: cmd });
      }

      if (cmd.includes('rosa') || cmd.includes('flor')) {
        const resident = this.npcManager?.createResident({ user: 'espectador_rosa', nickname: 'Doador Rosa', value: 50 });
        if (resident && this.cameraDirector) this.cameraDirector.focusOnResident(resident, 8);
        this.soundEngine?.playNotification();
      } else if (cmd.includes('meteor') || cmd.includes('galax')) {
        this.epicEvents?.triggerMeteorStrike();
      } else if (cmd.includes('policia') || cmd.includes('viatura')) {
        const cop = this.vehicleManager?.spawnPoliceCruiser();
        if (cop && this.cameraDirector) this.cameraDirector.focusOnVehicle(cop, 8);
        this.soundEngine?.playSiren(true);
        setTimeout(() => this.soundEngine?.playSiren(false), 5000);
      } else if (cmd.includes('ambulancia')) {
        this.vehicleManager?.spawnAmbulance();
        this.soundEngine?.playSiren(true);
        setTimeout(() => this.soundEngine?.playSiren(false), 5000);
      } else if (cmd.includes('chuva')) {
        this.weather?.setWeather('RAIN');
        this.soundEngine?.playRain(1.0);
      } else if (cmd.includes('tempestade')) {
        this.weather?.setWeather('STORM');
        this.soundEngine?.playRain(1.5);
      } else if (cmd.includes('sol') || cmd.includes('limpo')) {
        this.weather?.setWeather('CLEAR');
        this.soundEngine?.playRain(0);
      } else if (cmd.includes('neblina')) {
        this.weather?.setWeather('FOG');
      } else if (cmd.includes('corrida')) {
        this.epicEvents?.triggerStreetRace();
      } else if (cmd.includes('festa') || cmd.includes('festival')) {
        this.epicEvents?.triggerCityFestival();
      } else if (cmd.includes('apagao')) {
        this.epicEvents?.triggerBlackout();
      } else if (cmd.includes('roubo') || cmd.includes('banco')) {
        this.epicEvents?.triggerBankRobbery();
      }

      this.dispatchToBackend('comment', { comment: cmd }, 'admin');
    };

    if (this.sendBtn) this.sendBtn.addEventListener('click', handleChat);
    if (this.chatInput) {
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleChat();
      });
    }
  }
}
