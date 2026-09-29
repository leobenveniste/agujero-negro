/**
 * GLSL Shaders for the Relativistic Accretion Disk
 * Incorporates:
 * - Dynamic spiral flow and noise
 * - Temperature gradient: Ultra-hot white-blue at inner ISCO edge -> fiery amber/orange -> deep red -> dark dust at outer rim
 * - Doppler Beaming: Approaching side is significantly brighter and shifted, receding side is dimmed
 */
export const AccretionDiskShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uCameraPos;
    uniform float uInnerRadius;
    uniform float uOuterRadius;
    uniform float uDopplerIntensity;
    uniform float uGlowIntensity;

    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    // Simplex/Perlin-like pseudo noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float total = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 4; i++) {
        total += noise(p) * amp;
        p *= 2.02;
        amp *= 0.5;
      }
      return total;
    }

    void main() {
      // Calculate 2D radius and angle on disk plane
      float r = length(vPosition.xy);
      float theta = atan(vPosition.y, vPosition.x);

      // Normalize radius between 0 (inner ISCO) and 1 (outer edge)
      float normR = (r - uInnerRadius) / (uOuterRadius - uInnerRadius);
      if (normR < 0.0 || normR > 1.0) {
        discard;
      }

      // Keplerian differential rotation: angular speed omega ~ r^(-1.5)
      float omega = 1.0 / (pow(r, 1.2) + 0.1);
      float rotAngle = theta + uTime * 1.5 * omega;

      // Spiral plasma filament texture
      vec2 coord = vec2(normR * 6.0, rotAngle * 2.0);
      float plasma = fbm(coord + vec2(uTime * 0.3, 0.0));
      plasma += 0.5 * fbm(coord * 2.0 - vec2(0.0, uTime * 0.5));

      // Relativistic Doppler Beaming
      // Velocity vector of disk element orbiting counter-clockwise
      vec3 vel = normalize(vec3(-vPosition.y, vPosition.x, 0.0));
      // Direction toward camera from this world point
      vec3 viewDir = normalize(uCameraPos - vWorldPosition);
      // Dot product: > 0 means moving toward observer, < 0 means moving away
      float vDot = dot(vel, viewDir);
      
      // Relativistic Doppler beaming boost factor:
      // Radiation is beamed forward in the direction of motion
      float beaming = 1.0 + vDot * uDopplerIntensity * 0.85;
      beaming = max(beaming, 0.15); // Don't let receding side be totally invisible

      // Temperature color gradient based on radius
      // Inner edge is white-hot/cyan; middle is blazing amber; outer edge is deep dark red
      vec3 colInnerHot = vec3(1.0, 0.98, 0.92); // White-gold core
      vec3 colMid = vec3(1.0, 0.55, 0.12);      // Intense orange
      vec3 colOuter = vec3(0.75, 0.15, 0.03);    // Deep dark crimson
      vec3 colEdge = vec3(0.2, 0.04, 0.01);     // Dust rim

      vec3 baseColor;
      if (normR < 0.25) {
        baseColor = mix(colInnerHot, colMid, normR / 0.25);
      } else if (normR < 0.7) {
        baseColor = mix(colMid, colOuter, (normR - 0.25) / 0.45);
      } else {
        baseColor = mix(colOuter, colEdge, (normR - 0.7) / 0.3);
      }

      // Doppler color shift: approaching matter shifts blue/white; receding shifts red
      if (vDot > 0.0) {
        baseColor = mix(baseColor, vec3(0.9, 0.95, 1.0), vDot * 0.35 * uDopplerIntensity);
      } else {
        baseColor = mix(baseColor, vec3(0.6, 0.08, 0.02), -vDot * 0.4 * uDopplerIntensity);
      }

      // Edge fading (soft inner and outer margins)
      float innerFade = smoothstep(0.0, 0.08, normR);
      float outerFade = smoothstep(1.0, 0.75, normR);
      float alpha = innerFade * outerFade * (0.6 + 0.4 * plasma);

      // Brightness modulation
      float brightness = (1.2 + 0.8 * plasma) * beaming * uGlowIntensity;
      vec3 finalColor = baseColor * brightness;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

/**
 * GLSL Shader for the Lensed Vertical Halo (Gargantua gravitational bending)
 * Renders the light from behind the black hole warped above and below the horizon.
 */
export const GravitationalLensHaloShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uCameraPos;
    uniform float uRs;
    uniform float uGlowIntensity;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vec3 viewDir = normalize(uCameraPos - vWorldPosition);
      float fresnel = 1.0 - abs(dot(viewDir, vNormal));
      fresnel = pow(fresnel, 2.5);

      // Pulsing and subtle rotation
      float pulse = 0.95 + 0.05 * sin(uTime * 1.5);

      // Color matching relativistic accretion temperature
      vec3 haloColor = mix(
        vec3(1.0, 0.6, 0.15), // Amber
        vec3(1.0, 0.95, 0.8), // Pure light
        pow(fresnel, 3.0)
      );

      float alpha = fresnel * 0.7 * pulse * uGlowIntensity;
      gl_FragColor = vec4(haloColor * 1.4, alpha);
    }
  `
};

/**
 * GLSL Shader for the Photon Sphere (1.5 Rs)
 * A thin, razor-sharp luminous ring where photons orbit in unstable equilibrium.
 */
export const PhotonSphereShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uIntensity;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      // Razor-sharp limb glowing effect
      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      float edge = 1.0 - abs(dot(vNormal, viewDir));
      float ring = pow(edge, 6.0);

      gl_FragColor = vec4(uColor * 2.0, ring * uIntensity);
    }
  `
};

/**
 * GLSL Shader for Relativistic Polar Jets
 */
export const PolarJetShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vPosition = position;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;

    void main() {
      // Flow along Y axis (along cone height)
      float heightNorm = vUv.y;
      float speed = uTime * 3.5;
      float flow = sin(heightNorm * 25.0 - speed) * 0.25 + 0.75;

      // Soft edges around circumference
      float edge = sin(vUv.x * 3.14159);

      // Fade out with distance from pole
      float distFade = smoothstep(0.0, 0.15, heightNorm) * (1.0 - smoothstep(0.7, 1.0, heightNorm));

      float alpha = edge * distFade * flow * 0.75;
      vec3 jetColor = mix(uColor, vec3(1.0, 0.9, 1.0), pow(flow, 2.0) * 0.5);

      gl_FragColor = vec4(jetColor * 1.5, alpha);
    }
  `
};
