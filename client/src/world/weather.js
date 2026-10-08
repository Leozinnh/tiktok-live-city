import * as THREE from 'three';

export class Weather {
  constructor(scene, dirLight, ambientLight) {
    this.scene = scene;
    this.dirLight = dirLight;
    this.ambientLight = ambientLight;

    this.type = 'CLEAR'; // 'CLEAR', 'RAIN', 'STORM', 'FOG'
    this.onLightningCallback = null;

    // Rain Particle System (Pre-allocated pool of 1600 drops)
    this.rainCount = 1600;
    this.rainGeo = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainCount * 3);
    this.rainVelocities = new Float32Array(this.rainCount);

    for (let i = 0; i < this.rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 160;
      this.rainPositions[i * 3 + 1] = Math.random() * 60 + 5;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 160;
      this.rainVelocities[i] = Math.random() * 25 + 35;
    }

    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    this.rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.38,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    this.rainPoints = new THREE.Points(this.rainGeo, this.rainMat);
    this.scene.add(this.rainPoints);

    // Lightning Flash Timer
    this.lightningTimer = 0;
    this.isFlashing = false;
  }

  setWeather(weatherType) {
    const norm = String(weatherType || '').toUpperCase().replace(/^WEATHER_/, '');
    if (['CLEAR', 'RAIN', 'STORM', 'FOG'].includes(norm)) {
      this.type = norm;
    } else {
      this.type = 'CLEAR';
    }

    if (this.type === 'RAIN' || this.type === 'STORM') {
      this.rainMat.opacity = this.type === 'STORM' ? 0.85 : 0.6;
    } else {
      this.rainMat.opacity = 0;
    }

    if (this.scene.fog) {
      if (this.type === 'FOG') {
        this.scene.fog.density = 0.025;
      } else if (this.type === 'STORM') {
        this.scene.fog.density = 0.012;
      } else {
        this.scene.fog.density = 0.006;
      }
    }
  }

  getWeather() {
    return this.type;
  }

  getWeatherLabel() {
    switch (this.type) {
      case 'RAIN': return 'Chuva';
      case 'STORM': return 'Tempestade';
      case 'FOG': return 'Neblina';
      default: return 'Ensolarado';
    }
  }

  update(deltaTime) {
    if (this.type === 'RAIN' || this.type === 'STORM') {
      const positions = this.rainGeo.attributes.position.array;
      const speedMult = this.type === 'STORM' ? 1.4 : 1.0;

      for (let i = 0; i < this.rainCount; i++) {
        // Fall down with slight wind angle
        positions[i * 3 + 1] -= this.rainVelocities[i] * speedMult * deltaTime;
        positions[i * 3] += 4 * deltaTime; // wind X drift

        // Recycle to sky when hitting ground
        if (positions[i * 3 + 1] <= 0) {
          positions[i * 3 + 1] = 60 + Math.random() * 10;
          positions[i * 3] = (Math.random() - 0.5) * 160;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 160;
        }
      }

      this.rainGeo.attributes.position.needsUpdate = true;
    }

    // Procedural Lightning in Storms
    if (this.type === 'STORM') {
      this.lightningTimer += deltaTime;
      if (this.lightningTimer > 4.5 && Math.random() < 0.03 && !this.isFlashing) {
        this.triggerLightningFlash();
      }
    }
  }

  triggerLightningFlash() {
    this.isFlashing = true;
    this.lightningTimer = 0;

    const originalSunIntensity = this.dirLight.intensity;
    const originalAmbIntensity = this.ambientLight.intensity;

    this.dirLight.intensity = 3.8;
    this.dirLight.color.setHex(0xffffff);
    this.ambientLight.intensity = 2.0;

    if (this.onLightningCallback) {
      this.onLightningCallback();
    }

    setTimeout(() => {
      this.dirLight.intensity = originalSunIntensity;
      this.ambientLight.intensity = originalAmbIntensity;
      this.isFlashing = false;
    }, 90);
  }
}
