import * as THREE from 'three';

export class Environment {
  constructor(scene, dirLight, ambientLight, cityBuilder, cycleMinutes = 12) {
    this.scene = scene;
    this.dirLight = dirLight;
    this.ambientLight = ambientLight;
    this.cityBuilder = cityBuilder;

    this.cycleMinutes = cycleMinutes;
    this.currentHour = 12.0; // Start at bright noon
    this.isNight = false;
    this.isFrozen = false; // Can freeze time for sunny daylight stream

    // Hemisphere light for vibrant sky/ground bounce
    this.hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x334155, 0.7);
    this.scene.add(this.hemiLight);

    // Initial evaluation
    this.updateLighting();
  }

  update(deltaTime) {
    if (this.isFrozen) return;

    // 24 hours in cycleMinutes * 60 seconds
    const hoursPerSecond = 24 / (this.cycleMinutes * 60);
    this.currentHour = (this.currentHour + deltaTime * hoursPerSecond) % 24;

    this.updateLighting();
  }

  setTime(hour) {
    this.currentHour = (hour % 24 + 24) % 24;
    this.updateLighting();
  }

  toggleFreeze() {
    this.isFrozen = !this.isFrozen;
    return this.isFrozen;
  }

  getTime() {
    return this.currentHour;
  }

  getFormattedTime() {
    const totalMinutes = Math.floor(this.currentHour * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  updateLighting() {
    const hour = this.currentHour;
    const shouldBeNight = hour >= 18.5 || hour < 5.5;

    if (shouldBeNight !== this.isNight) {
      this.isNight = shouldBeNight;
      if (this.cityBuilder && this.cityBuilder.setNightLights) {
        this.cityBuilder.setNightLights(this.isNight);
      }
    }

    // Solar / Lunar angle calculation: 0 = midnight, 12 = noon
    const angle = ((hour - 6) / 24) * Math.PI * 2;
    const radius = 110;
    const sunX = Math.cos(angle) * radius;
    const sunY = Math.sin(angle) * radius;
    const sunZ = 50;

    this.dirLight.position.set(sunX, Math.max(sunY, 25), sunZ);

    if (hour >= 6 && hour < 17) {
      // Full Vibrant Daylight (Bright & Clear)
      this.dirLight.color.setHex(0xfff3d6);
      this.dirLight.intensity = 1.45;
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 0.55;
      this.hemiLight.color.setHex(0x7dd3fc);
      this.hemiLight.groundColor.setHex(0x475569);
      this.scene.background = new THREE.Color('#38bdf8');
      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color('#38bdf8');
        this.scene.fog.density = 0.0035;
      }
    } else if (hour >= 17 && hour < 18.5) {
      // Golden Sunset / Dusk
      this.dirLight.color.setHex(0xf97316);
      this.dirLight.intensity = 1.2;
      this.ambientLight.color.setHex(0xfb7185);
      this.ambientLight.intensity = 0.45;
      this.scene.background = new THREE.Color('#b45309');
      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color('#b45309');
        this.scene.fog.density = 0.004;
      }
    } else if (hour >= 18.5 || hour < 5.5) {
      // Luminous Cyberpunk Urban Night (Rich Indigo & Moonlight, NEVER black!)
      this.dirLight.color.setHex(0x93c5fd);
      this.dirLight.intensity = 0.75;
      this.ambientLight.color.setHex(0x38bdf8);
      this.ambientLight.intensity = 0.45;
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.scene.background = new THREE.Color('#0f172a');
      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color('#0f172a');
        this.scene.fog.density = 0.004;
      }
    } else {
      // Dawn / Sunrise
      this.dirLight.color.setHex(0xfdba74);
      this.dirLight.intensity = 1.1;
      this.ambientLight.color.setHex(0xf472b6);
      this.ambientLight.intensity = 0.45;
      this.scene.background = new THREE.Color('#86198f');
      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color('#86198f');
        this.scene.fog.density = 0.004;
      }
    }
  }
}
