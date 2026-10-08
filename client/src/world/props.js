import * as THREE from 'three';

export class PropsBuilder {
  constructor() {
    this.poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.5 });
    this.lampOffMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3 });
    this.woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    this.trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 });
    this.foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });
    this.foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
  }

  createStreetlight(x, z, rotationY = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotationY;

    // Pole
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.6, 8), this.poleMat);
    base.position.y = 0.3;
    group.add(base);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 6.5, 8), this.poleMat);
    pole.position.y = 3.55;
    pole.castShadow = true;
    group.add(pole);

    // Curved arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.4), this.poleMat);
    arm.position.set(0, 6.7, 0.6);
    group.add(arm);

    // Lantern Head
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.3, 8), this.poleMat);
    head.position.set(0, 6.6, 1.2);
    group.add(head);

    // Bulb / Glowing Glass
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xffd166,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bulbMat);
    bulb.position.set(0, 6.4, 1.2);
    group.add(bulb);

    // PointLight
    const light = new THREE.PointLight(0xffe8a3, 1.2, 18, 1.4);
    light.position.set(0, 6.2, 1.2);
    light.castShadow = false; // keep false on pointlights for high 60fps performance
    group.add(light);

    return {
      group,
      light,
      bulbMat,
      setLit: (isLit) => {
        light.intensity = isLit ? 1.2 : 0;
        bulbMat.emissiveIntensity = isLit ? 1.5 : 0;
      }
    };
  }

  createTrafficLight(x, z, rotationY = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotationY;

    // Mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 6, 8), this.poleMat);
    mast.position.y = 3;
    group.add(mast);

    // Arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 2.8), this.poleMat);
    arm.position.set(0, 5.8, 1.3);
    group.add(arm);

    // Housing Box
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.4), new THREE.MeshStandardMaterial({ color: 0x111827 }));
    box.position.set(0, 5.3, 2.5);
    group.add(box);

    // Lenses
    const redMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, emissive: 0xef4444, emissiveIntensity: 2.0 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0x713f12, emissive: 0xeab308, emissiveIntensity: 0.1 });
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, emissive: 0x10b981, emissiveIntensity: 0.1 });

    const redLens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8), redMat);
    redLens.rotation.x = Math.PI / 2;
    redLens.position.set(0, 5.7, 2.7);
    group.add(redLens);

    const yellowLens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8), yellowMat);
    yellowLens.rotation.x = Math.PI / 2;
    yellowLens.position.set(0, 5.3, 2.7);
    group.add(yellowLens);

    const greenLens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8), greenMat);
    greenLens.rotation.x = Math.PI / 2;
    greenLens.position.set(0, 4.9, 2.7);
    group.add(greenLens);

    let currentState = 'RED';

    return {
      group,
      getState: () => currentState,
      setState: (state) => {
        currentState = state;
        redMat.emissiveIntensity = state === 'RED' ? 2.0 : 0.1;
        yellowMat.emissiveIntensity = state === 'YELLOW' ? 2.0 : 0.1;
        greenMat.emissiveIntensity = state === 'GREEN' ? 2.0 : 0.1;
      }
    };
  }

  createTree(x, z, scale = 1) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.set(scale, scale, scale);

    // Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.2, 8), this.trunkMat);
    trunk.position.y = 1.1;
    trunk.castShadow = true;
    group.add(trunk);

    // Layered foliage
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.4, 7), this.foliageMat1);
    cone1.position.y = 2.8;
    cone1.castShadow = true;
    group.add(cone1);

    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.0, 7), this.foliageMat2);
    cone2.position.y = 4.0;
    cone2.castShadow = true;
    group.add(cone2);

    const cone3 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 7), this.foliageMat1);
    cone3.position.y = 5.0;
    cone3.castShadow = true;
    group.add(cone3);

    return group;
  }

  createParkFountain(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Stone Basin
    const basinMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.8, 0.8, 16), basinMat);
    basin.position.y = 0.4;
    basin.castShadow = true;
    basin.receiveShadow = true;
    group.add(basin);

    // Water Surface
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x0369a1,
      emissiveIntensity: 0.2
    });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.1, 16), waterMat);
    water.position.y = 0.75;
    group.add(water);

    // Center Spire
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, 2.5, 8), basinMat);
    spire.position.y = 1.8;
    group.add(spire);

    const upperBowl = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.2, 0.4, 12), basinMat);
    upperBowl.position.y = 2.8;
    group.add(upperBowl);

    return group;
  }

  createParkBench(x, z, rotationY = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotationY;

    // Legs
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.7), this.poleMat);
    leg1.position.set(-0.8, 0.25, 0);
    group.add(leg1);
    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.7), this.poleMat);
    leg2.position.set(0.8, 0.25, 0);
    group.add(leg2);

    // Wooden Slats
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.6), this.woodMat);
    seat.position.set(0, 0.5, 0);
    seat.castShadow = true;
    group.add(seat);

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.08), this.woodMat);
    backrest.position.set(0, 0.8, -0.28);
    backrest.castShadow = true;
    group.add(backrest);

    return group;
  }
}
