import type { PhysicsCalculation } from '../types/blackhole';


// Fundamental Physical Constants (SI Units)
export const G = 6.67430e-11; // Gravitational constant (m^3 kg^-1 s^-2)
export const C = 299792458; // Speed of light (m/s)
export const HBAR = 1.054571817e-34; // Reduced Planck constant (J s)
export const K_B = 1.380649e-23; // Boltzmann constant (J/K)
export const SOLAR_MASS = 1.98847e30; // 1 Solar Mass (M☉) in kg
export const EARTH_MASS = 5.9722e24; // Earth mass in kg
export const SECONDS_PER_YEAR = 31557600; // Average Gregorian year in seconds

/**
 * Calculates Schwarzschild Radius: Rs = 2 * G * M / c^2
 * @param massKg Mass in kilograms
 * @returns Radius in meters
 */
export function calculateSchwarzschildRadius(massKg: number): number {
  return (2 * G * massKg) / (C * C);
}

/**
 * Calculates Photon Sphere Radius: 1.5 * Rs (for Schwarzschild non-rotating black hole)
 */
export function calculatePhotonSphereRadius(rsMeters: number): number {
  return 1.5 * rsMeters;
}

/**
 * Calculates Innermost Stable Circular Orbit (ISCO): 3.0 * Rs (for Schwarzschild)
 */
export function calculateISCORadius(rsMeters: number): number {
  return 3.0 * rsMeters;
}

/**
 * Calculates Hawking Temperature: T = (hbar * c^3) / (8 * pi * G * M * k_B)
 * @param massKg Mass in kilograms
 * @returns Temperature in Kelvin
 */
export function calculateHawkingTemperature(massKg: number): number {
  if (massKg <= 0) return 0;
  const numerator = HBAR * Math.pow(C, 3);
  const denominator = 8 * Math.PI * G * massKg * K_B;
  return numerator / denominator;
}

/**
 * Calculates Evaporation Time via Hawking Radiation:
 * t = (5120 * pi * G^2 * M^3) / (hbar * c^4)
 * @param massKg Mass in kilograms
 * @returns Time in seconds
 */
export function calculateEvaporationTimeSeconds(massKg: number): number {
  if (massKg <= 0) return 0;
  const numerator = 5120 * Math.PI * Math.pow(G, 2) * Math.pow(massKg, 3);
  const denominator = HBAR * Math.pow(C, 4);
  return numerator / denominator;
}

/**
 * Calculates Tidal Acceleration across a human body (1.8m tall) at the Event Horizon:
 * a_tidal = (2 * G * M * h) / Rs^3 = (c^6 * h) / (4 * G^2 * M^2)
 * @param massKg Mass in kg
 * @param bodyHeightMeters Height of person (standard 1.8m)
 * @returns Tidal force in Earth G's (1g = 9.81 m/s^2)
 */
export function calculateTidalForceGs(massKg: number, bodyHeightMeters = 1.8): number {
  const rs = calculateSchwarzschildRadius(massKg);
  if (rs <= 0) return 0;
  const aTidalMps2 = (2 * G * massKg * bodyHeightMeters) / Math.pow(rs, 3);
  return aTidalMps2 / 9.80665;
}

/**
 * Calculates average volumetric mass density inside the Schwarzschild sphere:
 * rho = M / ((4/3) * pi * Rs^3) = (3 * c^6) / (32 * pi * G^3 * M^2)
 */
export function calculateAverageDensity(massKg: number): number {
  const rs = calculateSchwarzschildRadius(massKg);
  const volume = (4 / 3) * Math.PI * Math.pow(rs, 3);
  return massKg / volume;
}

/**
 * Generates an intuitive real-world analogy for the Schwarzschild radius of a given mass.
 */
export function getSchwarzschildAnalogy(rsKm: number): string {
  const rsMeters = rsKm * 1000;
  if (rsMeters < 1e-12) return 'Más pequeño que el núcleo de un átomo';
  if (rsMeters < 1e-9) return 'Del tamaño de una molécula de ADN';
  if (rsMeters < 1e-6) return 'Del tamaño de una bacteria microscópica';
  if (rsMeters < 0.001) return 'Del grosor de una hebra de cabello humano';
  if (rsMeters < 0.01) return `Aprox. ${(rsMeters * 100).toFixed(1)} cm (como una canica o moneda)`;
  if (rsMeters < 0.1) return `Aprox. ${(rsMeters * 100).toFixed(1)} cm (como una pelota de tenis)`;
  if (rsMeters < 1) return `Aprox. ${(rsMeters * 100).toFixed(0)} cm (como una rueda de bicicleta)`;
  if (rsKm < 1) return `Aprox. ${rsMeters.toFixed(0)} metros (cabe en una cancha de fútbol)`;
  if (rsKm < 5) return `Aprox. ${rsKm.toFixed(1)} km (tamaño del centro de una ciudad)`;
  if (rsKm < 50) return `Aprox. ${rsKm.toFixed(1)} km (tamaño de la isla de Manhattan o una gran metrópoli)`;
  if (rsKm < 1000) return `Aprox. ${rsKm.toFixed(0)} km (longitud de un país mediano)`;
  if (rsKm < 10000) return `Aprox. ${rsKm.toLocaleString('es-ES')} km (casi el diámetro de la Tierra)`;
  if (rsKm < 1400000) return `Aprox. ${rsKm.toLocaleString('es-ES')} km (cabe entre la Tierra y la Luna)`;
  if (rsKm < 1.5e8) return `Aprox. ${(rsKm / 1e6).toFixed(1)} millones de km (menor a la distancia Tierra-Sol)`;
  if (rsKm < 6e9) return `Aprox. ${(rsKm / 1.496e8).toFixed(1)} Unidades Astronómicas (abarca órbitas planetarias)`;
  return `Aprox. ${(rsKm / 1.496e8).toFixed(0)} UA (inmensamente mayor que todo el Sistema Solar)`;
}

/**
 * Compiles full physics report for a given mass
 */
export function computeBlackHolePhysics(massKg: number): PhysicsCalculation {
  const rsM = calculateSchwarzschildRadius(massKg);
  const rsKm = rsM / 1000;
  const solarMasses = massKg / SOLAR_MASS;
  const evapSec = calculateEvaporationTimeSeconds(massKg);
  const evapYears = evapSec / SECONDS_PER_YEAR;

  return {
    massKg,
    solarMasses,
    rsMeters: rsM,
    rsKm,
    photonSphereKm: calculatePhotonSphereRadius(rsM) / 1000,
    iscoKm: calculateISCORadius(rsM) / 1000,
    hawkingTempKelvin: calculateHawkingTemperature(massKg),
    evaporationTimeYears: evapYears,
    tidalForceGs: calculateTidalForceGs(massKg),
    avgDensityKgM3: calculateAverageDensity(massKg),
    realWorldAnalogy: getSchwarzschildAnalogy(rsKm),
  };
}

/**
 * Formats a number nicely in scientific notation or standard format
 */
export function formatScientific(num: number, digits = 2): string {
  if (num === 0) return '0';
  const abs = Math.abs(num);
  if (abs >= 0.001 && abs < 1e6) {
    return num.toLocaleString('es-ES', { maximumFractionDigits: digits });
  }
  const exp = Math.floor(Math.log10(abs));
  const mantissa = num / Math.pow(10, exp);
  return `${mantissa.toFixed(digits)} × 10${toSuperscript(exp)}`;
}

export function toSuperscript(num: number): string {
  const map: Record<string, string> = {
    '-': '⁻',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return num
    .toString()
    .split('')
    .map(c => map[c] || c)
    .join('');
}

export function formatDistanceKm(km: number): string {
  if (km < 0.001) return `${(km * 1e6).toFixed(1)} mm`;
  if (km < 1) return `${(km * 1000).toFixed(1)} m`;
  if (km < 1e5) return `${km.toLocaleString('es-ES', { maximumFractionDigits: 1 })} km`;
  if (km < 1.496e8) return `${(km / 1e6).toFixed(2)} millones de km`;
  const au = km / 1.496e8;
  return `${au.toLocaleString('es-ES', { maximumFractionDigits: 2 })} UA (Unidades Astronómicas)`;
}

export function formatTimeYears(years: number): string {
  if (years < 1e-10) return 'Fracción de microsegundo';
  if (years < 1 / 365) return 'Unos pocos días u horas';
  if (years < 1) return `${(years * 365).toFixed(0)} días`;
  if (years < 1e6) return `${years.toLocaleString('es-ES', { maximumFractionDigits: 0 })} años`;
  return `${formatScientific(years)} años`;
}
