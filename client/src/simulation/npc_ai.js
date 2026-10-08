export class NPCAI {
  constructor(npc, buildings) {
    this.npc = npc;
    this.buildings = buildings || [];

    // Assign mapped sidewalk entrance nodes for daily routine
    this.routineNodes = {
      bank: 'sw_a_bank_door',
      home: 'sw_a_apt_door',
      police: 'sw_c_police_door',
      hospital: 'sw_c_hospital_door',
      gas: 'sw_d_gas_door',
      restaurant: 'sw_d_bistro_door',
      park: 'sw_b_fountain'
    };

    // Pick job workplace node
    if (this.npc.job === 'Policial') {
      this.workNode = this.routineNodes.police;
    } else if (this.npc.job === 'Médico') {
      this.workNode = this.routineNodes.hospital;
    } else if (this.npc.job === 'Comerciante' || this.npc.job === 'Engenheiro') {
      this.workNode = this.routineNodes.bank;
    } else {
      this.workNode = this.routineNodes.restaurant;
    }

    this.homeNode = this.routineNodes.home;
    this.stateTimer = 0;
    this.isAtActivity = false;
    this.activityTimer = 0;
  }

  update(deltaTime, inGameHour) {
    if (this.npc.state === 'FLEEING') {
      this.stateTimer += deltaTime;
      if (this.stateTimer > 15) {
        this.npc.state = 'WANDERING';
        this.stateTimer = 0;
      }
      return;
    }

    // Dynamic Needs accumulation
    this.npc.hunger = Math.min(100, this.npc.hunger + deltaTime * 0.3);
    this.npc.energy = Math.max(0, this.npc.energy - deltaTime * 0.2);

    // If currently performing an activity (eating inside, working inside, sitting in park)
    if (this.isAtActivity) {
      this.activityTimer -= deltaTime;
      if (this.activityTimer <= 0) {
        this.isAtActivity = false;
        this.npc.isSitting = false;
        this.npc.state = 'WANDERING';
        this.npc.targetNodeId = null;
      }
      return;
    }

    // Decision Logic based on time of day
    // 1. Almoço / Fome alta (12h - 13h ou fome > 85)
    if ((inGameHour >= 12 && inGameHour < 13.2) || this.npc.hunger > 85) {
      if (this.npc.state !== 'EATING') {
        this.npc.state = 'EATING';
        this.npc.targetNodeId = this.routineNodes.restaurant;
      }
      return;
    }

    // 2. Expediente de trabalho (08h - 17h)
    if (inGameHour >= 8.5 && inGameHour < 17) {
      if (this.npc.state !== 'WORKING') {
        this.npc.state = 'WORKING';
        this.npc.targetNodeId = this.workNode;
      }
      return;
    }

    // 3. Lazer no Parque (17h - 20h)
    if (inGameHour >= 17 && inGameHour < 20.5) {
      if (this.npc.state !== 'RELAXING_IN_PARK') {
        this.npc.state = 'RELAXING_IN_PARK';
        this.npc.targetNodeId = this.routineNodes.park;
      }
      return;
    }

    // 4. Noite / Descanso (22h - 06h)
    if (inGameHour >= 22 || inGameHour < 6) {
      if (this.npc.state !== 'SLEEPING') {
        this.npc.state = 'SLEEPING';
        this.npc.targetNodeId = this.homeNode;
      }
      return;
    }

    // Default: Passeio natural pelas calçadas
    if (this.npc.state !== 'WANDERING') {
      this.npc.state = 'WANDERING';
      this.npc.targetNodeId = null;
    }
  }

  onReachedTargetNode(nodeId) {
    // When reaching destination, start a natural pause/activity
    if (this.npc.state === 'EATING' && nodeId === this.routineNodes.restaurant) {
      this.isAtActivity = true;
      this.activityTimer = 8.0;
      this.npc.hunger = 10;
      this.npc.money = Math.max(0, this.npc.money - 15);
    } else if (this.npc.state === 'WORKING' && nodeId === this.workNode) {
      this.isAtActivity = true;
      this.activityTimer = 12.0;
      this.npc.money += 45;
    } else if (this.npc.state === 'RELAXING_IN_PARK' && nodeId === this.routineNodes.park) {
      this.isAtActivity = true;
      this.activityTimer = 10.0;
      this.npc.isSitting = true;
      this.npc.mood = 100;
    } else if (this.npc.state === 'SLEEPING' && nodeId === this.homeNode) {
      this.isAtActivity = true;
      this.activityTimer = 15.0;
      this.npc.energy = 100;
    }
  }

  setPanic(fleeDirection) {
    this.npc.state = 'FLEEING';
    this.isAtActivity = false;
    this.npc.isSitting = false;
    this.stateTimer = 0;
    this.npc.targetNodeId = null;
  }
}
