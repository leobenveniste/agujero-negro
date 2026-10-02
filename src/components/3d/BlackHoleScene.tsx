import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RaytracedBlackHoleShader } from './RaytracedBlackHoleShader';
import { createSpaceship } from './Spaceship';
import type { AnatomyPart } from '../../types/blackhole';

interface BlackHoleSceneProps {
  selectedPart: AnatomyPart | null;
  onSelectPart?: (part: AnatomyPart | null) => void;
}

export const BlackHoleScene: React.FC<BlackHoleSceneProps> = ({
  selectedPart,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const raytraceUniformsRef = useRef<{ [key: string]: THREE.IUniform } | null>(null);

  // Camera coordinates (distance 20 matches Dan Greenheck's optimal scale)
  const targetCamPosRef = useRef(new THREE.Vector3(0, 4.0, 20.0));
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAtRef = useRef(new THREE.Vector3(0, 0, 0));

  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const prevPinchDistRef = useRef<number | null>(null);
  const sphericalRef = useRef(new THREE.Spherical(20.0, Math.PI / 2.3, 0.2));

  const selectedPartRef = useRef(selectedPart);

  // Focus camera smoothly when an anatomical part is selected
  useEffect(() => {
    selectedPartRef.current = selectedPart;
    if (selectedPart && selectedPart.id !== 'spaceship') {
      const scale = 3.6;
      targetCamPosRef.current.set(
        selectedPart.cameraPosition[0] * scale,
        selectedPart.cameraPosition[1] * scale,
        selectedPart.cameraPosition[2] * scale
      );
      targetLookAtRef.current.set(
        selectedPart.cameraTarget[0] * scale,
        selectedPart.cameraTarget[1] * scale,
        selectedPart.cameraTarget[2] * scale
      );
      sphericalRef.current.setFromVector3(targetCamPosRef.current);
    } else if (!selectedPart) {
      targetCamPosRef.current.set(0, 4.0, 20.0);
      targetLookAtRef.current.set(0, 0, 0);
      sphericalRef.current.setFromVector3(targetCamPosRef.current);
    }
  }, [selectedPart]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 4.0, 20.0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      depth: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.domElement.style.touchAction = 'none'; // Critical for iPad/iOS touch gesture control
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // -------------------------------------------------------------
    // FULLSCREEN RELATIVISTIC RAYTRACER QUAD
    // -------------------------------------------------------------
    const raytraceUniforms = {
      uResolution: { value: new THREE.Vector2(width, height) },
      uTime: { value: 0.0 },
      uCameraPos: { value: camera.position },
      uCameraTarget: { value: currentLookAtRef.current },
      uBlackHoleMass: { value: 0.4 }, // rs = 0.8 in simulation units
      uGravitationalLensing: { value: 2.4 }, // Always visible
      uStepSize: { value: 1.0 },
      uShowDisk: { value: true }, // Always visible
      uDiskInnerRadius: { value: 4.1 },
      uDiskOuterRadius: { value: 14.5 },
      uDiskTemperature: { value: 49.78 },
      uTemperatureFalloff: { value: 5.22 },
      uDiskBrightness: { value: 5.0 },
      uDiskRotationSpeed: { value: -8.7 },
      uDopplerStrength: { value: 1.0 }, // Doppler beaming is permanently enabled
      uDiskEdgeSoftInner: { value: 0.18 },
      uDiskEdgeSoftOuter: { value: 0.50 },
      uTurbulenceScale: { value: 1.81 },
      uTurbulenceStretch: { value: 0.75 },
      uTurbulenceSharpness: { value: 7.4 },
      uTurbulenceCycleTime: { value: 5.0 },
      uTurbulenceLacunarity: { value: 2.5 },
      uTurbulencePersistence: { value: 0.8 },
      uStarsEnabled: { value: true },
      uStarDensity: { value: 0.1 },
      uStarSize: { value: 1.2 },
      uStarBrightness: { value: 0.1 },
      uNebulaEnabled: { value: true },
      uNebula1Scale: { value: 2.0 },
      uNebula1Density: { value: 0.5 },
      uNebula1Brightness: { value: 0.01 },
      uNebula1Color: { value: new THREE.Color(0x071f44) },
      uNebula2Scale: { value: 5.5 },
      uNebula2Density: { value: 0.05 },
      uNebula2Brightness: { value: 0.21 },
      uNebula2Color: { value: new THREE.Color(0x010615) },
    };
    raytraceUniformsRef.current = raytraceUniforms;

    const quadGeo = new THREE.PlaneGeometry(2, 2);
    const raytraceMat = new THREE.ShaderMaterial({
      vertexShader: RaytracedBlackHoleShader.vertexShader,
      fragmentShader: RaytracedBlackHoleShader.fragmentShader,
      uniforms: raytraceUniforms,
      depthWrite: false,
      depthTest: false,
    });

    const raytraceMesh = new THREE.Mesh(quadGeo, raytraceMat);
    raytraceMesh.frustumCulled = false;
    raytraceMesh.renderOrder = -100;
    scene.add(raytraceMesh);

    // -------------------------------------------------------------
    // LIGHTS FOR 3D OBJECTS (SPACESHIP & ILLUMINATION)
    // -------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Warm radial light from the relativistic accretion disk
    const diskLight = new THREE.DirectionalLight(0xffaa44, 2.5);
    diskLight.position.set(0, 3.0, 0);
    scene.add(diskLight);

    // Cold stellar rim light
    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.2);
    rimLight.position.set(0, -4.0, 10.0);
    scene.add(rimLight);

    // -------------------------------------------------------------
    // SCI-FI SPACESHIP ORBITING THE BLACK HOLE
    // -------------------------------------------------------------
    const spaceship = createSpaceship();
    scene.add(spaceship.orbitLine);
    scene.add(spaceship.trailPoints);
    scene.add(spaceship.group);

    // -------------------------------------------------------------
    // MOUSE & IPAD/TABLET MULTI-TOUCH CONTROLS (ORBIT & PINCH-ZOOM)
    // -------------------------------------------------------------
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - prevPointerRef.current.x;
      const deltaY = e.clientY - prevPointerRef.current.y;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };

      const rotateSpeed = 0.005;
      sphericalRef.current.theta -= deltaX * rotateSpeed;
      sphericalRef.current.phi -= deltaY * rotateSpeed;

      const minPhi = 0.05;
      const maxPhi = Math.PI - 0.05;
      sphericalRef.current.phi = Math.max(minPhi, Math.min(maxPhi, sphericalRef.current.phi));
      targetCamPosRef.current.setFromSpherical(sphericalRef.current);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.002;
      sphericalRef.current.radius += e.deltaY * zoomSpeed * sphericalRef.current.radius * 0.15;
      sphericalRef.current.radius = Math.max(5.0, Math.min(50.0, sphericalRef.current.radius));
      targetCamPosRef.current.setFromSpherical(sphericalRef.current);
    };

    // Touch Event Handlers with 1-finger orbit & 2-finger pinch-zoom for iPad / mobile
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevPointerRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        prevPinchDistRef.current = null;
      } else if (e.touches.length === 2) {
        isDraggingRef.current = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        prevPinchDistRef.current = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent iPad scroll/pinch-zoom of the web page
      if (e.touches.length === 1 && isDraggingRef.current) {
        const deltaX = e.touches[0].clientX - prevPointerRef.current.x;
        const deltaY = e.touches[0].clientY - prevPointerRef.current.y;
        prevPointerRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        const rotateSpeed = 0.006;
        sphericalRef.current.theta -= deltaX * rotateSpeed;
        sphericalRef.current.phi -= deltaY * rotateSpeed;

        const minPhi = 0.05;
        const maxPhi = Math.PI - 0.05;
        sphericalRef.current.phi = Math.max(minPhi, Math.min(maxPhi, sphericalRef.current.phi));
        targetCamPosRef.current.setFromSpherical(sphericalRef.current);
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);

        if (prevPinchDistRef.current !== null) {
          const pinchDelta = prevPinchDistRef.current - currentDist;
          sphericalRef.current.radius += pinchDelta * 0.05;
          sphericalRef.current.radius = Math.max(5.0, Math.min(50.0, sphericalRef.current.radius));
          targetCamPosRef.current.setFromSpherical(sphericalRef.current);
        }
        prevPinchDistRef.current = currentDist;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        prevPointerRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
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

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      if (raytraceUniformsRef.current) {
        raytraceUniformsRef.current.uResolution.value.set(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    // -------------------------------------------------------------
    // ANIMATION RENDER LOOP
    // -------------------------------------------------------------
    let animId: number;
    let prevTime = performance.now();

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - prevTime) / 1000, 0.1);
      prevTime = currentTime;

      const simTime = currentTime * 0.001;

      // Update orbiting spaceship and thruster exhaust trail
      spaceship.update(simTime, dt);

      // Smooth chase camera tracking if spaceship view is active
      if (selectedPartRef.current?.id === 'spaceship' && !isDraggingRef.current) {
        const shipPos = spaceship.getPosition();
        const chaseOffset = new THREE.Vector3(0, 1.4, 4.2).applyQuaternion(spaceship.group.quaternion);
        targetCamPosRef.current.copy(shipPos).add(chaseOffset);
        targetLookAtRef.current.copy(shipPos);
      }

      // Smooth camera interpolation
      camera.position.lerp(targetCamPosRef.current, dt * 5.0);
      currentLookAtRef.current.lerp(targetLookAtRef.current, dt * 5.0);
      camera.lookAt(currentLookAtRef.current);

      if (raytraceUniformsRef.current) {
        raytraceUniformsRef.current.uTime.value = simTime;
        raytraceUniformsRef.current.uCameraPos.value.copy(camera.position);
        raytraceUniformsRef.current.uCameraTarget.value.copy(currentLookAtRef.current);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);

      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      dom.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('resize', handleResize);

      spaceship.dispose();

      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: 'none' }}
    />
  );
};
