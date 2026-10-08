import * as THREE from 'three';
import { CAMERA_MODES, SCENIC_POINTS } from './camera_modes.js';

export class CameraDirector {
  constructor(camera) {
    this.camera = camera;
    this.mode = CAMERA_MODES.ORBITAL;
    this.targetEntity = null;

    this.currentPosition = camera.position.clone();
    this.currentLookAt = new THREE.Vector3(0, 0, 0);

    this.targetPosition = camera.position.clone();
    this.targetLookAt = new THREE.Vector3(0, 0, 0);

    this.orbitAngle = Math.PI / 4;
    this.orbitRadius = 115;
    this.orbitHeight = 68;

    this.scenicTimer = 0;
    this.scenicIndex = 0;
    this.temporaryModeTimer = 0;
  }

  setMode(mode, targetEntity = null, customPos = null, customLookAt = null) {
    this.mode = mode;
    this.targetEntity = targetEntity;

    if (customPos) {
      this.targetPosition.copy(customPos);
    }
    if (customLookAt) {
      this.targetLookAt.copy(customLookAt);
    }
  }

  focusOnResident(npc, durationSeconds = 14) {
    if (!npc || !npc.group) return;
    this.setMode(CAMERA_MODES.FOLLOW_NPC, npc.group);
    this.temporaryModeTimer = durationSeconds;
  }

  focusOnVehicle(vehicle, durationSeconds = 12) {
    if (!vehicle || !vehicle.group) return;
    this.setMode(CAMERA_MODES.CHASE, vehicle.group);
    this.temporaryModeTimer = durationSeconds;
  }

  triggerCinematicShot(pos, lookAt, durationSeconds = 8, instant = false) {
    this.setMode(CAMERA_MODES.CINEMATIC_EVENT, null, pos, lookAt);
    this.temporaryModeTimer = durationSeconds;
    if (instant) {
      this.currentPosition.copy(pos);
      this.currentLookAt.copy(lookAt);
      this.camera.position.copy(pos);
      this.camera.lookAt(lookAt);
    }
  }

  update(deltaTime) {
    // If temporary mode is active, count down and return to orbital
    if (this.temporaryModeTimer > 0) {
      this.temporaryModeTimer -= deltaTime;
      if (this.temporaryModeTimer <= 0) {
        this.setMode(CAMERA_MODES.ORBITAL);
      }
    }

    if (this.mode === CAMERA_MODES.ORBITAL) {
      // Slow panoramic orbit around the city
      this.orbitAngle += deltaTime * 0.035;
      this.scenicTimer += deltaTime;

      if (this.scenicTimer > 28) {
        this.scenicTimer = 0;
        this.scenicIndex = (this.scenicIndex + 1) % SCENIC_POINTS.length;
      }

      const scenic = SCENIC_POINTS[this.scenicIndex];
      const ox = Math.cos(this.orbitAngle) * this.orbitRadius;
      const oz = Math.sin(this.orbitAngle) * this.orbitRadius;

      // Blend subtle orbit with scenic focus point
      this.targetPosition.set(scenic.pos.x + ox * 0.25, scenic.pos.y, scenic.pos.z + oz * 0.25);
      this.targetLookAt.set(scenic.lookAt.x, scenic.lookAt.y, scenic.lookAt.z);
    } else if (this.mode === CAMERA_MODES.CHASE && this.targetEntity) {
      // Dynamic chase camera behind target vehicle
      const ePos = this.targetEntity.position;
      const eRot = this.targetEntity.rotation.y;

      const backX = -Math.sin(eRot) * 11;
      const backZ = -Math.cos(eRot) * 11;

      this.targetPosition.set(ePos.x + backX, ePos.y + 4.5, ePos.z + backZ);
      this.targetLookAt.set(ePos.x, ePos.y + 1.2, ePos.z);
    } else if (this.mode === CAMERA_MODES.FOLLOW_NPC && this.targetEntity) {
      // Third-person camera following NPC resident
      const ePos = this.targetEntity.position;
      const eRot = this.targetEntity.rotation.y;

      const backX = -Math.sin(eRot) * 6.5;
      const backZ = -Math.cos(eRot) * 6.5;

      this.targetPosition.set(ePos.x + backX, ePos.y + 3.2, ePos.z + backZ);
      this.targetLookAt.set(ePos.x, ePos.y + 1.5, ePos.z);
    }

    // Smooth Lerp Transitions (Faster during dramatic events)
    const lerpSpeed = Math.min(1, deltaTime * (this.mode === CAMERA_MODES.CINEMATIC_EVENT ? 5.5 : 3.2));
    this.currentPosition.lerp(this.targetPosition, lerpSpeed);
    this.currentLookAt.lerp(this.targetLookAt, lerpSpeed);

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }
}
