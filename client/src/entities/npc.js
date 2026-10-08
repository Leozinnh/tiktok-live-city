import * as THREE from 'three';

const SKIN_TONES = [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524];
const CLOTHING_COLORS = [
  0xef4444, 0x3b82f6, 0x10b981, 0x8b5cf6, 0xf59e0b,
  0x06b6d4, 0x475569, 0x64748b, 0xd97706, 0xbe185d
];

export class NPC {
  constructor(options = {}) {
    this.id = options.id || `npc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.name = options.name || 'Morador';
    this.viewerUsername = options.viewerUsername || null;
    this.isResident = !!this.viewerUsername;
    this.personality = options.personality || 'Worker';
    this.job = options.job || 'Civil';
    this.money = options.money ?? 250;
    this.energy = options.energy ?? 100;
    this.hunger = options.hunger ?? 20;
    this.mood = options.mood ?? 100;

    this.state = 'WANDERING';
    this.speed = 1.6; // Human walking speed (1.6 m/s)
    this.animTimer = Math.random() * 10;
    this.targetNode = null;
    this.currentNode = null;
    this.targetNodeId = null;

    this.isSitting = false;
    this.isKnockedDown = false;
    this.pauseTimer = 0;

    this.group = new THREE.Group();
    this.buildMesh(options);

    if (this.isResident) {
      this.buildOverheadBadge();
    }
  }

  triggerKnockdown(vehicle = null) {
    if (this.isKnockedDown) return;
    this.isKnockedDown = true;
    this.state = 'KNOCKED_DOWN';
    this.isSitting = false;
    this.pauseTimer = 8.0; // Stays knocked down on ground for 8 seconds

    // Fling back in car impact direction
    if (vehicle && vehicle.group) {
      const vRot = vehicle.group.rotation.y;
      this.group.position.x += Math.sin(vRot) * 2.8;
      this.group.position.z += Math.cos(vRot) * 2.8;
    }

    // Lie flat on back
    this.group.rotation.x = Math.PI / 2;
    this.group.position.y = 0.2;
    this.leftArmPivot.rotation.x = -Math.PI / 4;
    this.rightArmPivot.rotation.x = Math.PI / 4;
  }

  buildMesh(options) {
    const skinColor = options.skinColor || SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
    const shirtColor = options.shirtColor || (
      this.job === 'Policial' ? 0x1e3a8a :
      this.job === 'Médico' ? 0xf8fafc :
      CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)]
    );
    const pantsColor = this.job === 'Policial' ? 0x0f172a : 0x1e293b;

    this.skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 });
    this.shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 });
    this.pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
    this.shoeMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });

    // Torso
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.4), this.shirtMat);
    this.torso.position.y = 1.15;
    this.torso.castShadow = true;
    this.torso.receiveShadow = true;
    this.group.add(this.torso);

    // Head
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), this.skinMat);
    this.head.position.y = 1.85;
    this.head.castShadow = true;
    this.group.add(this.head);

    // Hair or Hat
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.18, 0.54), hairMat);
    hair.position.y = 2.12;
    this.group.add(hair);

    // Left Arm Pivot & Mesh
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.48, 1.5, 0);
    const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const leftArm = new THREE.Mesh(armGeo, this.shirtMat);
    leftArm.position.y = -0.32;
    leftArm.castShadow = true;
    this.leftArmPivot.add(leftArm);
    this.group.add(this.leftArmPivot);

    // Right Arm Pivot & Mesh
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.48, 1.5, 0);
    const rightArm = new THREE.Mesh(armGeo, this.shirtMat);
    rightArm.position.y = -0.32;
    rightArm.castShadow = true;
    this.rightArmPivot.add(rightArm);
    this.group.add(this.rightArmPivot);

    // Left Leg Pivot & Mesh
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.2, 0.72, 0);
    const legGeo = new THREE.BoxGeometry(0.24, 0.75, 0.24);
    const leftLeg = new THREE.Mesh(legGeo, this.pantsMat);
    leftLeg.position.y = -0.35;
    leftLeg.castShadow = true;
    this.leftLegPivot.add(leftLeg);
    this.group.add(this.leftLegPivot);

    // Right Leg Pivot & Mesh
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.2, 0.72, 0);
    const rightLeg = new THREE.Mesh(legGeo, this.pantsMat);
    rightLeg.position.y = -0.35;
    rightLeg.castShadow = true;
    this.rightLegPivot.add(rightLeg);
    this.group.add(this.rightLegPivot);
  }

  buildOverheadBadge() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    // Draw stylized badge card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 88, 16);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Username
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`@${this.viewerUsername || this.name}`, 128, 40);

    // Job and Money
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`${this.job} • $${this.money}`, 128, 72);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    this.badgeSprite = new THREE.Sprite(spriteMat);
    this.badgeSprite.scale.set(3.2, 1.2, 1);
    this.badgeSprite.position.set(0, 3.0, 0);
    this.group.add(this.badgeSprite);
  }

  update(deltaTime, pathGraph, ai = null) {
    // If knocked down on the ground by a vehicle impact
    if (this.isKnockedDown) {
      this.pauseTimer -= deltaTime;
      this.group.rotation.x = Math.PI / 2;
      this.group.position.y = 0.2;
      if (this.pauseTimer <= 0) {
        // Recover and get back up
        this.isKnockedDown = false;
        this.group.rotation.x = 0;
        this.group.position.y = 0;
        this.state = 'WANDERING';
      }
      return;
    }

    // If sitting on bench
    if (this.isSitting) {
      this.leftArmPivot.rotation.x = -0.2;
      this.rightArmPivot.rotation.x = -0.2;
      this.leftLegPivot.rotation.x = -Math.PI / 2.2;
      this.rightLegPivot.rotation.x = -Math.PI / 2.2;
      this.group.position.y = -0.25;
      return;
    }
    this.group.position.y = 0;

    // If taking a natural pause at a street corner
    if (this.pauseTimer > 0) {
      this.pauseTimer -= deltaTime;
      this.leftArmPivot.rotation.x = 0;
      this.rightArmPivot.rotation.x = 0;
      this.leftLegPivot.rotation.x = 0;
      this.rightLegPivot.rotation.x = 0;
      return;
    }

    this.animTimer += deltaTime * (this.state === 'FLEEING' ? 10 : 4.5);

    // Procedural Walking Animation
    const swingAngle = Math.sin(this.animTimer) * (this.state === 'FLEEING' ? 0.8 : 0.45);
    this.leftArmPivot.rotation.x = swingAngle;
    this.rightArmPivot.rotation.x = -swingAngle;
    this.leftLegPivot.rotation.x = -swingAngle;
    this.rightLegPivot.rotation.x = swingAngle;

    // Next node selection along the connected sidewalk graph
    if (!this.targetNode) {
      if (this.targetNodeId) {
        const destNode = pathGraph.sidewalkNodes.find(n => n.id === this.targetNodeId);
        this.targetNode = destNode || pathGraph.getNextSidewalkNode(this.currentNode);
      } else {
        this.targetNode = pathGraph.getNextSidewalkNode(this.currentNode);
      }
      if (!this.targetNode) return;
    }

    const tx = this.targetNode.x;
    const tz = this.targetNode.z;

    const dx = tx - this.group.position.x;
    const dz = tz - this.group.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.6) {
      this.currentNode = this.targetNode;

      if (ai) {
        ai.onReachedTargetNode(this.currentNode.id);
      }

      // 25% chance of a realistic brief pause at street corners
      if (Math.random() < 0.25 && this.state !== 'FLEEING') {
        this.pauseTimer = 1.8 + Math.random() * 2.2;
      }

      this.targetNode = null;
      return;
    }

    // Smoothly turn towards next node
    const targetAngle = Math.atan2(dx, dz);
    let diff = targetAngle - this.group.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.group.rotation.y += diff * Math.min(1, deltaTime * 6);

    // Step forward along sidewalk
    const moveSpeed = (this.state === 'FLEEING' ? 6.5 : this.speed) * deltaTime;
    this.group.position.x += Math.sin(targetAngle) * moveSpeed;
    this.group.position.z += Math.cos(targetAngle) * moveSpeed;
  }
}
