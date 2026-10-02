import * as THREE from 'three';

export interface SpaceshipController {
  group: THREE.Group;
  trailPoints: THREE.Points;
  orbitLine: THREE.Line;
  update: (simTime: number, dt: number) => void;
  getPosition: () => THREE.Vector3;
  dispose: () => void;
}

export function createSpaceship(): SpaceshipController {
  const group = new THREE.Group();
  group.name = 'Spaceship';

  // Materials
  const hullWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.35,
    roughness: 0.25,
  });

  const hullDarkMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.3,
  });

  const cockpitMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0284c7,
    emissiveIntensity: 0.8,
    metalness: 0.9,
    roughness: 0.1,
  });

  const solarPanelMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x1e3a8a,
    emissiveIntensity: 0.35,
    metalness: 0.85,
    roughness: 0.2,
  });

  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    emissive: 0xb45309,
    emissiveIntensity: 0.35,
    metalness: 0.9,
    roughness: 0.2,
  });

  const thrusterGlowMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.9,
  });

  const innerFlameMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
  });

  // 1. Central Fuselage / Command Module (Lifting body shape)
  // Forward nose cone
  const noseGeo = new THREE.ConeGeometry(0.24, 0.65, 6);
  noseGeo.rotateX(Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, hullWhiteMat);
  nose.position.set(0, 0, 0.48);
  group.add(nose);

  // Cockpit canopy visor
  const canopyGeo = new THREE.BoxGeometry(0.18, 0.09, 0.28);
  const canopy = new THREE.Mesh(canopyGeo, cockpitMat);
  canopy.position.set(0, 0.1, 0.38);
  group.add(canopy);

  // Main Body / Avionics Hull
  const bodyGeo = new THREE.BoxGeometry(0.46, 0.24, 0.85);
  const body = new THREE.Mesh(bodyGeo, hullWhiteMat);
  body.position.set(0, 0, -0.05);
  group.add(body);

  // Thermal heat-shield belly (dark tiles on bottom)
  const bellyGeo = new THREE.BoxGeometry(0.48, 0.04, 0.95);
  const belly = new THREE.Mesh(bellyGeo, hullDarkMat);
  belly.position.set(0, -0.12, 0.0);
  group.add(belly);

  // 2. Rotating Habitat Ring (Interstellar-inspired modular ring)
  const ringGroup = new THREE.Group();
  ringGroup.position.set(0, 0, -0.1);
  group.add(ringGroup);

  const ringGeo = new THREE.TorusGeometry(0.72, 0.05, 8, 24);
  const ring = new THREE.Mesh(ringGeo, hullWhiteMat);
  ringGroup.add(ring);

  // 6 habitat pods spaced evenly around the ring
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const podGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.2, 8);
    podGeo.rotateZ(Math.PI / 2);
    const pod = new THREE.Mesh(podGeo, i % 2 === 0 ? hullWhiteMat : goldFoilMat);
    pod.position.set(Math.cos(angle) * 0.72, Math.sin(angle) * 0.72, 0);
    ringGroup.add(pod);

    // Spokes connecting hub to pods
    const spokeGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.72, 6);
    spokeGeo.rotateZ(angle + Math.PI / 2);
    const spoke = new THREE.Mesh(spokeGeo, hullDarkMat);
    spoke.position.set((Math.cos(angle) * 0.72) / 2, (Math.sin(angle) * 0.72) / 2, 0);
    ringGroup.add(spoke);
  }

  // 3. Solar & Radiator Array Wings
  const wingSpan = 0.65;
  const leftWingGeo = new THREE.BoxGeometry(wingSpan, 0.02, 0.4);
  const leftWing = new THREE.Mesh(leftWingGeo, solarPanelMat);
  leftWing.position.set(-(0.23 + wingSpan / 2), 0, -0.1);
  group.add(leftWing);

  const rightWingGeo = new THREE.BoxGeometry(wingSpan, 0.02, 0.4);
  const rightWing = new THREE.Mesh(rightWingGeo, solarPanelMat);
  rightWing.position.set(0.23 + wingSpan / 2, 0, -0.1);
  group.add(rightWing);

  // 4. Twin Ion Engines (Aft)
  const engineFlames: THREE.Mesh[] = [];

  [-0.15, 0.15].forEach((xOffset) => {
    // Engine Bell Nozzle
    const nozzleGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.32, 12);
    nozzleGeo.rotateX(Math.PI / 2);
    const nozzle = new THREE.Mesh(nozzleGeo, hullDarkMat);
    nozzle.position.set(xOffset, 0, -0.58);
    group.add(nozzle);

    // Outer Plasma Glow Cone
    const flameGeo = new THREE.ConeGeometry(0.09, 0.5, 12);
    flameGeo.rotateX(-Math.PI / 2);
    const flame = new THREE.Mesh(flameGeo, thrusterGlowMat);
    flame.position.set(xOffset, 0, -0.92);
    group.add(flame);
    engineFlames.push(flame);

    // Inner Hot Core
    const innerGeo = new THREE.ConeGeometry(0.045, 0.3, 8);
    innerGeo.rotateX(-Math.PI / 2);
    const inner = new THREE.Mesh(innerGeo, innerFlameMat);
    inner.position.set(xOffset, 0, -0.8);
    group.add(inner);
  });

  // 5. Engine Local PointLight (illuminates rear of ship)
  const engineLight = new THREE.PointLight(0x38bdf8, 2.0, 7.0);
  engineLight.position.set(0, 0, -0.9);
  group.add(engineLight);

  // 6. Navigation Strobe Beacons
  const beaconWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const beaconWhite = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), beaconWhiteMat);
  beaconWhite.position.set(0, 0.16, -0.32);
  group.add(beaconWhite);

  const beaconRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const beaconRed = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), beaconRedMat);
  beaconRed.position.set(-(0.23 + wingSpan), 0.02, -0.1);
  group.add(beaconRed);

  const beaconGreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const beaconGreen = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), beaconGreenMat);
  beaconGreen.position.set(0.23 + wingSpan, 0.02, -0.1);
  group.add(beaconGreen);

  // 7. Glowing Ion Exhaust Trail (Particle Points in World Space)
  const TRAIL_COUNT = 90;
  const trailPositions = new Float32Array(TRAIL_COUNT * 3);
  const trailColors = new Float32Array(TRAIL_COUNT * 3);

  // Initialize off-screen
  for (let i = 0; i < TRAIL_COUNT; i++) {
    trailPositions[i * 3] = 0;
    trailPositions[i * 3 + 1] = 0;
    trailPositions[i * 3 + 2] = 0;

    const alpha = 1.0 - i / TRAIL_COUNT;
    trailColors[i * 3] = 0.2 + 0.3 * alpha;
    trailColors[i * 3 + 1] = 0.7 + 0.3 * alpha;
    trailColors[i * 3 + 2] = 1.0;
  }

  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
  trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));

  const trailMat = new THREE.PointsMaterial({
    size: 0.22,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const trailPoints = new THREE.Points(trailGeo, trailMat);
  trailPoints.frustumCulled = false;

  // Trail history ring buffer
  const history: THREE.Vector3[] = [];
  for (let i = 0; i < TRAIL_COUNT; i++) {
    history.push(new THREE.Vector3(0, 0, 0));
  }

  // 8. Orbital Parameters & Trajectory Line
  // Radius ~10.8 places the ship right in the majestic viewing sweet-spot above the accretion disk
  const ORBIT_RADIUS = 10.8;
  const ORBIT_SPEED = 0.16; // radians per second (~39s per orbit)
  const INCLINATION = 0.35; // ~20 degrees inclination relative to accretion disk
  const ASCENDING_NODE = 0.52; // rotation in horizontal plane

  function calculateOrbitPosition(time: number, out: THREE.Vector3): THREE.Vector3 {
    const theta = time * ORBIT_SPEED;
    const x0 = Math.cos(theta) * ORBIT_RADIUS;
    const z0 = Math.sin(theta) * ORBIT_RADIUS;
    const y0 = Math.sin(theta) * (ORBIT_RADIUS * Math.sin(INCLINATION));

    const cosNode = Math.cos(ASCENDING_NODE);
    const sinNode = Math.sin(ASCENDING_NODE);
    const x = x0 * cosNode - z0 * sinNode;
    const z = x0 * sinNode + z0 * cosNode;
    const y = y0;

    out.set(x, y, z);
    return out;
  }

  // Construct Faint Glowing Orbit Path Line
  const ORBIT_SEGMENTS = 128;
  const orbitPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= ORBIT_SEGMENTS; i++) {
    const t = (i / ORBIT_SEGMENTS) * ((Math.PI * 2) / ORBIT_SPEED);
    const pt = new THREE.Vector3();
    calculateOrbitPosition(t, pt);
    orbitPoints.push(pt);
  }

  const orbitLineGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitLineMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const orbitLine = new THREE.Line(orbitLineGeo, orbitLineMat);
  orbitLine.frustumCulled = false;

  const currentPos = new THREE.Vector3();
  const nextPos = new THREE.Vector3();
  const forwardDir = new THREE.Vector3();
  const rotMatrix = new THREE.Matrix4();

  let trailTimer = 0;
  let isInitialized = false;

  const update = (simTime: number, dt: number) => {
    // 1. Calculate Orbit Position and Forward Velocity Tangent
    calculateOrbitPosition(simTime, currentPos);
    calculateOrbitPosition(simTime + 0.05, nextPos);

    forwardDir.subVectors(nextPos, currentPos).normalize();

    group.position.copy(currentPos);

    // 2. Orient Spaceship: Nose forward along forwardDir (+Z in model space)
    // Inward banking toward black hole center
    const toCenter = new THREE.Vector3().copy(currentPos).negate().normalize();
    const bankUp = new THREE.Vector3().crossVectors(forwardDir, toCenter).normalize();
    bankUp.lerp(toCenter, 0.25).normalize();

    rotMatrix.lookAt(new THREE.Vector3(0, 0, 0), forwardDir, bankUp);
    group.quaternion.setFromRotationMatrix(rotMatrix);

    // 3. Spin Habitat Ring slowly
    ringGroup.rotation.z += dt * 0.8;

    // 4. Thruster Flame Flicker
    const flicker = 0.9 + Math.sin(simTime * 35.0) * 0.15 + Math.cos(simTime * 50.0) * 0.08;
    engineFlames.forEach((flame) => {
      flame.scale.set(1.0, 1.0, flicker);
    });
    engineLight.intensity = 1.8 * flicker;

    // 5. Strobe Nav Beacon
    const strobe = (Math.floor(simTime * 2.5) % 2 === 0);
    beaconWhiteMat.color.setHex(strobe ? 0xffffff : 0x222222);

    // 6. Update Exhaust Trail Particles in World Space
    const aftOffset = new THREE.Vector3(0, 0, -1.0).applyQuaternion(group.quaternion);
    const aftPos = new THREE.Vector3().copy(currentPos).add(aftOffset);

    if (!isInitialized) {
      isInitialized = true;
      for (let i = 0; i < TRAIL_COUNT; i++) {
        history[i].copy(aftPos);
      }
    }

    trailTimer += dt;
    if (trailTimer >= 0.02) {
      trailTimer = 0;
      history.unshift(new THREE.Vector3().copy(aftPos));
      history.pop();

      const posAttr = trailGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < TRAIL_COUNT; i++) {
        const p = history[i];
        posAttr.setXYZ(i, p.x, p.y, p.z);
      }
      posAttr.needsUpdate = true;
    }
  };

  const getPosition = () => {
    return group.position;
  };

  const dispose = () => {
    noseGeo.dispose();
    canopyGeo.dispose();
    bodyGeo.dispose();
    bellyGeo.dispose();
    ringGeo.dispose();
    leftWingGeo.dispose();
    rightWingGeo.dispose();
    trailGeo.dispose();
    orbitLineGeo.dispose();

    hullWhiteMat.dispose();
    hullDarkMat.dispose();
    cockpitMat.dispose();
    solarPanelMat.dispose();
    goldFoilMat.dispose();
    thrusterGlowMat.dispose();
    innerFlameMat.dispose();
    trailMat.dispose();
    orbitLineMat.dispose();
    beaconWhiteMat.dispose();
    beaconRedMat.dispose();
    beaconGreenMat.dispose();
  };

  return {
    group,
    trailPoints,
    orbitLine,
    update,
    getPosition,
    dispose,
  };
}
