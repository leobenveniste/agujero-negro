/**
 * Relativistic Black Hole Visual Components for Scale Comparison
 * Replicates the curved spacetime aesthetic:
 * - Warped accretion disk (upper & lower gravitational lensing arcs)
 * - Doppler beaming asymmetry (approaching side brighter/bluer)
 * - Intense photon ring at 1.5 Rs
 * - Pitch-black event horizon shadow
 */

export const AccretionDiskLensingShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,

  fragmentShader: `
    precision highp float;

    uniform float uTime;
    uniform vec3 uColor;
    uniform float uDopplerStrength; // 1.0
    uniform float uInnerRadius;
    uniform float uOuterRadius;

    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vViewPosition;

    // Simplex-like noise for accretion disk swirling plasma
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = p * 2.1;
        a *= 0.5;
      }
      return v;
    }

    // Blackbody thermal color approximation
    vec3 thermalPalette(float t) {
      // t ranges from 0 (cool red) to 1 (scorching blue-white)
      vec3 colA = vec3(0.12, 0.01, 0.0);   // Dark crimson
      vec3 colB = vec3(0.95, 0.32, 0.02);  // Fiery orange
      vec3 colC = vec3(1.0, 0.88, 0.45);   // Brilliant gold
      vec3 colD = vec3(0.75, 0.92, 1.0);   // Blazing relativistic cyan-white

      if (t < 0.25) return mix(colA, colB, t / 0.25);
      if (t < 0.70) return mix(colB, colC, (t - 0.25) / 0.45);
      return mix(colC, colD, (t - 0.70) / 0.30);
    }

    void main() {
      // Polar coords on the disk
      float r = length(vPosition.xz);
      float angle = atan(vPosition.z, vPosition.x);

      // Normalized radial distance across disk: 0 (inner ISCO) to 1 (outer edge)
      float normR = clamp((r - uInnerRadius) / (uOuterRadius - uInnerRadius), 0.0, 1.0);

      if (r < uInnerRadius * 0.95 || r > uOuterRadius * 1.02) {
        discard;
      }

      // Keplerian differential rotation: inner disk spins much faster: omega ~ r^-1.5
      float omega = 3.5 / pow(max(r, 0.5), 1.2);
      float theta = angle - uTime * omega;

      // Swirling gas turbulence
      vec2 noiseCoord = vec2(theta * 3.5, r * 2.2);
      float gas = fbm(noiseCoord);

      // Base temperature: hot near ISCO, falls off outwards
      float temp = pow(1.0 - normR, 1.8) * 0.9 + gas * 0.25;
      temp = clamp(temp, 0.0, 1.0);

      // Relativistic Doppler Beaming:
      // Material on the left side (x < 0) rotates towards the observer -> boosted brightness & blueshift
      // Material on the right side (x > 0) rotates away -> redshifted & dimmed
      float dopplerFactor = 1.0 - sin(angle) * 0.65 * uDopplerStrength;
      dopplerFactor = pow(clamp(dopplerFactor, 0.2, 2.5), 3.0); // D^3 beaming

      // Shift temperature and color by Doppler
      float shiftedTemp = clamp(temp * (dopplerFactor * 0.6 + 0.4), 0.0, 1.0);
      vec3 baseColor = thermalPalette(shiftedTemp);

      // Radial opacity curve: soft fade at inner and outer edges
      float innerFade = smoothstep(uInnerRadius * 0.95, uInnerRadius * 1.15, r);
      float outerFade = 1.0 - smoothstep(uOuterRadius * 0.85, uOuterRadius, r);
      float alpha = innerFade * outerFade * (0.45 + gas * 0.55);

      // Boost brightness by Doppler factor
      vec3 finalColor = baseColor * dopplerFactor * 1.4;

      // Inner photon ring glow highlight
      if (normR < 0.1) {
        float photonGlow = pow(1.0 - (normR / 0.1), 3.0) * 2.0;
        finalColor += vec3(0.9, 0.95, 1.0) * photonGlow;
        alpha = max(alpha, 0.95);
      }

      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
};

/**
 * Gravitational Lensing Halo (Upper & Lower bent accretion disk arcs)
 */
export const GravitationalLensingHaloShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    precision highp float;

    uniform float uTime;
    uniform float uRadius;

    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;

    void main() {
      // Create the optical illusion of the bent accretion disk looping over the shadow
      // Strongest at top and bottom meridians, zero at horizontal
      float angle = atan(vPosition.y, vPosition.x);
      float polarAlignment = abs(sin(angle)); // 1 at top/bottom, 0 at equator

      float distFromEdge = abs(length(vPosition.xy) - uRadius * 1.25) / (uRadius * 0.35);
      float ring = exp(-distFromEdge * distFromEdge * 3.5);

      // Doppler asymmetry applied to the upper lens as well
      float doppler = 1.0 - (vPosition.x / (uRadius * 1.5)) * 0.5;

      vec3 arcColor = mix(vec3(0.9, 0.35, 0.05), vec3(1.0, 0.9, 0.6), polarAlignment);
      arcColor *= doppler;

      float alpha = ring * pow(polarAlignment, 2.2) * 0.75;
      if (alpha < 0.01) discard;

      gl_FragColor = vec4(arcColor * 1.5, alpha);
    }
  `,
};
