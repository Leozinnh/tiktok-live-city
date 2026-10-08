import * as THREE from 'three';

export class BuildingBuilder {
  constructor() {
    this.sharedMaterials = {
      concreteDark: new THREE.MeshStandardMaterial({ color: 0x2b3342, roughness: 0.8 }),
      concreteLight: new THREE.MeshStandardMaterial({ color: 0xd8dee9, roughness: 0.7 }),
      brickWarm: new THREE.MeshStandardMaterial({ color: 0x9a4f38, roughness: 0.85 }),
      glassNavy: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.8 }),
      roofGrey: new THREE.MeshStandardMaterial({ color: 0x1e2430, roughness: 0.9 }),
      goldTrim: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.7 }),
      asphalt: new THREE.MeshStandardMaterial({ color: 0x181e29, roughness: 0.9 }),
      sidewalk: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.75 })
    };
  }

  createWindowMaterial(emissiveColor = 0xffe099, emissiveIntensity = 0.8) {
    return new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      metalness: 0.5,
      emissive: new THREE.Color(emissiveColor),
      emissiveIntensity: emissiveIntensity
    });
  }

  createApartmentTower(x, z, height = 28, color = 0x3b82f6) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const windowMat = this.createWindowMaterial(0xffdf80, 0.7);

    // Main tower body
    const towerGeo = new THREE.BoxGeometry(14, height, 14);
    const towerMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = height / 2;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    // Window bands
    const floors = Math.floor(height / 3.5);
    for (let f = 1; f < floors; f++) {
      const y = f * 3.5;
      const winGeo = new THREE.BoxGeometry(14.2, 1.2, 10);
      const winMesh = new THREE.Mesh(winGeo, windowMat);
      winMesh.position.y = y;
      group.add(winMesh);

      const winGeo2 = new THREE.BoxGeometry(10, 1.2, 14.2);
      const winMesh2 = new THREE.Mesh(winGeo2, windowMat);
      winMesh2.position.y = y;
      group.add(winMesh2);
    }

    // Roof equipment (HVAC & antenna)
    const roofBox = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, 6), this.sharedMaterials.roofGrey);
    roofBox.position.y = height + 1.25;
    group.add(roofBox);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 6), this.sharedMaterials.goldTrim);
    antenna.position.set(0, height + 5.5, 0);
    group.add(antenna);

    return {
      group,
      id: `bldg_apt_${x}_${z}`,
      name: 'Residencial Aurora',
      type: 'residence',
      entrance: new THREE.Vector3(x, 0, z + 8),
      windowMaterials: [windowMat]
    };
  }

  createBank(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const windowMat = this.createWindowMaterial(0xfef08a, 0.9);

    // Main Bank Building
    const baseGeo = new THREE.BoxGeometry(18, 14, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 7;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Front Classical Pillars
    const colMat = this.sharedMaterials.concreteLight;
    for (let i = -6; i <= 6; i += 4) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 10, 12), colMat);
      col.position.set(i, 5, 8.5);
      col.castShadow = true;
      group.add(col);
    }

    // Golden Bank Sign
    const signGeo = new THREE.BoxGeometry(12, 1.8, 0.6);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 11, 8.6);
    group.add(sign);

    // Glass Double Doors
    const door = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 0.4), windowMat);
    door.position.set(0, 2, 8.3);
    group.add(door);

    return {
      group,
      id: 'bldg_bank',
      name: 'Banco Central NPC',
      type: 'bank',
      entrance: new THREE.Vector3(x, 0, z + 9),
      windowMaterials: [windowMat]
    };
  }

  createPoliceStation(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const windowMat = this.createWindowMaterial(0x60a5fa, 0.8);

    // Main Police Building
    const body = new THREE.Mesh(new THREE.BoxGeometry(16, 12, 16), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 }));
    body.position.y = 6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Blue Emissive Police Sign & Beacon
    const sign = new THREE.Mesh(new THREE.BoxGeometry(10, 1.5, 0.5), new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x3b82f6,
      emissiveIntensity: 1.2
    }));
    sign.position.set(0, 9.5, 8.3);
    group.add(sign);

    // Blue Roof Flasher
    const flasher = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.8), new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x2563eb,
      emissiveIntensity: 2.0
    }));
    flasher.position.set(0, 12.5, 0);
    group.add(flasher);

    // Windows
    for (let y = 3; y <= 8; y += 4) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(16.2, 1.4, 10), windowMat);
      win.position.y = y;
      group.add(win);
    }

    return {
      group,
      id: 'bldg_police',
      name: 'Delegacia de Polícia',
      type: 'police',
      entrance: new THREE.Vector3(x, 0, z + 9),
      windowMaterials: [windowMat]
    };
  }

  createHospital(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const windowMat = this.createWindowMaterial(0x93c5fd, 0.8);

    // Main Hospital Wing
    const mainWing = new THREE.Mesh(new THREE.BoxGeometry(20, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 }));
    mainWing.position.y = 8;
    mainWing.castShadow = true;
    mainWing.receiveShadow = true;
    group.add(mainWing);

    // Glowing Red Medical Cross
    const crossGroup = new THREE.Group();
    const crossMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 1.5 });
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.2, 0.3), crossMat);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.8, 0.3), crossMat);
    crossGroup.add(crossV);
    crossGroup.add(crossH);
    crossGroup.position.set(0, 12, 8.2);
    group.add(crossGroup);

    // Rooftop Helipad
    const helipad = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.4, 24), this.sharedMaterials.roofGrey);
    helipad.position.set(0, 16.2, 0);
    group.add(helipad);

    const helipadRing = new THREE.Mesh(new THREE.RingGeometry(3.8, 4.3, 24), new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide }));
    helipadRing.rotation.x = -Math.PI / 2;
    helipadRing.position.set(0, 16.42, 0);
    group.add(helipadRing);

    return {
      group,
      id: 'bldg_hospital',
      name: 'Hospital Geral Municipal',
      type: 'hospital',
      entrance: new THREE.Vector3(x, 0, z + 9),
      windowMaterials: [windowMat]
    };
  }

  createGasStation(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Canopy
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(16, 1, 12), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 }));
    canopy.position.set(0, 5.5, 0);
    canopy.castShadow = true;
    group.add(canopy);

    // Neon edge trim
    const neonEdge = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.25, 12.2), new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.8
    }));
    neonEdge.position.set(0, 5.5, 0);
    group.add(neonEdge);

    // Canopy Support Pillars
    const colMat = this.sharedMaterials.concreteDark;
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5), colMat);
    p1.position.set(-6, 2.5, -4);
    group.add(p1);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5), colMat);
    p2.position.set(6, 2.5, -4);
    group.add(p2);

    // Fuel Pumps
    for (let p = -4; p <= 4; p += 8) {
      const pump = new THREE.Mesh(new THREE.BoxGeometry(1, 2.2, 1.6), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      pump.position.set(p, 1.1, 0);
      pump.castShadow = true;
      group.add(pump);
    }

    // Convenience Store behind
    const storeWindowMat = this.createWindowMaterial(0xfef08a, 0.9);
    const store = new THREE.Mesh(new THREE.BoxGeometry(14, 4.5, 6), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    store.position.set(0, 2.25, -7.5);
    store.castShadow = true;
    group.add(store);

    const storeGlass = new THREE.Mesh(new THREE.BoxGeometry(10, 2.5, 0.3), storeWindowMat);
    storeGlass.position.set(0, 2, -4.3);
    group.add(storeGlass);

    return {
      group,
      id: 'bldg_gas_station',
      name: 'Posto Estrela',
      type: 'shop',
      entrance: new THREE.Vector3(x, 0, z + 2),
      windowMaterials: [storeWindowMat]
    };
  }

  createRestaurant(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const windowMat = this.createWindowMaterial(0xfbbf24, 0.85);

    // Cafe building
    const cafe = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 12), new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.8 }));
    cafe.position.y = 3;
    cafe.castShadow = true;
    cafe.receiveShadow = true;
    group.add(cafe);

    // Striped Awning
    const awning = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 2.5), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    awning.position.set(0, 4, 6.5);
    awning.rotation.x = 0.2;
    group.add(awning);

    // Large storefront glass
    const glass = new THREE.Mesh(new THREE.BoxGeometry(9, 2.6, 0.3), windowMat);
    glass.position.set(0, 2, 6.1);
    group.add(glass);

    return {
      group,
      id: 'bldg_restaurant',
      name: 'Bistrô & Café Central',
      type: 'restaurant',
      entrance: new THREE.Vector3(x, 0, z + 7),
      windowMaterials: [windowMat]
    };
  }

  createSkyscraper(x, z, height = 52, color = 0x0369a1) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const windowMat = this.createWindowMaterial(0x38bdf8, 1.2);

    // Tower base
    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 16), this.sharedMaterials.concreteDark);
    baseMesh.position.y = 4;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // Glass tower shaft
    const shaftGeo = new THREE.BoxGeometry(13, height - 8, 13);
    const shaftMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.1,
      metalness: 0.85
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = (height - 8) / 2 + 8;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    // Vertical neon glow fins
    const finMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.5
    });
    const fin1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, height - 6, 13.4), finMat);
    fin1.position.y = height / 2 + 4;
    group.add(fin1);
    const fin2 = new THREE.Mesh(new THREE.BoxGeometry(13.4, height - 6, 0.3), finMat);
    fin2.position.y = height / 2 + 4;
    group.add(fin2);

    // Rooftop Spire
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.8, 14, 8), this.sharedMaterials.goldTrim);
    spire.position.y = height + 7;
    group.add(spire);

    // Beacon Light
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    beacon.position.y = height + 14;
    group.add(beacon);

    return {
      group,
      id: `bldg_skyscraper_${x}_${z}`,
      name: 'Torre Metropolitan',
      type: 'bank',
      entrance: new THREE.Vector3(x, 0, z + 9),
      windowMaterials: [windowMat, finMat]
    };
  }

  createShoppingMall(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const windowMat = this.createWindowMaterial(0xfef08a, 1.0);

    // Mall body
    const body = new THREE.Mesh(new THREE.BoxGeometry(26, 14, 20), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }));
    body.position.y = 7;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Large glass atrium
    const atrium = new THREE.Mesh(new THREE.BoxGeometry(18, 10, 2), windowMat);
    atrium.position.set(0, 6, 10.2);
    group.add(atrium);

    // Electronic Billboard
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0xd946ef,
      emissive: 0xc084fc,
      emissiveIntensity: 2.2
    });
    const screen = new THREE.Mesh(new THREE.BoxGeometry(14, 4, 0.3), screenMat);
    screen.position.set(0, 11, 10.3);
    group.add(screen);

    return {
      group,
      id: `bldg_mall_${x}_${z}`,
      name: 'Shopping Plaza Central',
      type: 'shop',
      entrance: new THREE.Vector3(x, 0, z + 11),
      windowMaterials: [windowMat, screenMat]
    };
  }

  createTownhouseBlock(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const windowMat = this.createWindowMaterial(0xffdf80, 0.7);

    // Row of 3 modern brownstones
    for (let i = -1; i <= 1; i++) {
      const colors = [0x9a3412, 0x475569, 0x78350f];
      const house = new THREE.Mesh(
        new THREE.BoxGeometry(7.5, 12, 14),
        new THREE.MeshStandardMaterial({ color: colors[i + 1], roughness: 0.8 })
      );
      house.position.set(i * 8, 6, 0);
      house.castShadow = true;
      house.receiveShadow = true;
      group.add(house);

      // Windows
      for (let y = 3; y <= 9; y += 3) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.4, 0.3), windowMat);
        win.position.set(i * 8, y, 7.2);
        group.add(win);
      }
    }

    return {
      group,
      id: `bldg_townhouse_${x}_${z}`,
      name: 'Residencial Boulevard',
      type: 'residence',
      entrance: new THREE.Vector3(x, 0, z + 8),
      windowMaterials: [windowMat]
    };
  }
}
