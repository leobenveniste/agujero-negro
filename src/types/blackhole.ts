export type ObjectCategory = 'stellar' | 'supermassive' | 'ultramassive' | 'reference';

export type CelestialType = 'black_hole' | 'star' | 'planet' | 'system';

export interface CelestialObject {
  id: string;
  name: string;
  subtitle: string;
  type: CelestialType;
  category: ObjectCategory;
  massKg: number;
  solarMasses?: number;
  radiusKm: number;
  schwarzschildRadiusKm?: number;
  distanceLy?: string;
  constellation?: string;
  description: string;
  funFact: string;
  color: string;
  glowColor: string;
}

export interface AnatomyPart {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  physicsFormula?: string;
  formulaExplanation?: string;
  keyFacts: string[];
  visualRadiusMultiplier: number;
  color: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
}

export interface PhysicsCalculation {
  massKg: number;
  solarMasses: number;
  rsMeters: number;
  rsKm: number;
  photonSphereKm: number;
  iscoKm: number;
  hawkingTempKelvin: number;
  evaporationTimeYears: number;
  tidalForceGs: number;
  avgDensityKgM3: number;
  realWorldAnalogy: string;
}

export type ViewMode = 'anatomy' | 'scale';
