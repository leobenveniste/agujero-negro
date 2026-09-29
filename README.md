# AGUJERO NEGRO 3D
*Por Emma Benveniste*

Visualización 3D interactiva, relativista y pedagógica de la física, anatomía y dimensiones comparativas de los agujeros negros en el cosmos.

![Visualización 3D](https://raw.githubusercontent.com/leobenveniste/agujero-negro/main/public/preview.png)

## Características

- **Anatomía 3D Relativista:**
  - Shader de trazado de rayos (raytracing) para el disco de acreción con efecto Doppler relativista y beaming.
  - Lente gravitatoria (anillo de Einstein y deflexión gravitacional extrema de la luz).
  - Exploración anatómica interactiva: Horizonte de sucesos, Disco de acreción y Lente gravitatoria con datos físicos y fórmulas científicas.
  - Generador de audio sintetizado Web Audio API (drone cósmico envolvente).

- **Comparador de Escalas Cosmológicas:**
  - Comparativa de dimensiones astronómicas a escala visual real entre cuerpos celestes:
    - Planeta Tierra
    - Planeta Júpiter
    - El Sol
    - Agujero Negro Sagittarius A* (centro de la Vía Láctea)
    - Agujero Negro M87* (Galaxia Virgo A)
    - Cuásar / Hiperagujero TON 618
    - Sistema Solar completo (hasta la órbita de Neptuno y el cinturón de Kuiper)
  - Columnas de selección táctil directa para emparejamiento libre de objetos.
  - Tarjeta de especificaciones con radios reales / radios de Schwarzschild ($R_s = \frac{2GM}{c^2}$), masas y descripción pedagógica.

- **Diseño & Compatibilidad Multi-Touch:**
  - Control de cámara 3D orbital con 1 dedo / ratón.
  - Zoom con 2 dedos (pinch-to-zoom) / rueda de ratón.
  - Totalmente optimizado para iPads, tablets, pantallas táctiles y escritorios.

## Tecnologías Utilizadas

- **React 19** + **TypeScript**
- **Three.js** (WebGL / GLSL custom raymarching shaders)
- **Vite**
- **Tailwind CSS v4**
- **Lucide Icons**

## Instalación y Ejecución Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción (compatible con Vercel / Netlify / Cloudflare Pages)
npm run build
```

## Despliegue en Vercel

Este proyecto está listo para ser importado directamente en [Vercel](https://vercel.com):
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
