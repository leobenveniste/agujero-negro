import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { CelestialObject } from '../../types/blackhole';
import {
  createEarthTexture,
  createEarthCloudsTexture,
  createJupiterTexture,
  createSaturnTexture,
  createSaturnRingsTexture,
  createMarsTexture,
  createMoonTexture,
  createSunTexture,
} from '../../utils/celestialTextures';
import {
  AccretionDiskLensingShader,
  GravitationalLensingHaloShader,
} from './ScaleBlackHoleShader';

interface ScaleComparisonSceneProps {
  primaryObject: CelestialObject;
  secondaryObject: CelestialObject;
  scaleType?: 'real' | 'perceptual';
}

export const ScaleComparisonScene: React.FC<ScaleComparisonSceneProps> = ({
  primaryObject,
  secondaryObject,
  scaleType = 'real',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Smooth camera targets
  const targetCamPosRef = useRef(new THREE.Vector3(0, 3.0, 26.0));
  const targetLookAtRef = useRef(new THREE.Vector3(0, 1.8, 0));
  const currentLookAtRef = useRef(new THREE.Vector3(0, 1.8, 0));

  const isDraggingRef = useRef(false);
  const prevTouchRef = useRef({ x: 0, y: 0 });
  const prevPinchDistRef = useRef<number | null>(null);
  const sphericalRef = useRef(new THREE.Spherical(26.0, Math.PI / 2.35, 0.1));

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020308, 0.004);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.05, 5000);
    camera.position.set(0, 3.0, 26.0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x010204, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.touchAction = 'none'; // Critical for iPad multi-touch
    container.appendChild(renderer.domElement);

    // -------------------------------------------------------------
    // Starfield Background
    // -------------------------------------------------------------
    const starCount = 2200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 150 + Math.random() * 350;
      const th = Math.random() * 2 * Math.PI;
      const ph = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      starPos[i * 3 + 2] = r * Math.cos(ph);

      const colRand = Math.random();
      if (colRand > 0.8) {
        starColors[i * 3] = 0.6; starColors[i * 3 + 1] = 0.8; starColors[i * 3 + 2] = 1.0;
      } else if (colRand > 0.6) {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 0.6;
      } else {
        starColors[i * 3] = 0.9; starColors[i * 3 + 1] = 0.9; starColors[i * 3 + 2] = 0.95;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.9,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // -------------------------------------------------------------
    // REAL 1:1 vs PERCEPTUAL SCALE COMPUTATION
    // -------------------------------------------------------------
    const getEffectiveRadiusKm = (obj: CelestialObject) => {
      return obj.type === 'black_hole' ? (obj.schwarzschildRadiusKm ?? obj.radiusKm) : obj.radiusKm;
    };

    const r1 = getEffectiveRadiusKm(primaryObject);
    const r2 = getEffectiveRadiusKm(secondaryObject);
    const maxR = Math.max(r1, r2);
    const minR = Math.min(r1, r2);
    const ratio = maxR / Math.max(minR, 1e-9);

    let visualSize1: number;
    let visualSize2: number;

    const baseLargeSize = 2.8;

    if (scaleType === 'real') {
      // 1:1 REAL PHYSICAL SCALE
      const trueSmallSize = baseLargeSize / ratio;
      const clampedSmallSize = Math.max(0.015, trueSmallSize);

      if (r1 >= r2) {
        visualSize1 = baseLargeSize;
        visualSize2 = clampedSmallSize;
      } else {
        visualSize1 = clampedSmallSize;
        visualSize2 = baseLargeSize;
      }
    } else {
      // PERCEPTUAL CONTRAST SCALE
      const powerRatio = Math.pow(ratio, 0.5);
      const smallSize = Math.max(0.06, baseLargeSize / powerRatio);

      if (r1 >= r2) {
        visualSize1 = baseLargeSize;
        visualSize2 = smallSize;
      } else {
        visualSize1 = smallSize;
        visualSize2 = baseLargeSize;
      }
    }

    const dynamicObjects: {
      cloudsMesh?: THREE.Mesh;
      planetMesh?: THREE.Mesh;
      diskMat?: THREE.ShaderMaterial;
      lensMat?: THREE.ShaderMaterial;
      solarSystemGroup?: THREE.Group;
    }[] = [];

    // Helper: Pulsing locator beacon for microscopic objects in 1:1 scale
    const createLocatorBeacon = (radius: number, colorHex: number) => {
      const bGroup = new THREE.Group();
      const ringGeo = new THREE.RingGeometry(radius * 3.5, radius * 4.2, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      bGroup.add(new THREE.Mesh(ringGeo, ringMat));

      const crossGeo = new THREE.BufferGeometry();
      const s = radius * 5.0;
      const pts = [
        new THREE.Vector3(-s, 0, 0), new THREE.Vector3(s, 0, 0),
        new THREE.Vector3(0, -s, 0), new THREE.Vector3(0, s, 0),
      ];
      crossGeo.setFromPoints(pts);
      const crossMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.75,
      });
      bGroup.add(new THREE.LineSegments(crossGeo, crossMat));

      return bGroup;
    };

    // -------------------------------------------------------------
    // HIGH-FIDELITY OBJECT FACTORY
    // -------------------------------------------------------------
    const createObjectMesh = (obj: CelestialObject, visualRadius: number, isMicroscopic: boolean) => {
      const group = new THREE.Group();
      const dynEntry: (typeof dynamicObjects)[0] = {};

      if (obj.type === 'black_hole') {
        const horGeo = new THREE.SphereGeometry(visualRadius, 48, 48);
        const horMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        group.add(new THREE.Mesh(horGeo, horMat));

        const photonGeo = new THREE.RingGeometry(visualRadius * 1.002, visualRadius * 1.06, 64);
        const photonMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
        });
        group.add(new THREE.Mesh(photonGeo, photonMat));

        const lensGeo = new THREE.PlaneGeometry(visualRadius * 4.2, visualRadius * 4.2);
        const lensMat = new THREE.ShaderMaterial({
          vertexShader: GravitationalLensingHaloShader.vertexShader,
          fragmentShader: GravitationalLensingHaloShader.fragmentShader,
          uniforms: {
            uTime: { value: 0.0 },
            uRadius: { value: visualRadius },
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        });
        group.add(new THREE.Mesh(lensGeo, lensMat));
        dynEntry.lensMat = lensMat;

        const diskGeo = new THREE.PlaneGeometry(visualRadius * 7.6, visualRadius * 7.6);
        diskGeo.rotateX(Math.PI / 2.3);
        const diskMat = new THREE.ShaderMaterial({
          vertexShader: AccretionDiskLensingShader.vertexShader,
          fragmentShader: AccretionDiskLensingShader.fragmentShader,
          uniforms: {
            uTime: { value: 0.0 },
            uColor: { value: new THREE.Color(obj.color) },
            uDopplerStrength: { value: 1.0 },
            uInnerRadius: { value: visualRadius * 1.25 },
            uOuterRadius: { value: visualRadius * 3.6 },
          },
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        group.add(new THREE.Mesh(diskGeo, diskMat));
        dynEntry.diskMat = diskMat;

      } else if (obj.id === 'solar-system') {
        const sysGroup = new THREE.Group();

        const sunMarkerGeo = new THREE.SphereGeometry(Math.max(0.04, visualRadius * 0.06), 24, 24);
        const sunMarkerMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
        sysGroup.add(new THREE.Mesh(sunMarkerGeo, sunMarkerMat));

        const sunGlowGeo = new THREE.SphereGeometry(Math.max(0.08, visualRadius * 0.12), 24, 24);
        const sunGlowMat = new THREE.MeshBasicMaterial({
          color: 0xff8800,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
        });
        sysGroup.add(new THREE.Mesh(sunGlowGeo, sunGlowMat));

        const orbits = [
          { name: 'Mercurio', r: 0.12, col: 0x94a3b8, size: 0.018 },
          { name: 'Venus', r: 0.20, col: 0xf59e0b, size: 0.024 },
          { name: 'Tierra', r: 0.28, col: 0x3b82f6, size: 0.026 },
          { name: 'Marte', r: 0.38, col: 0xef4444, size: 0.022 },
          { name: 'Júpiter', r: 0.55, col: 0xd97706, size: 0.045 },
          { name: 'Saturno', r: 0.72, col: 0xeab308, size: 0.038, hasRings: true },
          { name: 'Urano', r: 0.86, col: 0x06b6d4, size: 0.030 },
          { name: 'Neptuno', r: 1.00, col: 0x2563eb, size: 0.030 },
        ];

        orbits.forEach((orb) => {
          const orbR = visualRadius * orb.r;

          const pts: THREE.Vector3[] = [];
          for (let a = 0; a <= 64; a++) {
            const angle = (a / 64) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(angle) * orbR, 0, Math.sin(angle) * orbR));
          }
          const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
          const lineMat = new THREE.LineBasicMaterial({
            color: orb.col,
            transparent: true,
            opacity: 0.4,
          });
          sysGroup.add(new THREE.Line(lineGeo, lineMat));

          const planetAngle = orb.r * 8.5;
          const pX = Math.cos(planetAngle) * orbR;
          const pZ = Math.sin(planetAngle) * orbR;

          const pGeo = new THREE.SphereGeometry(Math.max(0.015, visualRadius * orb.size), 16, 16);
          const pMat = new THREE.MeshBasicMaterial({ color: orb.col });
          const pMesh = new THREE.Mesh(pGeo, pMat);
          pMesh.position.set(pX, 0, pZ);
          sysGroup.add(pMesh);

          if (orb.hasRings) {
            const rGeo = new THREE.RingGeometry(visualRadius * orb.size * 1.4, visualRadius * orb.size * 2.4, 24);
            rGeo.rotateX(Math.PI / 2.5);
            const rMat = new THREE.MeshBasicMaterial({
              color: 0xd4be8f,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.7,
            });
            const rMesh = new THREE.Mesh(rGeo, rMat);
            rMesh.position.set(pX, 0, pZ);
            sysGroup.add(rMesh);
          }
        });

        // Kuiper Belt dust particle ring
        const beltCount = 350;
        const beltGeo = new THREE.BufferGeometry();
        const beltPos = new Float32Array(beltCount * 3);
        for (let b = 0; b < beltCount; b++) {
          const bAngle = Math.random() * Math.PI * 2;
          const bRadius = visualRadius * (0.95 + Math.random() * 0.15);
          beltPos[b * 3] = Math.cos(bAngle) * bRadius;
          beltPos[b * 3 + 1] = (Math.random() - 0.5) * visualRadius * 0.04;
          beltPos[b * 3 + 2] = Math.sin(bAngle) * bRadius;
        }
        beltGeo.setAttribute('position', new THREE.BufferAttribute(beltPos, 3));
        const beltMat = new THREE.PointsMaterial({
          color: 0x38bdf8,
          size: 0.035,
          transparent: true,
          opacity: 0.35,
        });
        sysGroup.add(new THREE.Points(beltGeo, beltMat));

        sysGroup.rotation.x = Math.PI / 4.5;
        group.add(sysGroup);
        dynEntry.solarSystemGroup = sysGroup;

      } else if (obj.id === 'sun') {
        const sunGeo = new THREE.SphereGeometry(visualRadius, 48, 48);
        const sunTex = createSunTexture();
        const sunMat = new THREE.MeshBasicMaterial({
          map: sunTex,
          color: 0xffffff,
        });
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);
        group.add(sunMesh);
        dynEntry.planetMesh = sunMesh;

        const coronaGeo = new THREE.SphereGeometry(visualRadius * 1.18, 36, 36);
        const coronaMat = new THREE.MeshBasicMaterial({
          color: 0xff9900,
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
        });
        group.add(new THREE.Mesh(coronaGeo, coronaMat));

        const outerGlowGeo = new THREE.SphereGeometry(visualRadius * 1.35, 32, 32);
        const outerGlowMat = new THREE.MeshBasicMaterial({
          color: 0xff5500,
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
        });
        group.add(new THREE.Mesh(outerGlowGeo, outerGlowMat));

      } else if (obj.id === 'earth') {
        const earthGeo = new THREE.SphereGeometry(visualRadius, 64, 64);
        const earthTex = createEarthTexture();
        const earthMat = new THREE.MeshStandardMaterial({
          map: earthTex,
          roughness: 0.55,
          metalness: 0.15,
        });
        const earthMesh = new THREE.Mesh(earthGeo, earthMat);
        group.add(earthMesh);
        dynEntry.planetMesh = earthMesh;

        const cloudsGeo = new THREE.SphereGeometry(visualRadius * 1.018, 48, 48);
        const cloudsTex = createEarthCloudsTexture();
        const cloudsMat = new THREE.MeshStandardMaterial({
          map: cloudsTex,
          transparent: true,
          opacity: 0.85,
          blending: THREE.NormalBlending,
        });
        const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
        group.add(cloudsMesh);
        dynEntry.cloudsMesh = cloudsMesh;

        const atmoGeo = new THREE.SphereGeometry(visualRadius * 1.08, 36, 36);
        const atmoMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.28,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
        });
        group.add(new THREE.Mesh(atmoGeo, atmoMat));

      } else if (obj.id === 'saturn') {
        const saturnGeo = new THREE.SphereGeometry(visualRadius, 48, 48);
        saturnGeo.scale(1.0, 0.91, 1.0);
        const saturnTex = createSaturnTexture();
        const saturnMat = new THREE.MeshStandardMaterial({
          map: saturnTex,
          roughness: 0.7,
        });
        const saturnMesh = new THREE.Mesh(saturnGeo, saturnMat);
        group.add(saturnMesh);
        dynEntry.planetMesh = saturnMesh;

        const ringGeo = new THREE.RingGeometry(visualRadius * 1.25, visualRadius * 2.45, 64);
        const ringTex = createSaturnRingsTexture();
        ringTex.rotation = Math.PI / 2;
        const ringMat = new THREE.MeshStandardMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95,
          roughness: 0.6,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2.35;
        ringMesh.rotation.y = 0.2;
        group.add(ringMesh);

      } else if (obj.id === 'jupiter') {
        const jupGeo = new THREE.SphereGeometry(visualRadius, 48, 48);
        jupGeo.scale(1.0, 0.935, 1.0);
        const jupTex = createJupiterTexture();
        const jupMat = new THREE.MeshStandardMaterial({
          map: jupTex,
          roughness: 0.65,
        });
        const jupMesh = new THREE.Mesh(jupGeo, jupMat);
        group.add(jupMesh);
        dynEntry.planetMesh = jupMesh;

        const jupGlow = new THREE.Mesh(
          new THREE.SphereGeometry(visualRadius * 1.05, 32, 32),
          new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
          })
        );
        group.add(jupGlow);

      } else if (obj.id === 'mars') {
        const marsGeo = new THREE.SphereGeometry(visualRadius, 48, 48);
        const marsTex = createMarsTexture();
        const marsMat = new THREE.MeshStandardMaterial({
          map: marsTex,
          roughness: 0.85,
        });
        const marsMesh = new THREE.Mesh(marsGeo, marsMat);
        group.add(marsMesh);
        dynEntry.planetMesh = marsMesh;

        const marsGlow = new THREE.Mesh(
          new THREE.SphereGeometry(visualRadius * 1.05, 32, 32),
          new THREE.MeshBasicMaterial({
            color: 0xef4444,
            transparent: true,
            opacity: 0.18,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
          })
        );
        group.add(marsGlow);

      } else {
        const moonGeo = new THREE.SphereGeometry(visualRadius, 48, 48);
        const moonTex = createMoonTexture();
        const moonMat = new THREE.MeshStandardMaterial({
          map: moonTex,
          roughness: 0.9,
        });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        group.add(moonMesh);
        dynEntry.planetMesh = moonMesh;
      }

      if (isMicroscopic) {
        group.add(createLocatorBeacon(visualRadius, 0xfacc15));
      }

      dynamicObjects.push(dynEntry);
      return group;
    };

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    sunLight.position.set(6, 8, 10);
    scene.add(sunLight);

    const backLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    backLight.position.set(-6, -4, -8);
    scene.add(backLight);

    // Build the two comparative bodies
    const isMicro1 = visualSize1 <= 0.08;
    const isMicro2 = visualSize2 <= 0.08;
    const group1 = createObjectMesh(primaryObject, visualSize1, isMicro1);
    const group2 = createObjectMesh(secondaryObject, visualSize2, isMicro2);

    // Height offset elevated to sit nicely above the bottom HUD card
    const yOffset = 2.0;

    // Spacing generously separated for optimal viewing
    const spacing = Math.max(7.0, (visualSize1 + visualSize2) * 0.8 + 2.0);

    const pos1 = new THREE.Vector3(-spacing / 2, yOffset, 0);
    const pos2 = new THREE.Vector3(spacing / 2, yOffset, 0);
    group1.position.copy(pos1);
    group2.position.copy(pos2);

    // Connecting scale line
    const linePoints = [
      new THREE.Vector3(-spacing / 2 + visualSize1 * 1.05, yOffset, 0),
      new THREE.Vector3(spacing / 2 - visualSize2 * 1.05, yOffset, 0),
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.25,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.6,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    line.computeLineDistances();
    scene.add(line);

    scene.add(group1);
    scene.add(group2);

    // -------------------------------------------------------------
    // CAMERA FRAMING: PULLED BACK FOR GENEROUS OVERVIEW
    // -------------------------------------------------------------
    targetLookAtRef.current.set(0, yOffset, 0);
    const maxSpan = spacing + Math.max(visualSize1, visualSize2);
    // Generously pull back camera (alejar los elementos)
    const initCamDist = Math.max(22.0, maxSpan * 1.7);
    sphericalRef.current.radius = initCamDist;
    sphericalRef.current.phi = Math.PI / 2.35;
    sphericalRef.current.theta = 0.05;

    const initOffset = new THREE.Vector3().setFromSpherical(sphericalRef.current);
    targetCamPosRef.current.copy(targetLookAtRef.current).add(initOffset);
    camera.position.copy(targetCamPosRef.current);
    camera.lookAt(targetLookAtRef.current);

    // -------------------------------------------------------------
    // MOUSE & IPAD/TABLET MULTI-TOUCH CONTROLS (ORBIT & PINCH-ZOOM)
    // -------------------------------------------------------------
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevTouchRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevTouchRef.current.x;
      const dy = e.clientY - prevTouchRef.current.y;
      prevTouchRef.current = { x: e.clientX, y: e.clientY };

      sphericalRef.current.theta -= dx * 0.005;
      sphericalRef.current.phi -= dy * 0.005;
      sphericalRef.current.phi = Math.max(0.08, Math.min(Math.PI - 0.08, sphericalRef.current.phi));

      const offset = new THREE.Vector3().setFromSpherical(sphericalRef.current);
      targetCamPosRef.current.copy(targetLookAtRef.current).add(offset);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = sphericalRef.current.radius > 10.0 ? 0.02 : 0.008;
      sphericalRef.current.radius += e.deltaY * zoomFactor;
      sphericalRef.current.radius = Math.max(0.1, Math.min(120.0, sphericalRef.current.radius));
      const offset = new THREE.Vector3().setFromSpherical(sphericalRef.current);
      targetCamPosRef.current.copy(targetLookAtRef.current).add(offset);
    };

    // Multi-touch gestures for iPad & touch devices
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        prevPinchDistRef.current = null;
      } else if (e.touches.length === 2) {
        isDraggingRef.current = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        prevPinchDistRef.current = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Stop iPad bounce/page scroll
      if (e.touches.length === 1 && isDraggingRef.current) {
        const dx = e.touches[0].clientX - prevTouchRef.current.x;
        const dy = e.touches[0].clientY - prevTouchRef.current.y;
        prevTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        sphericalRef.current.theta -= dx * 0.006;
        sphericalRef.current.phi -= dy * 0.006;
        sphericalRef.current.phi = Math.max(0.08, Math.min(Math.PI - 0.08, sphericalRef.current.phi));

        const offset = new THREE.Vector3().setFromSpherical(sphericalRef.current);
        targetCamPosRef.current.copy(targetLookAtRef.current).add(offset);
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);

        if (prevPinchDistRef.current !== null) {
          const pinchDelta = prevPinchDistRef.current - currentDist;
          sphericalRef.current.radius += pinchDelta * 0.05;
          sphericalRef.current.radius = Math.max(0.1, Math.min(120.0, sphericalRef.current.radius));
          const offset = new THREE.Vector3().setFromSpherical(sphericalRef.current);
          targetCamPosRef.current.copy(targetLookAtRef.current).add(offset);
        }
        prevPinchDistRef.current = currentDist;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        prevTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        isDraggingRef.current = true;
        prevPinchDistRef.current = null;
      } else if (e.touches.length === 0) {
        isDraggingRef.current = false;
        prevPinchDistRef.current = null;
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    dom.addEventListener('touchstart', onTouchStart, { passive: false });
    dom.addEventListener('touchmove', onTouchMove, { passive: false });
    dom.addEventListener('touchend', onTouchEnd);
    dom.addEventListener('touchcancel', onTouchEnd);

    const onResize = () => {
      if (!mountRef.current || !renderer) return;
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // -------------------------------------------------------------
    // ANIMATION LOOP
    // -------------------------------------------------------------
    let prevTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - prevTime) / 1000, 0.1);
      prevTime = time;
      const t = time * 0.001;

      // Smooth camera interpolation
      camera.position.lerp(targetCamPosRef.current, dt * 6.0);
      currentLookAtRef.current.lerp(targetLookAtRef.current, dt * 6.0);
      camera.lookAt(currentLookAtRef.current);

      dynamicObjects.forEach((dyn) => {
        if (dyn.planetMesh) dyn.planetMesh.rotation.y += dt * 0.3;
        if (dyn.cloudsMesh) dyn.cloudsMesh.rotation.y += dt * 0.38;
        if (dyn.diskMat) dyn.diskMat.uniforms.uTime.value = t;
        if (dyn.lensMat) dyn.lensMat.uniforms.uTime.value = t;
        if (dyn.solarSystemGroup) dyn.solarSystemGroup.rotation.y += dt * 0.15;
      });

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);

      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      dom.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('resize', onResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [primaryObject, secondaryObject, scaleType]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: 'none' }}
    />
  );
};
