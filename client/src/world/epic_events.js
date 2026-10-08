import * as THREE from 'three';

export class EpicEventManager {
  constructor(options = {}) {
    this.scene = options.scene;
    this.cameraDirector = options.cameraDirector;
    this.npcManager = options.npcManager;
    this.vehicleManager = options.vehicleManager;
    this.cityBuilder = options.cityBuilder;
    this.soundEngine = options.soundEngine;
    this.environment = options.environment;

    this.activeMeteor = null;
    this.activeGalaxy = null;
    this.fireworks = [];
    this.shockwaves = [];
    this.particles = [];
    this.screenShake = 0;
    this.isEventBusy = false;

    this.particleTexture = this.createCircleTexture();
  }

  createCircleTexture() {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 220, 120, 0.9)');
    grad.addColorStop(0.7, 'rgba(255, 100, 30, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    return new THREE.CanvasTexture(canvas);
  }

  cleanupPreviousEvent() {
    if (this.activeMeteor) {
      if (this.scene) this.scene.remove(this.activeMeteor.group);
      this.activeMeteor = null;
    }
    if (this.activeGalaxy) {
      if (this.scene) {
        this.scene.remove(this.activeGalaxy.portalGroup);
        this.scene.remove(this.activeGalaxy.dustPoints);
      }
      this.activeGalaxy.levitatingNpcs.forEach(item => {
        if (item.npc && item.npc.group) item.npc.group.position.y = item.initialY;
      });
      this.activeGalaxy = null;
    }
    if (this.soundEngine) {
      this.soundEngine.stopAllSirens();
    }
    this.isEventBusy = false;
  }

  showBanner(title, desc, durationMs = 5000) {
    if (typeof document === 'undefined') return;
    const banner = document.getElementById('epic-banner');
    const titleEl = document.getElementById('epic-banner-title');
    const descEl = document.getElementById('epic-banner-desc');

    if (banner && titleEl && descEl) {
      titleEl.textContent = title;
      descEl.textContent = desc;
      banner.classList.add('active');

      setTimeout(() => {
        banner.classList.remove('active');
      }, durationMs);
    }
  }

  triggerMeteorStrike(targetPos = { x: 0, z: 0 }) {
    // Clean up any ongoing action so admin clicks ALWAYS execute immediately
    this.cleanupPreviousEvent();
    this.isEventBusy = true;

    this.showBanner('☄️ ALERTA MÁXIMO: METEORO EM ROTA DE COLISÃO!', 'Impacto iminente no centro da cidade! Procurem abrigo!');

    // Dramatic Crimson War Sky
    if (this.scene) {
      this.scene.background = new THREE.Color('#581c87');
      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color('#581c87');
        this.scene.fog.density = 0.002;
      }
    }

    if (this.soundEngine) {
      this.soundEngine.playSiren(true);
    }

    // Trajectory coordinates: Starts in front of camera view at height 95m, hurtling towards downtown (0, 0)
    const startX = targetPos.x - 30;
    const startY = 95;
    const startZ = targetPos.z - 30;

    // Camera: Positioned at an ideal low angle looking directly up at the incoming meteor
    if (this.cameraDirector) {
      this.cameraDirector.triggerCinematicShot(
        new THREE.Vector3(targetPos.x + 38, 16, targetPos.z + 38),
        new THREE.Vector3(startX, startY, startZ),
        10,
        true // Snap camera immediately so viewer sees the meteor from frame 1!
      );
    }

    // Build Large Glowing Meteor
    const meteorGroup = new THREE.Group();

    // Jagged Rock Core
    const rockGeo = new THREE.DodecahedronGeometry(5.5, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x1f130e,
      emissive: 0xff3b00,
      emissiveIntensity: 4.0,
      roughness: 0.8
    });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    meteorGroup.add(rock);

    // Incandescent Fire Aura Sphere
    const fireGeo = new THREE.SphereGeometry(7.2, 16, 16);
    const fireMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const fireSphere = new THREE.Mesh(fireGeo, fireMat);
    meteorGroup.add(fireSphere);

    // Intense PointLight lighting up the buildings below
    const meteorLight = new THREE.PointLight(0xff5500, 6.0, 140, 1.2);
    meteorGroup.add(meteorLight);

    meteorGroup.position.set(startX, startY, startZ);
    this.scene.add(meteorGroup);

    this.activeMeteor = {
      group: meteorGroup,
      start: new THREE.Vector3(startX, startY, startZ),
      target: new THREE.Vector3(targetPos.x, 0, targetPos.z),
      progress: 0,
      speed: 0.20, // ~5.0 seconds of breathtaking, visible descent!
      impactTriggered: false,
      tailTimer: 0
    };

    return { name: 'meteor_strike', target: targetPos };
  }

  triggerImpact(pos) {
    if (this.soundEngine) {
      this.soundEngine.playExplosion();
      this.soundEngine.stopAllSirens();
    }

    this.screenShake = 1.4;

    if (this.npcManager) {
      this.npcManager.triggerPanic(pos, 80);
    }

    // Expanding Ground Shockwave Rings
    for (let r = 0; r < 2; r++) {
      const ringGeo = new THREE.RingGeometry(1.0, 4.0, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: r === 0 ? 0xff3b00 : 0xffcc00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
      });
      const shockwave = new THREE.Mesh(ringGeo, ringMat);
      shockwave.rotation.x = -Math.PI / 2;
      shockwave.position.set(pos.x, 0.2 + r * 0.05, pos.z);
      this.scene.add(shockwave);
      this.shockwaves.push({ mesh: shockwave, scale: 1, opacity: 1, speed: 25 + r * 10 });
    }

    // Glowing Impact Crater
    const craterGeo = new THREE.CylinderGeometry(8.0, 6.0, 0.6, 20);
    const craterMat = new THREE.MeshStandardMaterial({
      color: 0x0a0705,
      emissive: 0xef4444,
      emissiveIntensity: 2.2,
      roughness: 0.9
    });
    const crater = new THREE.Mesh(craterGeo, craterMat);
    crater.position.set(pos.x, 0.2, pos.z);
    this.scene.add(crater);

    this.spawnExplosionCloud(pos.x, 2, pos.z);

    // Restore environment lighting after 6s
    setTimeout(() => {
      if (this.environment) {
        this.environment.updateLighting();
      }
      this.isEventBusy = false;
    }, 6000);

    if (this.vehicleManager) {
      setTimeout(() => {
        this.vehicleManager.spawnPoliceCruiser();
        this.vehicleManager.spawnAmbulance();
      }, 1200);
    }
  }

  spawnExplosionCloud(x, y, z) {
    const count = 100;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vels = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const speed = Math.random() * 22 + 10;
      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * 0.9 + 0.15;

      vels.push(
        Math.cos(angle) * speed,
        elevation * speed * 1.6,
        Math.sin(angle) * speed
      );
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xff5500,
      size: 5.5,
      map: this.particleTexture || null,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const pCloud = new THREE.Points(geo, mat);
    this.scene.add(pCloud);
    this.particles.push({ mesh: pCloud, vels, life: 1.8 });
  }

  triggerStreetRace() {
    this.cleanupPreviousEvent();
    this.isEventBusy = true;

    this.showBanner('🏎️ CORRIDA CLANDESTINA DETECTADA!', 'Dois esportivos disputando racha na avenida principal!');

    if (!this.vehicleManager) {
      this.isEventBusy = false;
      return null;
    }

    if (this.soundEngine) {
      this.soundEngine.playTireScreech();
    }

    const startNode = this.vehicleManager.pathGraph.roadNodes.find(n => n.id === 'r_ew_e_start') ||
                      this.vehicleManager.pathGraph.roadNodes[0];
    const targetCross = this.vehicleManager.pathGraph.roadNodes.find(n => n.id === 'r_ew_e_cross') ||
                        this.vehicleManager.pathGraph.roadNodes[1];

    const car1 = this.vehicleManager.spawnVehicle('sports', startNode, 0xdc2626);
    if (car1) {
      car1.isRacing = true;
      car1.ignoreTraffic = true;
      car1.emergencyMode = true;
      car1.maxSpeed = 26;
      car1.currentSpeed = 26;
      car1.group.position.set(-52, 0, 2.0);
      car1.targetNode = targetCross;
    }

    const car2 = this.vehicleManager.spawnVehicle('sports', startNode, 0x16a34a);
    if (car2) {
      car2.isRacing = true;
      car2.ignoreTraffic = true;
      car2.emergencyMode = true;
      car2.maxSpeed = 24.5;
      car2.currentSpeed = 24.5;
      car2.group.position.set(-52, 0, 5.0);
      car2.targetNode = targetCross;
    }

    // Dynamic Chase Cam following the racers
    if (this.cameraDirector && car1) {
      this.cameraDirector.focusOnVehicle(car1, 14);
    }

    // Police Cruiser dispatched in hot pursuit
    setTimeout(() => {
      const cop = this.vehicleManager.spawnPoliceCruiser();
      if (cop) {
        cop.group.position.set(-58, 0, 3.5);
        cop.currentSpeed = 25;
        cop.targetNode = targetCross;
        cop.pursuitTarget = car1;

        if (this.cameraDirector) {
          this.cameraDirector.focusOnVehicle(cop, 12);
        }
      }
      if (this.soundEngine) {
        this.soundEngine.playSiren(true);
        setTimeout(() => {
          this.soundEngine.stopAllSirens();
          this.isEventBusy = false;
        }, 11000);
      } else {
        setTimeout(() => { this.isEventBusy = false; }, 11000);
      }
    }, 1200);

    return { name: 'street_race', car1, car2 };
  }

  triggerGalaxyEvent(targetPos = { x: 0, z: 0 }) {
    this.cleanupPreviousEvent();
    this.isEventBusy = true;

    this.showBanner('🌌 EVENTO LENDÁRIO: FENÔMENO GALÁXIA!', 'Vórtice estelar aberto no céu! Gravidade zero ativada!');

    if (this.scene) {
      this.scene.background = new THREE.Color('#0f051d');
      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color('#0f051d');
        this.scene.fog.density = 0.003;
      }
    }

    if (this.soundEngine) {
      this.soundEngine.playCosmicWarp();
    }

    if (this.cameraDirector) {
      this.cameraDirector.triggerCinematicShot(
        new THREE.Vector3(targetPos.x + 40, 25, targetPos.z + 40),
        new THREE.Vector3(targetPos.x, 45, targetPos.z),
        10
      );
    }

    // 3D Spinning Cosmic Vortex Portal
    const portalGroup = new THREE.Group();
    portalGroup.position.set(targetPos.x, 50, targetPos.z);
    portalGroup.rotation.x = Math.PI / 2.3;

    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(14, 0.6, 16, 48),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x38bdf8,
        emissiveIntensity: 3.0,
        roughness: 0.2
      })
    );
    portalGroup.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(9, 0.5, 16, 36),
      new THREE.MeshStandardMaterial({
        color: 0x9333ea,
        emissive: 0xd946ef,
        emissiveIntensity: 3.0,
        roughness: 0.2
      })
    );
    portalGroup.add(ring2);

    const ring3 = new THREE.Mesh(
      new THREE.TorusGeometry(4.5, 0.4, 16, 24),
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        emissive: 0xfacc15,
        emissiveIntensity: 3.5,
        roughness: 0.1
      })
    );
    portalGroup.add(ring3);

    const portalLight = new THREE.PointLight(0xd946ef, 5.0, 120, 1.2);
    portalGroup.add(portalLight);

    this.scene.add(portalGroup);

    // Stardust rain
    const dustCount = 180;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustVels = [];

    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = targetPos.x + (Math.random() - 0.5) * 60;
      dustPos[i * 3 + 1] = 45 + Math.random() * 10;
      dustPos[i * 3 + 2] = targetPos.z + (Math.random() - 0.5) * 60;

      dustVels.push(
        (Math.random() - 0.5) * 2,
        -(Math.random() * 5 + 3),
        (Math.random() - 0.5) * 2
      );
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

    const dustMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 3.2,
      map: this.particleTexture || null,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const dustPoints = new THREE.Points(dustGeo, dustMat);
    this.scene.add(dustPoints);

    // Anti-gravity levitation
    const levitatingNpcs = [];
    if (this.npcManager && this.npcManager.npcs) {
      this.npcManager.npcs.forEach(npc => {
        const dx = npc.group.position.x - targetPos.x;
        const dz = npc.group.position.z - targetPos.z;
        if (Math.sqrt(dx * dx + dz * dz) < 45) {
          levitatingNpcs.push({
            npc,
            initialY: npc.group.position.y,
            targetY: 3.5 + Math.random() * 3.0,
            rotSpeed: (Math.random() - 0.5) * 2.5
          });
        }
      });
    }

    this.activeGalaxy = {
      portalGroup,
      ring1,
      ring2,
      ring3,
      dustPoints,
      dustGeo,
      dustVels,
      dustCount,
      levitatingNpcs,
      timer: 0,
      duration: 9.0
    };

    return { name: 'galaxy_cosmic', target: targetPos };
  }

  triggerCityFestival() {
    this.cleanupPreviousEvent();
    this.isEventBusy = true;

    this.showBanner('🎆 FESTIVAL METROPOLITANO!', 'Grande queima de fogos multicoloridos e celebração urbana!');

    const parkPos = { x: 24, z: -24 };

    if (this.cameraDirector) {
      this.cameraDirector.triggerCinematicShot(
        new THREE.Vector3(45, 30, 45),
        new THREE.Vector3(parkPos.x, 26, parkPos.z),
        14
      );
    }

    if (this.soundEngine) {
      this.soundEngine.playNotification();
    }

    const bursts = [
      { delay: 300, color: 0x38bdf8, ox: -12, oz: -8, y: 38 },
      { delay: 900, color: 0xf43f5e, ox: 12, oz: 8, y: 44 },
      { delay: 1600, color: 0xfacc15, ox: 0, oz: 0, y: 48 },
      { delay: 2400, color: 0x4ade80, ox: -18, oz: 14, y: 40 },
      { delay: 3200, color: 0xa855f7, ox: 16, oz: -14, y: 46 },
      { delay: 4000, color: 0xfb923c, ox: -8, oz: -18, y: 42 },
      { delay: 4800, color: 0x06b6d4, ox: 10, oz: 16, y: 50 },
      { delay: 5800, color: 0xf43f5e, ox: -15, oz: 0, y: 52 },
      { delay: 6000, color: 0x38bdf8, ox: 15, oz: 0, y: 54 },
      { delay: 6200, color: 0xfacc15, ox: 0, oz: -15, y: 56 },
      { delay: 6400, color: 0x4ade80, ox: 0, oz: 15, y: 55 },
      { delay: 6600, color: 0xd946ef, ox: -10, oz: -10, y: 58 },
      { delay: 6800, color: 0xf59e0b, ox: 10, oz: 10, y: 60 },
      { delay: 7000, color: 0xffffff, ox: 0, oz: 0, y: 62 }
    ];

    bursts.forEach(b => {
      setTimeout(() => {
        if (this.soundEngine) {
          this.soundEngine.playFireworkLaunch();
        }
        setTimeout(() => {
          this.spawnFirework(parkPos.x + b.ox, b.y, parkPos.z + b.oz, b.color);
          if (this.soundEngine) {
            this.soundEngine.playFireworkBurst();
          }
        }, 500);
      }, b.delay);
    });

    setTimeout(() => {
      this.isEventBusy = false;
    }, 12000);

    return { name: 'city_festival' };
  }

  spawnFirework(x, y, z, fireworkColor = null) {
    const colors = [0x38bdf8, 0xf43f5e, 0xfacc15, 0x4ade80, 0xa855f7, 0xfb923c, 0xffffff];
    const color = fireworkColor || colors[Math.floor(Math.random() * colors.length)];

    const burstLight = new THREE.PointLight(color, 4.5, 90, 1.5);
    burstLight.position.set(x, y, z);
    this.scene.add(burstLight);

    setTimeout(() => {
      this.scene.remove(burstLight);
    }, 350);

    const count = 120;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vels = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const speed = Math.random() * 18 + 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      vels.push(
        speed * Math.cos(phi) * Math.cos(theta),
        speed * Math.sin(phi) * 1.2,
        speed * Math.cos(phi) * Math.sin(theta)
      );
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color,
      size: 4.2,
      map: this.particleTexture || null,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const firework = new THREE.Points(geo, mat);
    this.scene.add(firework);

    this.fireworks.push({
      mesh: firework,
      vels,
      life: 2.2
    });
  }

  triggerBlackout(durationSeconds = 10) {
    this.cleanupPreviousEvent();
    this.isEventBusy = true;

    this.showBanner('💡 APAGÃO GERAL NA CIDADE!', 'Pane na subestação elétrica! Luzes apagadas.');

    if (this.cityBuilder) {
      this.cityBuilder.setNightLights(false);
    }

    if (this.soundEngine) {
      this.soundEngine.playSiren(true);
      setTimeout(() => this.soundEngine.stopAllSirens(), 4000);
    }

    setTimeout(() => {
      this.showBanner('⚡ ENERGIA RESTAURADA!', 'Geradores de emergência ativados.');
      if (this.cityBuilder) {
        this.cityBuilder.setNightLights(true);
      }
      if (this.environment) {
        this.environment.updateLighting();
      }
      this.isEventBusy = false;
    }, durationSeconds * 1000);

    return { name: 'blackout', duration: durationSeconds };
  }

  triggerBankRobbery() {
    this.cleanupPreviousEvent();
    this.isEventBusy = true;

    this.showBanner('🚨 ALARME: ROUBO AO BANCO!', 'Viatura da polícia em código 3 despachada!');

    if (this.cameraDirector) {
      this.cameraDirector.triggerCinematicShot(
        new THREE.Vector3(-12, 14, -14),
        new THREE.Vector3(-24, 4, -28),
        8
      );
    }

    if (this.vehicleManager) {
      const police = this.vehicleManager.spawnPoliceCruiser();
      if (police && this.cameraDirector) {
        setTimeout(() => this.cameraDirector.focusOnVehicle(police, 8), 1000);
      }
      if (this.soundEngine) {
        this.soundEngine.playSiren(true);
        setTimeout(() => {
          this.soundEngine.stopAllSirens();
          this.isEventBusy = false;
        }, 7000);
      } else {
        setTimeout(() => { this.isEventBusy = false; }, 7000);
      }
      return { name: 'bank_robbery', police };
    }

    return { name: 'bank_robbery' };
  }

  update(deltaTime) {
    if (this.screenShake > 0) {
      this.screenShake -= deltaTime * 1.5;
      if (this.cameraDirector && this.cameraDirector.camera) {
        this.cameraDirector.camera.position.x += (Math.random() - 0.5) * this.screenShake * 1.5;
        this.cameraDirector.camera.position.y += (Math.random() - 0.5) * this.screenShake * 1.5;
      }
    }

    // Update active meteor & track camera lookAt
    if (this.activeMeteor) {
      this.activeMeteor.progress += this.activeMeteor.speed * deltaTime;
      const p = this.activeMeteor.progress;

      if (p < 1) {
        this.activeMeteor.group.position.lerpVectors(this.activeMeteor.start, this.activeMeteor.target, p);
        this.activeMeteor.group.rotation.x += deltaTime * 4;
        this.activeMeteor.group.rotation.y += deltaTime * 5;

        // Camera tracks the meteor dynamically down from the sky!
        if (this.cameraDirector) {
          this.cameraDirector.targetLookAt.copy(this.activeMeteor.group.position);
        }

        this.activeMeteor.tailTimer += deltaTime;
        if (this.activeMeteor.tailTimer > 0.08) {
          this.activeMeteor.tailTimer = 0;
          this.spawnTailParticle(this.activeMeteor.group.position);
        }
      } else if (!this.activeMeteor.impactTriggered) {
        this.activeMeteor.impactTriggered = true;
        this.triggerImpact(this.activeMeteor.target);
        this.scene.remove(this.activeMeteor.group);
        this.activeMeteor = null;
      }
    }

    // Update active Galaxy Cosmic Portal
    if (this.activeGalaxy) {
      const g = this.activeGalaxy;
      g.timer += deltaTime;

      g.ring1.rotation.z += deltaTime * 1.5;
      g.ring2.rotation.z -= deltaTime * 2.2;
      g.ring3.rotation.z += deltaTime * 3.0;

      const pos = g.dustGeo.attributes.position.array;
      for (let i = 0; i < g.dustCount; i++) {
        pos[i * 3 + 1] += g.dustVels[i * 3 + 1] * deltaTime;
        if (pos[i * 3 + 1] <= 0) {
          pos[i * 3 + 1] = 45;
        }
      }
      g.dustGeo.attributes.position.needsUpdate = true;

      const isEnding = g.timer > g.duration - 2.0;
      g.levitatingNpcs.forEach(item => {
        if (!item.npc || !item.npc.group) return;
        const targetY = isEnding ? item.initialY : item.targetY;
        item.npc.group.position.y = THREE.MathUtils.lerp(item.npc.group.position.y, targetY, deltaTime * 2.5);
        if (!isEnding) {
          item.npc.group.rotation.y += item.rotSpeed * deltaTime;
          item.npc.leftArmPivot.rotation.x = -0.6;
          item.npc.rightArmPivot.rotation.x = -0.6;
        }
      });

      if (g.timer >= g.duration) {
        this.scene.remove(g.portalGroup);
        this.scene.remove(g.dustPoints);
        g.levitatingNpcs.forEach(item => {
          if (item.npc && item.npc.group) {
            item.npc.group.position.y = item.initialY;
          }
        });

        if (this.environment) {
          this.environment.updateLighting();
        }

        this.showBanner('✨ BENÇÃO CÓSMICA CONCLUÍDA!', 'A cidade recebeu $50.000 em prosperidade estelar!');
        this.activeGalaxy = null;
        this.isEventBusy = false;
      }
    }

    // Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.scale += deltaTime * (sw.speed || 20);
      sw.opacity -= deltaTime * 0.7;
      sw.mesh.scale.set(sw.scale, sw.scale, 1);
      sw.mesh.material.opacity = Math.max(0, sw.opacity);

      if (sw.opacity <= 0) {
        this.scene.remove(sw.mesh);
        this.shockwaves.splice(i, 1);
      }
    }

    // Update Fireworks
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const fw = this.fireworks[i];
      fw.life -= deltaTime * 0.65;
      fw.mesh.material.opacity = Math.max(0, fw.life);

      const positions = fw.mesh.geometry.attributes.position.array;
      for (let j = 0; j < fw.vels.length / 3; j++) {
        positions[j * 3] += fw.vels[j * 3] * deltaTime;
        positions[j * 3 + 1] += fw.vels[j * 3 + 1] * deltaTime - 5 * deltaTime;
        positions[j * 3 + 2] += fw.vels[j * 3 + 2] * deltaTime;
      }
      fw.mesh.geometry.attributes.position.needsUpdate = true;

      if (fw.life <= 0) {
        this.scene.remove(fw.mesh);
        this.fireworks.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= deltaTime;
      p.mesh.material.opacity = Math.max(0, p.life);

      if (p.vels) {
        const positions = p.mesh.geometry.attributes.position.array;
        for (let j = 0; j < p.vels.length / 3; j++) {
          positions[j * 3] += p.vels[j * 3] * deltaTime;
          positions[j * 3 + 1] += p.vels[j * 3 + 1] * deltaTime - 4 * deltaTime;
          positions[j * 3 + 2] += p.vels[j * 3 + 2] * deltaTime;
        }
        p.mesh.geometry.attributes.position.needsUpdate = true;
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  spawnTailParticle(pos) {
    const geo = new THREE.BufferGeometry();
    const posArr = new Float32Array([
      pos.x + (Math.random() - 0.5) * 3,
      pos.y + (Math.random() - 0.5) * 3,
      pos.z + (Math.random() - 0.5) * 3
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xff3b00,
      size: 4.0,
      map: this.particleTexture || null,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const tailP = new THREE.Points(geo, mat);
    this.scene.add(tailP);
    this.particles.push({ mesh: tailP, life: 1.0 });
  }
}
