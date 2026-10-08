import * as THREE from 'three';
import { NPC } from './npc.js';
import { NPCAI } from '../simulation/npc_ai.js';

const JOBS = [
  'Comerciante', 'Engenheiro', 'Entregador', 'Policial',
  'Médico', 'Empresário', 'Turista', 'Estudante', 'Artista'
];

export class NPCManager {
  constructor(scene, pathGraph, buildings, maxNPCs = 50) {
    this.scene = scene;
    this.pathGraph = pathGraph;
    this.buildings = buildings || [];
    this.maxNPCs = maxNPCs;

    this.npcs = [];
    this.aiMap = new Map();

    this.initPopulation();
  }

  initPopulation() {
    const initialCount = Math.min(18, this.maxNPCs);
    for (let i = 0; i < initialCount; i++) {
      const job = JOBS[i % JOBS.length];
      this.spawnNPC({
        name: `Cidadão ${i + 1}`,
        job: job
      });
    }
  }

  spawnNPC(options = {}) {
    if (this.npcs.length >= this.maxNPCs) {
      // Remove oldest non-resident NPC if at capacity
      const oldestCivil = this.npcs.find(n => !n.isResident);
      if (oldestCivil) {
        this.removeNPC(oldestCivil);
      } else {
        return null;
      }
    }

    const npc = new NPC(options);

    const startNode = options.startNode || this.pathGraph.getRandomSidewalkNode();
    if (startNode) {
      npc.currentNode = startNode;
      npc.group.position.set(startNode.x, 0, startNode.z);
      npc.targetNode = this.pathGraph.getNextSidewalkNode(startNode);
    }

    const ai = new NPCAI(npc, this.buildings);

    this.scene.add(npc.group);
    this.npcs.push(npc);
    this.aiMap.set(npc, ai);

    return npc;
  }

  createResident(viewerData) {
    const cleanUser = String(viewerData.user || viewerData.username || 'espectador').toLowerCase().replace(/^@/, '');

    // Check if resident already exists
    let existing = this.npcs.find(n => n.viewerUsername === cleanUser);
    if (existing) {
      existing.money += Number(viewerData.value || 50);
      existing.group.scale.set(1.15, 1.15, 1.15);
      setTimeout(() => existing.group.scale.set(1, 1, 1), 600);
      return existing;
    }

    // Spawn new resident
    const randomJob = JOBS[Math.floor(Math.random() * JOBS.length)];
    const resident = this.spawnNPC({
      viewerUsername: cleanUser,
      name: viewerData.nickname || cleanUser,
      job: viewerData.job || randomJob,
      money: Number(viewerData.money || 300)
    });

    return resident;
  }

  triggerPanic(epicenter, radius = 50) {
    for (const npc of this.npcs) {
      const dx = npc.group.position.x - epicenter.x;
      const dz = npc.group.position.z - epicenter.z;
      const dst = Math.sqrt(dx * dx + dz * dz);
      if (dst <= radius) {
        const ai = this.aiMap.get(npc);
        if (ai) {
          ai.setPanic(new THREE.Vector3(dx, 0, dz).normalize());
        }
      }
    }
  }

  removeNPC(npc) {
    const idx = this.npcs.indexOf(npc);
    if (idx !== -1) {
      this.npcs.splice(idx, 1);
      this.aiMap.delete(npc);
      this.scene.remove(npc.group);
    }
  }

  update(deltaTime, inGameHour) {
    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i];
      const ai = this.aiMap.get(npc);

      if (ai) {
        ai.update(deltaTime, inGameHour);
      }
      npc.update(deltaTime, this.pathGraph, ai);
    }
  }

  getCount() {
    return this.npcs.length;
  }

  getResidents() {
    return this.npcs.filter(n => n.isResident);
  }
}
