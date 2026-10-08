import * as THREE from 'three';
import { GameEngine } from './core/engine.js';
import { PostProcessingComposer } from './core/composer.js';
import { Time } from './core/time.js';
import { CityBuilder } from './world/city_builder.js';
import { Environment } from './world/environment.js';
import { Weather } from './world/weather.js';
import { VehicleManager } from './entities/vehicle_manager.js';
import { NPCManager } from './entities/npc_manager.js';
import { CameraDirector } from './camera/camera_director.js';
import { SoundEngine } from './audio/sound_engine.js';
import { EpicEventManager } from './world/epic_events.js';
import { HUD } from './ui/hud.js';
import { DevPanel } from './ui/dev_panel.js';
import { WsClient } from './network/ws_client.js';

const container = document.getElementById('canvas-container');
const engine = new GameEngine(container);
const composer = new PostProcessingComposer(engine.renderer, engine.scene, engine.camera);
const time = new Time();

// Sound Engine
const soundEngine = new SoundEngine();

// Forward resize to composer
engine.onResizeCallback = (width, height) => {
  composer.setSize(width, height);
};

// Ambient & Directional Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
engine.scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff3d6, 1.4);
dirLight.position.set(70, 95, 70);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 320;
dirLight.shadow.camera.left = -110;
dirLight.shadow.camera.right = 110;
dirLight.shadow.camera.top = 110;
dirLight.shadow.camera.bottom = -110;
dirLight.shadow.bias = -0.0005;
engine.scene.add(dirLight);

// Build Complete 3D City
const cityBuilder = new CityBuilder(engine.scene);
const city = cityBuilder.generate();

// Environment & Weather
const environment = new Environment(engine.scene, dirLight, ambientLight, cityBuilder, 12);
const weather = new Weather(engine.scene, dirLight, ambientLight);

// Audio reactive weather
weather.onLightningCallback = () => {
  soundEngine.playThunder();
};

// Entities: Vehicles & NPCs
const vehicleManager = new VehicleManager(engine.scene, city.pathGraph, 16, soundEngine);
const npcManager = new NPCManager(engine.scene, city.pathGraph, city.buildings, 50);

// Camera Director
const cameraDirector = new CameraDirector(engine.camera);

// Epic Events Manager
const epicEvents = new EpicEventManager({
  scene: engine.scene,
  cameraDirector,
  npcManager,
  vehicleManager,
  cityBuilder,
  soundEngine,
  environment
});

// UI: HUD & Dev Panel
const hud = new HUD();

// Network: WebSocket Client
const wsClient = new WsClient();

const devPanel = new DevPanel({
  epicEvents,
  weather,
  vehicleManager,
  npcManager,
  wsClient,
  soundEngine,
  hud,
  cameraDirector,
  environment
});

// HUD Metric Elements
const metricClock = document.getElementById('metric-clock');
const metricWeather = document.getElementById('metric-weather');
const metricPopulation = document.getElementById('metric-population');

// Handle incoming live stream events
wsClient.on('message', (msg) => {
  if (!msg) return;

  const eventType = msg.type;
  const payload = msg.payload || {};
  const user = msg.user || 'tiktok';

  // Add event notification card to HUD
  hud.addNotification({
    type: eventType,
    user: user,
    gift: payload.gift || msg.gift,
    tier: payload.tier || msg.tier,
    comment: payload.comment || msg.comment,
    count: payload.count || msg.count,
    description: payload.description || msg.description
  });

  // Handle Gameplay Actions
  const action = payload.action || msg.action || eventType;

  if (action === 'spawn_resident' || eventType === 'follow') {
    const resident = npcManager.createResident({
      user: user,
      nickname: payload.nickname || msg.nickname,
      money: payload.value || 300
    });
    if (resident) {
      cameraDirector.focusOnResident(resident, 8);
    }
    soundEngine.playNotification();
  } else if (action === 'galaxy_cosmic') {
    epicEvents.triggerGalaxyEvent();
  } else if (action === 'meteor_strike') {
    epicEvents.triggerMeteorStrike();
  } else if (action === 'spawn_police') {
    const police = vehicleManager.spawnPoliceCruiser();
    if (police) {
      cameraDirector.focusOnVehicle(police, 8);
    }
    soundEngine.playSiren(true);
    setTimeout(() => soundEngine.playSiren(false), 5000);
  } else if (action === 'spawn_ambulance') {
    vehicleManager.spawnAmbulance();
    soundEngine.playSiren(true);
    setTimeout(() => soundEngine.playSiren(false), 5000);
  } else if (action === 'weather_rain') {
    weather.setWeather('RAIN');
    soundEngine.playRain(1.0);
  } else if (action === 'weather_storm') {
    weather.setWeather('STORM');
    soundEngine.playRain(1.5);
  } else if (action === 'weather_clear') {
    weather.setWeather('CLEAR');
    soundEngine.playRain(0);
  } else if (action === 'weather_fog') {
    weather.setWeather('FOG');
  } else if (action === 'illegal_race') {
    epicEvents.triggerStreetRace();
  } else if (action === 'city_festival') {
    epicEvents.triggerCityFestival();
  } else if (action === 'city_blackout') {
    epicEvents.triggerBlackout();
  } else if (action === 'bank_robbery') {
    epicEvents.triggerBankRobbery();
  } else if (eventType === 'gift') {
    soundEngine.playNotification();
  }
});

// Periodic Stats Sync with Backend
async function syncStats() {
  try {
    const res = await fetch('/api/stats');
    if (res.ok) {
      const data = await res.json();
      if (data.economy) {
        hud.updateEconomy(data.economy.total_money);
      }
      if (data.topViewers) {
        hud.updateLeaderboard(data.topViewers);
      }
    }
  } catch (err) {}
}
setInterval(syncStats, 10000);
syncStats();

// Initialize audio context on first click anywhere
window.addEventListener('click', () => {
  soundEngine.ensureContext();
}, { once: true });

// Main RAF Loop
function animate() {
  requestAnimationFrame(animate);

  const delta = time.update();
  const currentHour = environment.getTime();

  try {
    cityBuilder.update(delta);
    environment.update(delta);
    weather.update(delta);
    vehicleManager.update(delta, city.trafficLights, npcManager);
    npcManager.update(delta, currentHour);
    cameraDirector.update(delta);
    epicEvents.update(delta);
  } catch (err) {
    console.warn('[Animation Loop Non-Fatal Warning]:', err.message);
  }

  // Update HUD Top Bar
  if (metricClock) {
    metricClock.textContent = environment.getFormattedTime();
  }
  if (metricWeather) {
    metricWeather.textContent = weather.getWeatherLabel();
  }
  if (metricPopulation) {
    metricPopulation.textContent = `${npcManager.getCount()} moradores`;
  }

  // Update FPS and dev stats
  const devFps = document.getElementById('dev-fps');
  const devStats = document.getElementById('dev-stats');
  if (devFps && time.frameCount === 0) {
    devFps.textContent = `${time.fps} FPS`;
    if (devStats) {
      devStats.textContent = `NPCs: ${npcManager.getCount()} | Carros: ${vehicleManager.getCount()} | Câmera: ${cameraDirector.mode} | WS: ${wsClient.isConnected ? 'Online' : 'Conectando...'}`;
    }
  }

  composer.render();
}

animate();

export {
  engine,
  composer,
  time,
  cityBuilder,
  city,
  environment,
  weather,
  vehicleManager,
  npcManager,
  cameraDirector,
  soundEngine,
  epicEvents,
  hud,
  devPanel,
  wsClient
};
