/**
 * High-Fidelity Relativistic Black Hole Raymarcher
 * Exact GLSL port of Dan Greenheck's WebGPU Schwarzschild raytracer
 * Reference: https://threejsroadmap.com/blog/raytracing-a-black-hole-with-webgpu
 */

export const RaytracedBlackHoleShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.99999, 1.0);
    }
  `,

  fragmentShader: `
    precision highp float;

    uniform vec2 uResolution;
    uniform float uTime;
    uniform vec3 uCameraPos;
    uniform vec3 uCameraTarget;

    // Black Hole & Relativity
    uniform float uBlackHoleMass;       // 0.4 -> rs = 0.8
    uniform float uGravitationalLensing;// 2.4
    uniform float uStepSize;            // 1.0

    // Accretion Disk
    uniform bool uShowDisk;
    uniform float uDiskInnerRadius;     // 4.1
    uniform float uDiskOuterRadius;     // 14.5
    uniform float uDiskTemperature;     // 49.78
    uniform float uTemperatureFalloff;  // 5.22
    uniform float uDiskBrightness;      // 5.0
    uniform float uDiskRotationSpeed;   // -8.7
    uniform float uDopplerStrength;     // 1.0
    uniform float uDiskEdgeSoftInner;   // 0.18
    uniform float uDiskEdgeSoftOuter;   // 0.50

    // Turbulence & FBM
    uniform float uTurbulenceScale;     // 1.81
    uniform float uTurbulenceStretch;   // 0.75
    uniform float uTurbulenceSharpness; // 7.4
    uniform float uTurbulenceCycleTime; // 5.0
    uniform float uTurbulenceLacunarity;// 2.5
    uniform float uTurbulencePersistence;// 0.8

    // Background Stars & Nebula
    uniform bool uStarsEnabled;
    uniform float uStarDensity;         // 0.1
    uniform float uStarSize;            // 1.2
    uniform float uStarBrightness;      // 0.1
    uniform bool uNebulaEnabled;
    uniform float uNebula1Scale;        // 2.0
    uniform float uNebula1Density;      // 0.5
    uniform float uNebula1Brightness;   // 0.01
    uniform vec3 uNebula1Color;         // #071f44 -> (0.027, 0.122, 0.267)
    uniform float uNebula2Scale;        // 5.5
    uniform float uNebula2Density;      // 0.05
    uniform float uNebula2Brightness;   // 0.21
    uniform vec3 uNebula2Color;         // #010615 -> (0.004, 0.024, 0.082)

    varying vec2 vUv;

    // -------------------------------------------------------------
    // HASH UTILITIES
    // -------------------------------------------------------------
    float hash21(vec2 p) {
      float n = sin(dot(p, vec2(127.1, 311.7))) * 43758.5453;
      return fract(n);
    }

    float hash31(vec3 p) {
      float n = sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453;
      return fract(n);
    }

    vec2 hash22(vec2 p) {
      float px = fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      float py = fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453);
      return vec2(px, py);
    }

    // -------------------------------------------------------------
    // NOISE & FBM
    // -------------------------------------------------------------
    float noise3D(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      vec3 u = f * f * (3.0 - 2.0 * f);

      float a = hash31(i);
      float b = hash31(i + vec3(1.0, 0.0, 0.0));
      float c = hash31(i + vec3(0.0, 1.0, 0.0));
      float d = hash31(i + vec3(1.0, 1.0, 0.0));
      float e = hash31(i + vec3(0.0, 0.0, 1.0));
      float f2 = hash31(i + vec3(1.0, 0.0, 1.0));
      float g = hash31(i + vec3(0.0, 1.0, 1.0));
      float h = hash31(i + vec3(1.0, 1.0, 1.0));

      return mix(
        mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
        mix(mix(e, f2, u.x), mix(g, h, u.x), u.y),
        u.z
      );
    }

    float fbm(vec3 p, float lacunarity, float persistence) {
      float value = 0.0;
      float amplitude = 0.5;
      vec3 pos = p;

      for (int i = 0; i < 4; i++) {
        value += noise3D(pos) * amplitude;
        pos *= lacunarity;
        amplitude *= persistence;
      }
      return value;
    }

    // -------------------------------------------------------------
    // BLACKBODY COLOR
    // -------------------------------------------------------------
    vec3 blackbodyColor(float tempK) {
      float t = clamp((tempK - 1000.0) / 9000.0, 0.0, 1.0);
      float red = clamp(1.0 - (t - 0.8) * 2.0, 0.5, 1.0);
      float green = smoothstep(0.0, 0.5, t) * (1.0 - max(0.0, (t - 0.7) * 0.3));
      float blue = smoothstep(0.3, 1.0, t) * t;
      return vec3(red, green, blue);
    }

    // -------------------------------------------------------------
    // STAR FIELD
    // -------------------------------------------------------------
    vec3 starField(vec3 rayDir) {
      float theta = atan(rayDir.z, rayDir.x);
      float phi = asin(clamp(rayDir.y, -1.0, 1.0));
      float gridScale = 60.0 / uStarSize;
      vec2 scaledCoord = vec2(theta, phi) * gridScale;
      vec2 cell = floor(scaledCoord);
      vec2 cellUV = fract(scaledCoord);

      float cellHash = hash21(cell);
      float starProb = step(1.0 - uStarDensity, cellHash);
      vec2 starPos = hash22(cell + 42.0) * 0.8 + 0.1;
      float distToStar = length(cellUV - starPos);

      float baseSizeVar = hash21(cell + 100.0) * 0.03 + 0.01;
      float finalStarSize = baseSizeVar * uStarSize;

      float starCore = smoothstep(finalStarSize, 0.0, distToStar);
      float starGlow = smoothstep(finalStarSize * 3.0, 0.0, distToStar) * 0.3;
      float starIntensity = (starCore + starGlow) * starProb;

      float colorTemp = hash21(cell + 200.0);
      vec3 starColor = mix(vec3(0.8, 0.9, 1.0), vec3(1.0, 0.95, 0.8), colorTemp);
      return starColor * starIntensity * uStarBrightness;
    }

    // -------------------------------------------------------------
    // NEBULA FIELD
    // -------------------------------------------------------------
    vec3 nebulaField(vec3 rayDir) {
      vec3 noisePos1 = rayDir * uNebula1Scale;
      float n1 = fbm(noisePos1, 2.0, 0.5) * 2.0 - 1.0;
      float layer1 = clamp(n1 + uNebula1Density, 0.0, 1.0);
      vec3 color1 = uNebula1Color * layer1 * uNebula1Brightness;

      vec3 noisePos2 = rayDir * uNebula2Scale;
      float n2 = fbm(noisePos2, 2.0, 0.5) * 2.0 - 1.0;
      float layer2 = clamp(n2 + uNebula2Density, 0.0, 1.0);
      vec3 color2 = uNebula2Color * layer2 * uNebula2Brightness;

      return color1 + color2;
    }

    // -------------------------------------------------------------
    // ACCRETION DISK SHADING
    // -------------------------------------------------------------
    vec4 accretionDiskColor(float hitR, float hitAngle, vec3 rayDir) {
      float innerR = uDiskInnerRadius;
      float outerR = uDiskOuterRadius;
      float normR = clamp((hitR - innerR) / (outerR - innerR), 0.0, 1.0);

      // Blackbody temperature
      float peakTempK = uDiskTemperature * 1000.0;
      float outerTempK = 1500.0;
      float tempFalloff = pow(innerR / hitR, uTemperatureFalloff);
      float tempK = mix(outerTempK, peakTempK, tempFalloff);
      vec3 diskColor = blackbodyColor(tempK);

      // Relativistic Doppler beaming
      float rotationSign = sign(uDiskRotationSpeed);
      vec3 velocityDir = vec3(
        -sin(hitAngle) * rotationSign,
        0.0,
        cos(hitAngle) * rotationSign
      );
      float velocityMagnitude = 1.0 / sqrt(hitR / innerR);
      float beta = velocityMagnitude * 0.3;
      float cosTheta = dot(velocityDir, rayDir);
      float dopplerFactor = 1.0 / (1.0 - beta * cosTheta);
      float dopplerBoost = pow(dopplerFactor, 3.0 * uDopplerStrength);
      diskColor *= clamp(dopplerBoost, 0.1, 5.0);

      // Edge falloff
      float edgeFalloff = smoothstep(0.0, uDiskEdgeSoftInner, normR) *
                          smoothstep(1.0, 1.0 - uDiskEdgeSoftOuter, normR);

      // Cyclic time crossfading turbulence
      float cycleLength = uTurbulenceCycleTime;
      float cyclicTime = mod(uTime, cycleLength);
      float blendFactor = cyclicTime / cycleLength;

      float keplerianPhase1 = (cyclicTime * uDiskRotationSpeed) / pow(hitR, 1.5);
      float keplerianPhase2 = ((cyclicTime + cycleLength) * uDiskRotationSpeed) / pow(hitR, 1.5);

      float rotatedAngle1 = hitAngle + keplerianPhase1;
      float rotatedAngle2 = hitAngle + keplerianPhase2;

      float safeStretch = max(0.1, uTurbulenceStretch);
      vec3 noiseCoord1 = vec3(
        hitR * uTurbulenceScale,
        cos(rotatedAngle1) / safeStretch,
        sin(rotatedAngle1) / safeStretch
      );
      vec3 noiseCoord2 = vec3(
        hitR * uTurbulenceScale,
        cos(rotatedAngle2) / safeStretch,
        sin(rotatedAngle2) / safeStretch
      );

      float turbulence1 = fbm(noiseCoord1, uTurbulenceLacunarity, uTurbulencePersistence);
      float turbulence2 = fbm(noiseCoord2, uTurbulenceLacunarity, uTurbulencePersistence);
      float turbulence = mix(turbulence2, turbulence1, blendFactor);

      float ringOpacity = pow(clamp(turbulence, 0.0, 1.0), uTurbulenceSharpness);
      float finalOpacity = ringOpacity * edgeFalloff;
      vec3 finalColor = diskColor * uDiskBrightness;

      return vec4(finalColor, finalOpacity);
    }

    // -------------------------------------------------------------
    // MAIN RAYMARCHER
    // -------------------------------------------------------------
    void main() {
      float rs = uBlackHoleMass * 2.0;
      vec2 uv = (vUv - 0.5) * 2.0;
      float aspect = uResolution.x / uResolution.y;
      vec2 screenPos = vec2(uv.x * aspect, uv.y);

      vec3 camPos = uCameraPos;
      vec3 camTarget = uCameraTarget;
      vec3 camForward = normalize(camTarget - camPos);
      vec3 worldUp = vec3(0.0, 1.0, 0.0);
      vec3 camRight = normalize(cross(worldUp, camForward));
      vec3 camUp = cross(camForward, camRight);

      float fov = 1.0;
      vec3 rayDir = normalize(camForward * fov + camRight * screenPos.x + camUp * screenPos.y);

      vec3 rayPos = camPos;
      vec3 prevPos = camPos;
      vec3 color = vec3(0.0);
      float alpha = 0.0;
      bool escaped = false;
      bool captured = false;

      float innerR = uDiskInnerRadius;
      float outerR = uDiskOuterRadius;

      // 40 adaptive raymarching steps
      for (int i = 0; i < 40; i++) {
        if (escaped || captured || alpha > 0.99) {
          break;
        }

        float r = length(rayPos);

        // Captured by horizon?
        if (r < rs * 1.01) {
          captured = true;
          break;
        }

        // Escaped to infinity?
        if (r > 100.0) {
          escaped = true;
          break;
        }

        // Gravitational light deflection toward center
        vec3 toCenter = -rayPos / r;
        float bendStrength = (rs / (r * r)) * uStepSize * uGravitationalLensing;
        rayDir = normalize(rayDir + toCenter * bendStrength);

        prevPos = rayPos;
        rayPos += rayDir * uStepSize;

        // Check if ray crosses the accretion disk plane (Y = 0)
        if (uShowDisk && (prevPos.y * rayPos.y < 0.0) && (alpha < 0.99)) {
          float t = -prevPos.y / (rayPos.y - prevPos.y);
          vec3 hitPos = mix(prevPos, rayPos, t);
          float hitR = sqrt(hitPos.x * hitPos.x + hitPos.z * hitPos.z);

          if (hitR > innerR && hitR < outerR) {
            float hitAngle = atan(hitPos.z, hitPos.x);
            vec4 diskResult = accretionDiskColor(hitR, hitAngle, rayDir);

            float remainingAlpha = 1.0 - alpha;
            color += diskResult.rgb * diskResult.a * remainingAlpha;
            alpha += remainingAlpha * diskResult.a;
          }
        }
      }

      if (!captured) {
        escaped = true;
      }

      // Sample distorted starfield and nebula for escaped photons
      if (escaped && (alpha < 0.99)) {
        vec3 bgColor = vec3(0.0, 0.0, 0.0);
        if (uStarsEnabled) {
          bgColor += starField(rayDir);
        }
        if (uNebulaEnabled) {
          bgColor += nebulaField(rayDir);
        }
        color += bgColor * (1.0 - alpha);
      }

      // ACES Tone mapping & Gamma 2.2
      vec3 finalColor = pow(color, vec3(1.0 / 2.2));
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};
