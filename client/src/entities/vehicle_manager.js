import * as THREE from 'three';
import { Vehicle } from './vehicle.js';

const CIVIL_COLORS = [
  0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6,
  0x06b6d4, 0xec4899, 0xf8fafc, 0x334155, 0xd97706
];

export class VehicleManager {
  constructor(scene, pathGraph, maxVehicles = 16, soundEngine = null) {
    this.scene = scene;
    this.pathGraph = pathGraph;
    this.maxVehicles = maxVehicles;
    this.soundEngine = soundEngine;
    this.vehicles = [];

    this.initFleet();
  }

  initFleet() {
    const initialCount = Math.min(8, this.maxVehicles);
    const availableNodes = this.pathGraph.roadNodes.filter(n => !n.isIntersection);

    for (let i = 0; i < initialCount; i++) {
      const isSports = i === 1;
      const type = isSports ? 'sports' : 'civil';
      const color = CIVIL_COLORS[i % CIVIL_COLORS.length];
      const startNode = availableNodes[i % availableNodes.length];
      this.spawnVehicle(type, startNode, color);
    }
  }

  spawnVehicle(type = 'civil', startNode = null, color = null) {
    if (this.vehicles.length >= this.maxVehicles) {
      // Reuse oldest civil vehicle if full
      const oldestCivil = this.vehicles.find(v => v.type === 'civil' && !v.isCrashed);
      if (oldestCivil && type !== 'civil') {
        this.removeVehicle(oldestCivil);
      } else if (this.vehicles.length >= this.maxVehicles) {
        return null;
      }
    }

    const chosenColor = color || CIVIL_COLORS[Math.floor(Math.random() * CIVIL_COLORS.length)];
    const vehicle = new Vehicle(type, chosenColor);

    const node = startNode || this.pathGraph.getRandomRoadNode();
    if (node) {
      vehicle.currentNode = node;
      vehicle.group.position.set(node.x, 0, node.z);
      vehicle.targetNode = this.pathGraph.getNextRoadNode(node);
    }

    this.scene.add(vehicle.group);
    this.vehicles.push(vehicle);
    return vehicle;
  }

  spawnPoliceCruiser() {
    // Spawns near police station road
    const policeNode = this.pathGraph.roadNodes.find(n => n.id === 'r_west_1') || this.pathGraph.getRandomRoadNode();
    const policeCar = this.spawnVehicle('police', policeNode, 0x0f172a);
    if (policeCar) {
      policeCar.currentSpeed = 16;
      policeCar.emergencyMode = true;
    }
    return policeCar;
  }

  spawnAmbulance() {
    // Spawns near hospital road
    const hospitalNode = this.pathGraph.roadNodes.find(n => n.id === 'r_south_1') || this.pathGraph.getRandomRoadNode();
    const ambulance = this.spawnVehicle('ambulance', hospitalNode, 0xf8fafc);
    if (ambulance) {
      ambulance.currentSpeed = 15;
      ambulance.emergencyMode = true;
    }
    return ambulance;
  }

  startPursuit() {
    // Pick a fast suspect car or spawn one
    let suspect = this.vehicles.find(v => v.type === 'sports' || v.type === 'civil');
    if (!suspect) {
      suspect = this.spawnVehicle('sports', null, 0xdc2626);
    }
    if (suspect) {
      suspect.currentSpeed = 18; // runaway speed
    }

    // Dispatch police cruiser
    const police = this.spawnPoliceCruiser();
    return { suspect, police };
  }

  removeVehicle(vehicle) {
    const idx = this.vehicles.indexOf(vehicle);
    if (idx !== -1) {
      this.vehicles.splice(idx, 1);
      this.scene.remove(vehicle.group);
    }
  }

  update(deltaTime, trafficLights = [], npcManager = null) {
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      v.update(deltaTime, this.pathGraph, trafficLights, this.vehicles);

      // Hit and knockdown pedestrian collisions
      if (npcManager && npcManager.npcs && v.currentSpeed > 5.0 && !v.isCrashed) {
        const vPos = v.group.position;
        for (let j = 0; j < npcManager.npcs.length; j++) {
          const npc = npcManager.npcs[j];
          if (npc.isKnockedDown) continue;
          const nPos = npc.group.position;
          const dx = nPos.x - vPos.x;
          const dz = nPos.z - vPos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < 2.5) {
            npc.triggerKnockdown(v);
            if (this.soundEngine) {
              this.soundEngine.playTireScreech();
              this.soundEngine.playCarHorn();
            }
            break;
          }
        }
      }
    }
  }

  getCount() {
    return this.vehicles.length;
  }
}
