import * as THREE from 'three';

export class Vehicle {
  constructor(type = 'civil', color = 0x3b82f6, options = {}) {
    this.type = type; // 'civil', 'sports', 'police', 'ambulance'
    this.isRacing = options.isRacing || false;
    this.maxSpeed = this.isRacing ? 26 : type === 'sports' ? 14 : type === 'police' ? 16 : type === 'ambulance' ? 14 : 7.5;
    this.currentSpeed = this.maxSpeed;
    this.emergencyMode = type === 'police' || type === 'ambulance' || this.isRacing;
    this.ignoreTraffic = this.isRacing || type === 'police' || type === 'ambulance';

    this.group = new THREE.Group();
    this.targetNode = null;
    this.currentNode = null;
    this.pursuitTarget = null;
    this.sirenTimer = 0;
    this.isCrashed = false;

    this.buildMesh(color);
  }

  buildMesh(color) {
    const isVan = this.type === 'ambulance';
    const bodyWidth = 2.2;
    const bodyLength = isVan ? 5.2 : 4.4;
    const bodyHeight = isVan ? 1.6 : 0.9;

    // Chassis / Body
    let bodyColor = color;
    if (this.type === 'police') bodyColor = 0x0f172a;
    if (this.type === 'ambulance') bodyColor = 0xf8fafc;

    const bodyGeo = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.35,
      metalness: 0.4
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = bodyHeight / 2 + 0.4;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);

    // Cabin / Roof
    const cabinWidth = 1.9;
    const cabinHeight = isVan ? 0.8 : 0.75;
    const cabinLength = isVan ? 4.8 : 2.4;
    const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, bodyHeight + cabinHeight / 2 + 0.4, isVan ? 0 : -0.2);
    cabin.castShadow = true;
    this.group.add(cabin);

    // Headlights (Front is +Z)
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xfef08a,
      emissiveIntensity: 1.5
    });
    const hlGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);

    const hlLeft = new THREE.Mesh(hlGeo, headlightMat);
    hlLeft.position.set(-0.8, 0.8, bodyLength / 2 + 0.05);
    this.group.add(hlLeft);

    const hlRight = new THREE.Mesh(hlGeo, headlightMat);
    hlRight.position.set(0.8, 0.8, bodyLength / 2 + 0.05);
    this.group.add(hlRight);

    // Taillights (Rear is -Z)
    this.taillightMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      emissive: 0xef4444,
      emissiveIntensity: 1.2
    });
    const tlLeft = new THREE.Mesh(hlGeo, this.taillightMat);
    tlLeft.position.set(-0.8, 0.8, -bodyLength / 2 - 0.05);
    this.group.add(tlLeft);

    const tlRight = new THREE.Mesh(hlGeo, this.taillightMat);
    tlRight.position.set(0.8, 0.8, -bodyLength / 2 - 0.05);
    this.group.add(tlRight);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const wheelPositions = [
      [-1.15, 0.42, 1.4],
      [1.15, 0.42, 1.4],
      [-1.15, 0.42, -1.4],
      [1.15, 0.42, -1.4]
    ];

    this.wheels = [];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      this.group.add(wheel);
      this.wheels.push(wheel);
    });

    // Emergency Lightbars
    if (this.type === 'police' || this.type === 'ambulance') {
      const barBase = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.15, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      barBase.position.set(0, bodyHeight + cabinHeight + 0.45, 0);
      this.group.add(barBase);

      this.sirenLeftMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        emissive: 0x3b82f6,
        emissiveIntensity: 2.5
      });
      this.sirenRightMat = new THREE.MeshStandardMaterial({
        color: 0xb91c1c,
        emissive: 0xef4444,
        emissiveIntensity: 2.5
      });

      const sGeo = new THREE.BoxGeometry(0.5, 0.25, 0.35);

      this.sirenLeft = new THREE.Mesh(sGeo, this.sirenLeftMat);
      this.sirenLeft.position.set(-0.35, bodyHeight + cabinHeight + 0.6, 0);
      this.group.add(this.sirenLeft);

      this.sirenRight = new THREE.Mesh(sGeo, this.sirenRightMat);
      this.sirenRight.position.set(0.35, bodyHeight + cabinHeight + 0.6, 0);
      this.group.add(this.sirenRight);
    }
  }

  update(deltaTime, pathGraph, trafficLights = [], allVehicles = []) {
    if (this.isCrashed) {
      return;
    }

    // Emergency siren strobe
    if (this.emergencyMode && this.sirenLeftMat && this.sirenRightMat) {
      this.sirenTimer += deltaTime * 8;
      const leftActive = Math.sin(this.sirenTimer) > 0;
      this.sirenLeftMat.emissiveIntensity = leftActive ? 3.0 : 0.2;
      this.sirenRightMat.emissiveIntensity = leftActive ? 0.2 : 3.0;
    }

    // Active Police Pursuit: Follow the suspect's road path at high speed (STAYING ON ROAD)
    if (this.pursuitTarget && this.pursuitTarget.group) {
      if (this.pursuitTarget.currentNode) {
        // Stay on road waypoints leading towards suspect
        this.maxSpeed = 26;
        this.currentSpeed = Math.min(26, (this.pursuitTarget.currentSpeed || 22) + 1.5);
      }
    }

    if (!this.targetNode) {
      if (this.pursuitTarget && this.pursuitTarget.currentNode) {
        this.targetNode = this.pursuitTarget.currentNode;
      } else {
        this.targetNode = pathGraph.getNextRoadNode(this.currentNode);
      }
      if (!this.targetNode) return;
    }

    // Move toward target node
    const dx = this.targetNode.x - this.group.position.x;
    const dz = this.targetNode.z - this.group.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Forward heading vectors
    const myPos = this.group.position;
    const myHeading = this.group.rotation.y;
    const forwardX = Math.sin(myHeading);
    const forwardZ = Math.cos(myHeading);

    // ==========================================
    // 1. VERIFICAÇÃO DE SEMÁFORO
    // ==========================================
    let shouldStopForLight = false;
    if (!this.ignoreTraffic && this.targetNode.isIntersection && trafficLights.length >= 4) {
      const isEW = Math.abs(dx) > Math.abs(dz);
      const lightState = isEW ? trafficLights[0].getState() : trafficLights[1].getState();

      if ((lightState === 'RED' || lightState === 'YELLOW') && dist < 14) {
        shouldStopForLight = true;
      }
    }

    // ==========================================
    // 2. DETECÇÃO DE VEÍCULO À FRENTE (PREVENÇÃO DE COLISÕES)
    // ==========================================
    let shouldStopForCar = false;
    if (!this.ignoreTraffic) {
      for (let i = 0; i < allVehicles.length; i++) {
        const other = allVehicles[i];
        if (other === this || other.isCrashed) continue;

        const ox = other.group.position.x - myPos.x;
        const oz = other.group.position.z - myPos.z;
        const oDist = Math.sqrt(ox * ox + oz * oz);

        if (oDist < 8.5) {
          const dot = (ox * forwardX + oz * forwardZ) / oDist;
          if (dot > 0.65) {
            shouldStopForCar = true;
            break;
          }
        }
      }
    }

    // Smooth braking or acceleration
    const targetSpeed = (shouldStopForLight || shouldStopForCar) ? 0 : this.maxSpeed;
    const accelRate = (targetSpeed === 0) ? 14 : 6;
    this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, targetSpeed, deltaTime * accelRate);

    if (dist < 1.5) {
      this.currentNode = this.targetNode;
      this.targetNode = pathGraph.getNextRoadNode(this.currentNode);
      return;
    }

    // Rotate towards target heading (+Z forward in model space)
    const targetAngle = Math.atan2(dx, dz);
    let diff = targetAngle - this.group.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.group.rotation.y += diff * Math.min(1, deltaTime * 5);

    // Forward translation
    const moveStep = this.currentSpeed * deltaTime;
    this.group.position.x += forwardX * moveStep;
    this.group.position.z += forwardZ * moveStep;

    // Spin wheels
    this.wheels.forEach(w => {
      w.rotation.x += moveStep * 1.5;
    });
  }

  setCrash() {
    this.isCrashed = true;
    this.currentSpeed = 0;
    this.group.rotation.z = 0.25; // tilt on side
  }
}
