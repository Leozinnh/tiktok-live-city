import * as THREE from 'three';
import { BuildingBuilder } from './buildings.js';
import { PropsBuilder } from './props.js';
import { PathGraph } from '../simulation/pathfinding.js';

export class CityBuilder {
  constructor(scene) {
    this.scene = scene;
    this.buildingBuilder = new BuildingBuilder();
    this.propsBuilder = new PropsBuilder();
    this.pathGraph = new PathGraph();

    this.cityGroup = new THREE.Group();
    this.buildings = [];
    this.streetLights = [];
    this.trafficLights = [];

    this.asphaltMat = new THREE.MeshStandardMaterial({ color: 0x181e28, roughness: 0.85 });
    this.sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
    this.curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
    this.grassMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    this.laneLineYellow = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    this.laneLineWhite = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  }

  generate() {
    this.buildRoadNetwork();
    this.buildCityBlocks();
    this.buildCentralPark();
    this.buildStreetFurniture();
    this.buildPathGraphNodes();

    this.scene.add(this.cityGroup);

    return {
      cityGroup: this.cityGroup,
      buildings: this.buildings,
      streetLights: this.streetLights,
      trafficLights: this.trafficLights,
      pathGraph: this.pathGraph
    };
  }

  buildRoadNetwork() {
    // Grand Asphalt Foundation (300 x 300 meters)
    const baseGeo = new THREE.PlaneGeometry(300, 300);
    const baseMesh = new THREE.Mesh(baseGeo, this.asphaltMat);
    baseMesh.rotation.x = -Math.PI / 2;
    baseMesh.position.y = -0.05;
    baseMesh.receiveShadow = true;
    this.cityGroup.add(baseMesh);

    // Main Central EW Avenue (Z = 0)
    const aveEW = new THREE.Mesh(new THREE.PlaneGeometry(240, 14), this.asphaltMat);
    aveEW.rotation.x = -Math.PI / 2;
    aveEW.position.set(0, 0, 0);
    aveEW.receiveShadow = true;
    this.cityGroup.add(aveEW);

    // Main Central NS Avenue (X = 0)
    const aveNS = new THREE.Mesh(new THREE.PlaneGeometry(14, 240), this.asphaltMat);
    aveNS.rotation.x = -Math.PI / 2;
    aveNS.position.set(0, 0.01, 0);
    aveNS.receiveShadow = true;
    this.cityGroup.add(aveNS);

    // North Boulevard (Z = -45)
    const roadNorth = new THREE.Mesh(new THREE.PlaneGeometry(240, 12), this.asphaltMat);
    roadNorth.rotation.x = -Math.PI / 2;
    roadNorth.position.set(0, 0, -45);
    this.cityGroup.add(roadNorth);

    // South Boulevard (Z = 45)
    const roadSouth = new THREE.Mesh(new THREE.PlaneGeometry(240, 12), this.asphaltMat);
    roadSouth.rotation.x = -Math.PI / 2;
    roadSouth.position.set(0, 0, 45);
    this.cityGroup.add(roadSouth);

    // West Boulevard (X = -45)
    const roadWest = new THREE.Mesh(new THREE.PlaneGeometry(12, 240), this.asphaltMat);
    roadWest.rotation.x = -Math.PI / 2;
    roadWest.position.set(-45, 0, 0);
    this.cityGroup.add(roadWest);

    // East Boulevard (X = 45)
    const roadEast = new THREE.Mesh(new THREE.PlaneGeometry(12, 240), this.asphaltMat);
    roadEast.rotation.x = -Math.PI / 2;
    roadEast.position.set(45, 0, 0);
    this.cityGroup.add(roadEast);

    this.createRoadStripes();
  }

  createRoadStripes() {
    // Yellow double center line on Main EW Avenue
    const ewYellow = new THREE.Mesh(new THREE.PlaneGeometry(230, 0.25), this.laneLineYellow);
    ewYellow.rotation.x = -Math.PI / 2;
    ewYellow.position.set(0, 0.03, 0);
    this.cityGroup.add(ewYellow);

    // Yellow double center line on Main NS Avenue
    const nsYellow = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 230), this.laneLineYellow);
    nsYellow.rotation.x = -Math.PI / 2;
    nsYellow.position.set(0, 0.035, 0);
    this.cityGroup.add(nsYellow);

    // Crosswalks around central intersection
    const makeCrosswalk = (cx, cz, isHorizontal) => {
      const group = new THREE.Group();
      const count = 7;
      for (let i = -3; i <= 3; i++) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(isHorizontal ? 3.5 : 0.8, isHorizontal ? 0.8 : 3.5), this.laneLineWhite);
        stripe.rotation.x = -Math.PI / 2;
        if (isHorizontal) {
          stripe.position.set(0, 0.04, i * 1.5);
        } else {
          stripe.position.set(i * 1.5, 0.04, 0);
        }
        group.add(stripe);
      }
      group.position.set(cx, 0, cz);
      this.cityGroup.add(group);
    };

    makeCrosswalk(0, -9, true);
    makeCrosswalk(0, 9, true);
    makeCrosswalk(-9, 0, false);
    makeCrosswalk(9, 0, false);
  }

  buildCityBlocks() {
    const createSidewalkBlock = (bx, bz, bw, bd) => {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.3, bd), this.curbMat);
      curb.position.set(bx, 0.15, bz);
      curb.receiveShadow = true;
      this.cityGroup.add(curb);

      const surface = new THREE.Mesh(new THREE.BoxGeometry(bw - 0.4, 0.32, bd - 0.4), this.sidewalkMat);
      surface.position.set(bx, 0.16, bz);
      surface.receiveShadow = true;
      this.cityGroup.add(surface);
    };

    // ==========================================
    // SECTOR 1 (NW): Financial & Corporate Skyscrapers
    // ==========================================
    createSidewalkBlock(-24, -24, 32, 32);
    const bank = this.buildingBuilder.createBank(-24, -28);
    this.cityGroup.add(bank.group);
    this.buildings.push(bank);

    const skyscraper = this.buildingBuilder.createSkyscraper(-24, -14, 52, 0x0284c7);
    this.cityGroup.add(skyscraper.group);
    this.buildings.push(skyscraper);

    // ==========================================
    // SECTOR 2 (N): Commercial Mall & Plaza
    // ==========================================
    createSidewalkBlock(-24, -65, 32, 24);
    const mall = this.buildingBuilder.createShoppingMall(-24, -65);
    this.cityGroup.add(mall.group);
    this.buildings.push(mall);

    // ==========================================
    // SECTOR 3 (NE): Luxury Tech District & Townhouses
    // ==========================================
    createSidewalkBlock(24, -65, 32, 24);
    const townhouses = this.buildingBuilder.createTownhouseBlock(24, -65);
    this.cityGroup.add(townhouses.group);
    this.buildings.push(townhouses);

    // ==========================================
    // SECTOR 4 (W): Civic Center (Police & Hospital)
    // ==========================================
    createSidewalkBlock(-24, 24, 32, 32);
    const police = this.buildingBuilder.createPoliceStation(-24, 16);
    this.cityGroup.add(police.group);
    this.buildings.push(police);

    const hospital = this.buildingBuilder.createHospital(-24, 30);
    this.cityGroup.add(hospital.group);
    this.buildings.push(hospital);

    // ==========================================
    // SECTOR 5 (SE): Gas Station & Commercial Strip
    // ==========================================
    createSidewalkBlock(24, 24, 32, 32);
    const gasStation = this.buildingBuilder.createGasStation(24, 18);
    this.cityGroup.add(gasStation.group);
    this.buildings.push(gasStation);

    const restaurant = this.buildingBuilder.createRestaurant(24, 31);
    this.cityGroup.add(restaurant.group);
    this.buildings.push(restaurant);

    // ==========================================
    // SECTOR 6 (S): Entertainment Boulevard
    // ==========================================
    createSidewalkBlock(-24, 65, 32, 24);
    const bistroSouth = this.buildingBuilder.createRestaurant(-24, 65);
    this.cityGroup.add(bistroSouth.group);
    this.buildings.push(bistroSouth);

    // ==========================================
    // SECTOR 7 (Far East): Metropolitan Skyline Towers
    // ==========================================
    createSidewalkBlock(65, 0, 24, 60);
    const towerA = this.buildingBuilder.createApartmentTower(65, -16, 44, 0x3b82f6);
    const towerB = this.buildingBuilder.createApartmentTower(65, 16, 38, 0x8b5cf6);
    this.cityGroup.add(towerA.group, towerB.group);
    this.buildings.push(towerA, towerB);

    // Distant Backdrop Towers (At X = 92 and X = -92, far outside all roads)
    const sky1 = this.buildingBuilder.createSkyscraper(92, -35, 60, 0x0369a1);
    const sky2 = this.buildingBuilder.createApartmentTower(92, 35, 48, 0x7c3aed);
    const sky3 = this.buildingBuilder.createSkyscraper(-92, -35, 54, 0x0284c7);
    const sky4 = this.buildingBuilder.createApartmentTower(-92, 35, 42, 0x059669);
    this.cityGroup.add(sky1.group, sky2.group, sky3.group, sky4.group);
    this.buildings.push(sky1, sky2, sky3, sky4);
  }

  buildCentralPark() {
    // Grand Central Park (Quarter NE, X=24, Z=-24, size: 32x32m)
    const parkX = 24;
    const parkZ = -24;
    const pw = 32;
    const pd = 32;

    const border = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.3, pd), this.curbMat);
    border.position.set(parkX, 0.15, parkZ);
    this.cityGroup.add(border);

    const lawn = new THREE.Mesh(new THREE.BoxGeometry(pw - 1.5, 0.32, pd - 1.5), this.grassMat);
    lawn.position.set(parkX, 0.16, parkZ);
    lawn.receiveShadow = true;
    this.cityGroup.add(lawn);

    const fountain = this.propsBuilder.createParkFountain(parkX, parkZ);
    this.cityGroup.add(fountain);

    const b1 = this.propsBuilder.createParkBench(parkX, parkZ + 7, 0);
    const b2 = this.propsBuilder.createParkBench(parkX, parkZ - 7, Math.PI);
    const b3 = this.propsBuilder.createParkBench(parkX + 7, parkZ, -Math.PI / 2);
    const b4 = this.propsBuilder.createParkBench(parkX - 7, parkZ, Math.PI / 2);
    this.cityGroup.add(b1, b2, b3, b4);

    const treePositions = [
      [-10, -10], [10, -10], [-10, 10], [10, 10],
      [-5, -12], [5, -12], [-12, -4], [12, -4],
      [-12, 6], [12, 6], [-5, 12], [5, 12],
      [-13, -13], [13, -13], [-13, 13], [13, 13]
    ];

    treePositions.forEach(([ox, oz], i) => {
      const tree = this.propsBuilder.createTree(parkX + ox, parkZ + oz, 0.85 + (i % 3) * 0.15);
      this.cityGroup.add(tree);
    });

    this.buildings.push({
      id: 'bldg_park',
      name: 'Praça Central da Liberdade',
      type: 'park',
      entrance: new THREE.Vector3(parkX, 0, parkZ + 12),
      windowMaterials: []
    });
  }

  buildStreetFurniture() {
    // 24 Streetlights placed along all avenues
    const lightPositions = [
      { x: -8, z: -8, r: Math.PI / 4 },
      { x: 8, z: -8, r: (3 * Math.PI) / 4 },
      { x: -8, z: 8, r: -Math.PI / 4 },
      { x: 8, z: 8, r: -(3 * Math.PI) / 4 },
      { x: -35, z: -8, r: 0 },
      { x: -35, z: 8, r: Math.PI },
      { x: 35, z: -8, r: 0 },
      { x: 35, z: 8, r: Math.PI },
      { x: -60, z: -8, r: 0 },
      { x: -60, z: 8, r: Math.PI },
      { x: 60, z: -8, r: 0 },
      { x: 60, z: 8, r: Math.PI },
      { x: -8, z: -35, r: Math.PI / 2 },
      { x: 8, z: -35, r: -Math.PI / 2 },
      { x: -8, z: 35, r: Math.PI / 2 },
      { x: 8, z: 35, r: -Math.PI / 2 },
      { x: -8, z: -60, r: Math.PI / 2 },
      { x: 8, z: -60, r: -Math.PI / 2 },
      { x: -8, z: 60, r: Math.PI / 2 },
      { x: 8, z: 60, r: -Math.PI / 2 }
    ];

    lightPositions.forEach(pos => {
      const sl = this.propsBuilder.createStreetlight(pos.x, pos.z, pos.r);
      this.cityGroup.add(sl.group);
      this.streetLights.push(sl);
    });

    // Central 4-way traffic lights
    const tl1 = this.propsBuilder.createTrafficLight(-8, -8, 0);
    const tl2 = this.propsBuilder.createTrafficLight(8, -8, -Math.PI / 2);
    const tl3 = this.propsBuilder.createTrafficLight(8, 8, Math.PI);
    const tl4 = this.propsBuilder.createTrafficLight(-8, 8, Math.PI / 2);

    this.cityGroup.add(tl1.group, tl2.group, tl3.group, tl4.group);
    this.trafficLights.push(tl1, tl2, tl3, tl4);
  }

  buildPathGraphNodes() {
    const g = this.pathGraph;
    g.roadNodes = [];
    g.sidewalkNodes = [];

    // ==========================================
    // 1. SISTEMA VIÁRIO (Circuitos Longos e Avenidas)
    // ==========================================
    // EW Avenue - Eastbound lane (z = 3.5, moving +X)
    g.addRoadNode('r_ew_e_start', -80, 3.5, ['r_ew_e_stop']);
    g.addRoadNode('r_ew_e_stop', -12, 3.5, ['r_ew_e_cross'], true);
    g.addRoadNode('r_ew_e_cross', 12, 3.5, ['r_ew_e_end']);
    g.addRoadNode('r_ew_e_end', 75, 3.5, ['r_turn_se']);

    // Loop SE -> South outer road (Z = 45) -> Turn SW
    g.addRoadNode('r_turn_se', 75, 45, ['r_south_outer_w']);
    g.addRoadNode('r_south_outer_w', -75, 45, ['r_turn_sw']);
    g.addRoadNode('r_turn_sw', -75, 3.5, ['r_ew_e_start']);

    // EW Avenue - Westbound lane (z = -3.5, moving -X)
    g.addRoadNode('r_ew_w_start', 75, -3.5, ['r_ew_w_stop']);
    g.addRoadNode('r_ew_w_stop', 12, -3.5, ['r_ew_w_cross'], true);
    g.addRoadNode('r_ew_w_cross', -12, -3.5, ['r_ew_w_end']);
    g.addRoadNode('r_ew_w_end', -75, -3.5, ['r_turn_nw']);

    // Loop NW -> North outer road (Z = -45) -> Turn NE
    g.addRoadNode('r_turn_nw', -75, -45, ['r_north_outer_e']);
    g.addRoadNode('r_north_outer_e', 75, -45, ['r_turn_ne']);
    g.addRoadNode('r_turn_ne', 75, -3.5, ['r_ew_w_start']);

    // NS Avenue - Southbound lane (x = 3.5, moving +Z)
    g.addRoadNode('r_ns_s_start', 3.5, -75, ['r_ns_s_stop']);
    g.addRoadNode('r_ns_s_stop', 3.5, -12, ['r_ns_s_cross'], true);
    g.addRoadNode('r_ns_s_cross', 3.5, 12, ['r_ns_s_end']);
    g.addRoadNode('r_ns_s_end', 3.5, 75, ['r_turn_se']);

    // NS Avenue - Northbound lane (x = -3.5, moving -Z)
    g.addRoadNode('r_ns_n_start', -3.5, 75, ['r_ns_n_stop']);
    g.addRoadNode('r_ns_n_stop', -3.5, 12, ['r_ns_n_cross'], true);
    g.addRoadNode('r_ns_n_cross', -3.5, -12, ['r_ns_n_end']);
    g.addRoadNode('r_ns_n_end', -3.5, -75, ['r_turn_nw']);

    // ==========================================
    // 2. CALÇADAS E CAMINHOS DE PEDESTRES (SEM ATRAVESSAR PRÉDIOS)
    // ==========================================
    // Quarteirão A (Noroeste - Banco e Arranha-Céu)
    g.addSidewalkNode('sw_a_corner_in', -9, -9);
    g.addSidewalkNode('sw_a_bank_door', -24, -9);
    g.addSidewalkNode('sw_a_corner_w', -39, -9);
    g.addSidewalkNode('sw_a_sky_door', -39, -24);
    g.addSidewalkNode('sw_a_corner_nw', -39, -39);
    g.addSidewalkNode('sw_a_mid_n', -24, -39);
    g.addSidewalkNode('sw_a_corner_ne', -9, -39);
    g.addSidewalkNode('sw_a_mid_e', -9, -24);

    g.connectSidewalkNodes('sw_a_corner_in', 'sw_a_bank_door');
    g.connectSidewalkNodes('sw_a_bank_door', 'sw_a_corner_w');
    g.connectSidewalkNodes('sw_a_corner_w', 'sw_a_sky_door');
    g.connectSidewalkNodes('sw_a_sky_door', 'sw_a_corner_nw');
    g.connectSidewalkNodes('sw_a_corner_nw', 'sw_a_mid_n');
    g.connectSidewalkNodes('sw_a_mid_n', 'sw_a_corner_ne');
    g.connectSidewalkNodes('sw_a_corner_ne', 'sw_a_mid_e');
    g.connectSidewalkNodes('sw_a_mid_e', 'sw_a_corner_in');

    // Quarteirão B (Nordeste - Praça Central e Parque)
    g.addSidewalkNode('sw_b_corner_in', 9, -9);
    g.addSidewalkNode('sw_b_mid_s', 24, -9);
    g.addSidewalkNode('sw_b_corner_e', 39, -9);
    g.addSidewalkNode('sw_b_mid_e', 39, -24);
    g.addSidewalkNode('sw_b_corner_ne', 39, -39);
    g.addSidewalkNode('sw_b_mid_n', 24, -39);
    g.addSidewalkNode('sw_b_corner_nw', 9, -39);
    g.addSidewalkNode('sw_b_mid_w', 9, -24);
    g.addSidewalkNode('sw_b_fountain', 24, -24);

    g.connectSidewalkNodes('sw_b_corner_in', 'sw_b_mid_s');
    g.connectSidewalkNodes('sw_b_mid_s', 'sw_b_corner_e');
    g.connectSidewalkNodes('sw_b_corner_e', 'sw_b_mid_e');
    g.connectSidewalkNodes('sw_b_mid_e', 'sw_b_corner_ne');
    g.connectSidewalkNodes('sw_b_corner_ne', 'sw_b_mid_n');
    g.connectSidewalkNodes('sw_b_mid_n', 'sw_b_corner_nw');
    g.connectSidewalkNodes('sw_b_corner_nw', 'sw_b_mid_w');
    g.connectSidewalkNodes('sw_b_mid_w', 'sw_b_corner_in');
    g.connectSidewalkNodes('sw_b_mid_s', 'sw_b_fountain');
    g.connectSidewalkNodes('sw_b_mid_e', 'sw_b_fountain');
    g.connectSidewalkNodes('sw_b_mid_n', 'sw_b_fountain');
    g.connectSidewalkNodes('sw_b_mid_w', 'sw_b_fountain');

    // Quarteirão C (Sudoeste - Delegacia e Hospital)
    g.addSidewalkNode('sw_c_corner_in', -9, 9);
    g.addSidewalkNode('sw_c_police_door', -24, 9);
    g.addSidewalkNode('sw_c_corner_w', -39, 9);
    g.addSidewalkNode('sw_c_hospital_door', -39, 24);
    g.addSidewalkNode('sw_c_corner_sw', -39, 39);
    g.addSidewalkNode('sw_c_mid_s', -24, 39);
    g.addSidewalkNode('sw_c_corner_se', -9, 39);
    g.addSidewalkNode('sw_c_mid_e', -9, 24);

    g.connectSidewalkNodes('sw_c_corner_in', 'sw_c_police_door');
    g.connectSidewalkNodes('sw_c_police_door', 'sw_c_corner_w');
    g.connectSidewalkNodes('sw_c_corner_w', 'sw_c_hospital_door');
    g.connectSidewalkNodes('sw_c_hospital_door', 'sw_c_corner_sw');
    g.connectSidewalkNodes('sw_c_corner_sw', 'sw_c_mid_s');
    g.connectSidewalkNodes('sw_c_mid_s', 'sw_c_corner_se');
    g.connectSidewalkNodes('sw_c_corner_se', 'sw_c_mid_e');
    g.connectSidewalkNodes('sw_c_mid_e', 'sw_c_corner_in');

    // Quarteirão D (Sudeste - Posto de Combustível e Restaurante)
    g.addSidewalkNode('sw_d_corner_in', 9, 9);
    g.addSidewalkNode('sw_d_gas_door', 24, 9);
    g.addSidewalkNode('sw_d_corner_e', 39, 9);
    g.addSidewalkNode('sw_d_bistro_door', 39, 24);
    g.addSidewalkNode('sw_d_corner_se', 39, 39);
    g.addSidewalkNode('sw_d_mid_s', 24, 39);
    g.addSidewalkNode('sw_d_corner_sw', 9, 39);
    g.addSidewalkNode('sw_d_mid_w', 9, 24);

    g.connectSidewalkNodes('sw_d_corner_in', 'sw_d_gas_door');
    g.connectSidewalkNodes('sw_d_gas_door', 'sw_d_corner_e');
    g.connectSidewalkNodes('sw_d_corner_e', 'sw_d_bistro_door');
    g.connectSidewalkNodes('sw_d_bistro_door', 'sw_d_corner_se');
    g.connectSidewalkNodes('sw_d_corner_se', 'sw_d_mid_s');
    g.connectSidewalkNodes('sw_d_mid_s', 'sw_d_corner_sw');
    g.connectSidewalkNodes('sw_d_corner_sw', 'sw_d_mid_w');
    g.connectSidewalkNodes('sw_d_mid_w', 'sw_d_corner_in');

    // Faixas de Pedestres do Cruzamento Central
    g.connectSidewalkNodes('sw_a_corner_in', 'sw_c_corner_in');
    g.connectSidewalkNodes('sw_b_corner_in', 'sw_d_corner_in');
    g.connectSidewalkNodes('sw_a_corner_in', 'sw_b_corner_in');
    g.connectSidewalkNodes('sw_c_corner_in', 'sw_d_corner_in');
  }

  update(deltaTime) {
    if (!this.trafficTimer) this.trafficTimer = 0;
    this.trafficTimer += deltaTime;

    const cycle = Math.floor(this.trafficTimer % 26);
    let stateEW, stateNS;

    if (cycle < 10) {
      stateEW = 'GREEN';
      stateNS = 'RED';
    } else if (cycle < 13) {
      stateEW = 'YELLOW';
      stateNS = 'RED';
    } else if (cycle < 23) {
      stateEW = 'RED';
      stateNS = 'GREEN';
    } else {
      stateEW = 'RED';
      stateNS = 'YELLOW';
    }

    if (this.trafficLights.length >= 4) {
      this.trafficLights[0].setState(stateEW);
      this.trafficLights[2].setState(stateEW);
      this.trafficLights[1].setState(stateNS);
      this.trafficLights[3].setState(stateNS);
    }
  }

  setNightLights(isNight) {
    this.streetLights.forEach(sl => sl.setLit(isNight));

    this.buildings.forEach(b => {
      if (b.windowMaterials) {
        b.windowMaterials.forEach(mat => {
          mat.emissiveIntensity = isNight ? 1.0 : 0.15;
        });
      }
    });
  }
}
