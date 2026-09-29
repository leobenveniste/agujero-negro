import * as THREE from 'three';

/**
 * Procedural Celestial Texture Generator
 * Inspired by N3rson/Solar-System-3D and NASA planetary cartography.
 * Generates photorealistic high-res textures via HTML5 Canvas without external CDN dependencies.
 */

// Simple 2D simplex/perlin-like noise generator
function createNoise2D(width: number, height: number, octaves = 4, persistence = 0.5) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // Generate white noise for octaves
  const noiseTables: Float32Array[] = [];
  for (let o = 0; o < octaves; o++) {
    const step = Math.pow(2, o + 2);
    const w = Math.ceil(width / step) + 2;
    const h = Math.ceil(height / step) + 2;
    const table = new Float32Array(w * h);
    for (let i = 0; i < table.length; i++) table[i] = Math.random();
    noiseTables.push(table);
  }

  const interpolate = (a: number, b: number, t: number) => a + (b - a) * (3 * t * t - 2 * t * t * t);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let val = 0;
      let amp = 1.0;
      let maxAmp = 0;

      for (let o = 0; o < octaves; o++) {
        const step = Math.pow(2, o + 2);
        const gx = x / step;
        const gy = y / step;
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const x1 = x0 + 1;
        const y1 = y0 + 1;
        const sx = gx - x0;
        const sy = gy - y0;

        const w = Math.ceil(width / step) + 2;
        const n00 = noiseTables[o][y0 * w + x0];
        const n10 = noiseTables[o][y0 * w + x1];
        const n01 = noiseTables[o][y1 * w + x0];
        const n11 = noiseTables[o][y1 * w + x1];

        const nx0 = interpolate(n00, n10, sx);
        const nx1 = interpolate(n01, n11, sx);
        const n = interpolate(nx0, nx1, sy);

        val += n * amp;
        maxAmp += amp;
        amp *= persistence;
      }

      val = val / maxAmp;
      const idx = (y * width + x) * 4;
      const byte = Math.floor(val * 255);
      data[idx] = byte;
      data[idx + 1] = byte;
      data[idx + 2] = byte;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * 1. PLANETA TIERRA (Earth Day Map)
 * Continents, coastlines, oceans, and green/brown biomes
 */
export function createEarthTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Deep ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0a2342');
  oceanGrad.addColorStop(0.5, '#0c356a');
  oceanGrad.addColorStop(1, '#0a2342');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Generate continent shapes using noise
  const noiseCanvas = createNoise2D(width, height, 5, 0.55);
  const nCtx = noiseCanvas.getContext('2d')!;
  const nData = nCtx.getImageData(0, 0, width, height).data;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const lat = Math.abs((y / height) * 2 - 1); // 0 at equator, 1 at poles
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const nVal = nData[idx] / 255;

      // Polar ice caps
      if (lat > 0.82) {
        data[idx] = 230;
        data[idx + 1] = 240;
        data[idx + 2] = 255;
        continue;
      }

      // Continent threshold
      if (nVal > 0.51) {
        const elevation = (nVal - 0.51) / 0.49;
        if (elevation < 0.15) {
          // Coast / shallow sand
          data[idx] = 194;
          data[idx + 1] = 178;
          data[idx + 2] = 128;
        } else if (elevation < 0.55) {
          // Lush green vegetation / temperate forest
          const g = Math.floor(110 + elevation * 40);
          data[idx] = 34 + Math.floor(elevation * 30);
          data[idx + 1] = g;
          data[idx + 2] = 40;
        } else {
          // Mountain / highland brown
          data[idx] = 139 + Math.floor(elevation * 50);
          data[idx + 1] = 119 + Math.floor(elevation * 40);
          data[idx + 2] = 101;
        }
      } else if (nVal > 0.48) {
        // Shallow shelf water (cyan/aqua)
        data[idx] = 24;
        data[idx + 1] = 110;
        data[idx + 2] = 160;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * 2. TIERRA - NUBES ATMOSFÉRICAS (Earth Clouds Layer)
 */
export function createEarthCloudsTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const noise = createNoise2D(width, height, 4, 0.6);
  const nData = noise.getContext('2d')!.getImageData(0, 0, width, height).data;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let i = 0; i < nData.length; i += 4) {
    const val = nData[i] / 255;
    if (val > 0.52) {
      const alpha = Math.min(255, Math.floor(((val - 0.52) / 0.48) * 230));
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = alpha;
    } else {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * 3. JÚPITER - Bandas gaseosas y Gran Mancha Roja
 */
export function createJupiterTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Jupiter cloud bands palette
  const colors = [
    '#5c3e21', '#8b5a2b', '#c49a6c', '#dfc4a4', '#d28b49',
    '#9c5826', '#e0b589', '#f2d6b3', '#a76a38', '#633917'
  ];

  for (let y = 0; y < height; y++) {
    const bandIdx = Math.floor((y / height) * (colors.length * 3)) % colors.length;

    ctx.fillStyle = colors[bandIdx];
    ctx.fillRect(0, y, width, 1);
  }

  // Add turbulent horizontal shear using noise
  const noise = createNoise2D(width, height, 4, 0.5);
  const nData = noise.getContext('2d')!.getImageData(0, 0, width, height).data;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const swirl = (nData[idx] - 128) * 0.15;
      data[idx] = Math.min(255, Math.max(0, data[idx] + swirl * 1.2));
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + swirl * 0.9));
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + swirl * 0.6));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Great Red Spot at ~22° South
  const spotX = width * 0.65;
  const spotY = height * 0.62;
  const spotGrad = ctx.createRadialGradient(spotX, spotY, 5, spotX, spotY, 40);
  spotGrad.addColorStop(0, '#b83b1d');
  spotGrad.addColorStop(0.6, '#cc5428');
  spotGrad.addColorStop(1, 'rgba(210, 139, 73, 0)');
  ctx.fillStyle = spotGrad;
  ctx.beginPath();
  ctx.ellipse(spotX, spotY, 45, 25, 0.05, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * 4. SATURNO - Superficie gaseosa dorada
 */
export function createSaturnTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const saturnBands = [
    '#9e875a', '#c2aa7a', '#d4be8f', '#e6d5ad', '#dfcca1',
    '#caaE7e', '#b89d6e', '#d8c499', '#ab9264'
  ];

  for (let y = 0; y < height; y++) {
    const idx = Math.floor((y / height) * (saturnBands.length * 2)) % saturnBands.length;
    ctx.fillStyle = saturnBands[idx];
    ctx.fillRect(0, y, width, 1);
  }

  // Soft blending
  ctx.fillStyle = 'rgba(230, 215, 175, 0.25)';
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * 5. ANILLOS DE SATURNO (Saturn Rings Texture)
 * Concentric rings with Cassini division and realistic opacity gaps
 */
export function createSaturnRingsTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 64;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let x = 0; x < width; x++) {
    const u = x / width; // 0 = inner edge, 1 = outer edge

    let r = 210, g = 195, b = 160, a = 0;

    // Ring C (inner faint ring)
    if (u >= 0.0 && u < 0.22) {
      a = Math.floor(60 * (u / 0.22));
    }
    // Ring B (brightest main ring)
    else if (u >= 0.22 && u < 0.65) {
      const density = 0.7 + 0.3 * Math.sin(u * 120);
      a = Math.floor(240 * density);
      r = 230; g = 215; b = 180;
    }
    // Cassini Division (dark gap)
    else if (u >= 0.65 && u < 0.72) {
      a = 15; // very faint dust
    }
    // Ring A (outer main ring)
    else if (u >= 0.72 && u < 0.94) {
      // Encke gap around 0.88
      if (u > 0.875 && u < 0.89) {
        a = 20;
      } else {
        const density = 0.6 + 0.4 * Math.sin(u * 90);
        a = Math.floor(180 * density);
        r = 200; g = 185; b = 155;
      }
    }
    // Outer edge fade
    else {
      a = 0;
    }

    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * 6. MARTE - Desierto rojo, cráteres y casquetes polares
 */
export function createMarsTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Base red-orange rust
  ctx.fillStyle = '#b34720';
  ctx.fillRect(0, 0, width, height);

  const noise = createNoise2D(width, height, 4, 0.5);
  const nData = noise.getContext('2d')!.getImageData(0, 0, width, height).data;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const lat = Math.abs((y / height) * 2 - 1);
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const nVal = nData[idx] / 255;

      // Polar caps (ice)
      if (lat > 0.85) {
        data[idx] = 245;
        data[idx + 1] = 245;
        data[idx + 2] = 250;
        continue;
      }

      // Dark basalt plains (Syrtis Major, Acidalia Planitia)
      if (nVal < 0.42) {
        data[idx] = 95 + Math.floor(nVal * 40);
        data[idx + 1] = 45 + Math.floor(nVal * 30);
        data[idx + 2] = 30;
      } else {
        // Red-ochre highlands
        data[idx] = 180 + Math.floor(nVal * 50);
        data[idx + 1] = 75 + Math.floor(nVal * 35);
        data[idx + 2] = 35;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * 7. LA LUNA - Regolito gris y mares lunares
 */
export function createMoonTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const noise = createNoise2D(width, height, 5, 0.6);
  const nData = noise.getContext('2d')!.getImageData(0, 0, width, height).data;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let i = 0; i < nData.length; i += 4) {
    const val = nData[i] / 255;
    // Mare (dark volcanic basalt) vs Highlands (bright cratered anorthosite)
    const brightness = val < 0.45 ? 65 + val * 50 : 130 + (val - 0.45) * 110;
    data[i] = brightness;
    data[i + 1] = brightness * 0.98;
    data[i + 2] = brightness * 0.95;
    data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * 8. EL SOL - Superficie de plasma turbulento
 */
export function createSunTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const noise = createNoise2D(width, height, 4, 0.55);
  const nData = noise.getContext('2d')!.getImageData(0, 0, width, height).data;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let i = 0; i < nData.length; i += 4) {
    const val = nData[i] / 255;
    // Fiery solar gradient
    data[i] = 255;
    data[i + 1] = Math.floor(160 + val * 95); // 160..255 (golden to white)
    data[i + 2] = Math.floor(val * 80);        // 0..80
    data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}
