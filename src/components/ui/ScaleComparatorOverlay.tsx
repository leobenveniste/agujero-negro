import React from 'react';
import type { CelestialObject } from '../../types/blackhole';
import { CELESTIAL_OBJECTS } from '../../data/celestialObjects';
import { formatDistanceKm, formatScientific } from '../../utils/physics';
import {
  Globe,
  Sun,
  Disc,
  Sparkles,
} from 'lucide-react';

interface ScaleComparatorOverlayProps {
  primaryObject: CelestialObject;
  setPrimaryObject: (obj: CelestialObject) => void;
  secondaryObject: CelestialObject;
  setSecondaryObject: (obj: CelestialObject) => void;
}

export const ScaleComparatorOverlay: React.FC<ScaleComparatorOverlayProps> = ({
  primaryObject,
  setPrimaryObject,
  secondaryObject,
  setSecondaryObject,
}) => {
  const getRadius = (obj: CelestialObject) => {
    return obj.type === 'black_hole' ? (obj.schwarzschildRadiusKm ?? obj.radiusKm) : obj.radiusKm;
  };

  const r1 = getRadius(primaryObject);
  const r2 = getRadius(secondaryObject);

  const radiusRatio = r1 >= r2 ? r1 / Math.max(r2, 1e-9) : r2 / Math.max(r1, 1e-9);
  const largerRadiusObj = r1 >= r2 ? primaryObject : secondaryObject;
  const smallerRadiusObj = r1 >= r2 ? secondaryObject : primaryObject;

  const getObjectIcon = (obj: CelestialObject) => {
    if (obj.type === 'black_hole') return <Disc className="w-3.5 h-3.5 shrink-0" />;
    if (obj.type === 'star') return <Sun className="w-3.5 h-3.5 shrink-0" />;
    if (obj.type === 'system') return <Sparkles className="w-3.5 h-3.5 shrink-0" />;
    return <Globe className="w-3.5 h-3.5 shrink-0" />;
  };

  return (
    <>
      {/* LEFT COLUMN OF ICONS: SELECTOR FOR OBJETO 1 */}
      <aside className="absolute left-3 md:left-5 top-20 bottom-64 z-20 flex flex-col items-start gap-1 p-2 bg-slate-950/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl overflow-y-auto max-w-[200px] sm:max-w-[220px]">
        <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5 border-b border-slate-800/80 w-full mb-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Objeto 1 (Izq)</span>
        </div>

        <div className="flex flex-col gap-1 w-full">
          {CELESTIAL_OBJECTS.map((obj) => {
            const isSelected = primaryObject.id === obj.id;
            return (
              <button
                key={`p-${obj.id}`}
                onClick={() => setPrimaryObject(obj)}
                title={obj.name}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left transition-all min-h-[38px] w-full ${
                  isSelected
                    ? 'bg-cyan-500/20 border border-cyan-400/80 text-white font-semibold shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900/50 border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span style={{ color: obj.color }}>{getObjectIcon(obj)}</span>
                <span className="truncate leading-tight">{obj.name}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* RIGHT COLUMN OF ICONS: SELECTOR FOR OBJETO 2 */}
      <aside className="absolute right-3 md:right-5 top-20 bottom-64 z-20 flex flex-col items-start gap-1 p-2 bg-slate-950/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl overflow-y-auto max-w-[200px] sm:max-w-[220px]">
        <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold flex items-center gap-1.5 border-b border-slate-800/80 w-full mb-1">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span>Objeto 2 (Der)</span>
        </div>

        <div className="flex flex-col gap-1 w-full">
          {CELESTIAL_OBJECTS.map((obj) => {
            const isSelected = secondaryObject.id === obj.id;
            return (
              <button
                key={`s-${obj.id}`}
                onClick={() => setSecondaryObject(obj)}
                title={obj.name}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left transition-all min-h-[38px] w-full ${
                  isSelected
                    ? 'bg-orange-500/20 border border-orange-400/80 text-white font-semibold shadow-md shadow-orange-950/50'
                    : 'bg-slate-900/50 border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span style={{ color: obj.color }}>{getObjectIcon(obj)}</span>
                <span className="truncate leading-tight">{obj.name}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* BOTTOM CENTER: DETAILED COMPARATIVE DATA HUD CARD */}
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-4xl bg-slate-950/90 backdrop-blur-2xl border border-slate-800/90 rounded-2xl shadow-2xl p-4">
        {/* Top bar with comparative ratio */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="font-semibold text-cyan-400">{primaryObject.name}</span>
              <span className="text-slate-500">vs</span>
              <span className="font-semibold text-orange-400">{secondaryObject.name}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold shadow-sm">
              {largerRadiusObj.name} es {radiusRatio >= 1e6
                ? `${formatScientific(radiusRatio)}×`
                : `${radiusRatio.toLocaleString('es-ES', { maximumFractionDigits: 1 })}×`} mayor que {smallerRadiusObj.name}
            </span>
          </div>
        </div>

        {/* Side-by-side data columns for both chosen objects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {/* Objeto 1 (Izquierda) */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-left">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: primaryObject.color }}
                />
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                  {primaryObject.name}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-black/40">
                {primaryObject.type === 'black_hole'
                  ? 'Agujero Negro'
                  : primaryObject.type === 'star'
                  ? 'Estrella'
                  : primaryObject.type === 'system'
                  ? 'Sistema'
                  : 'Planeta'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div className="bg-black/30 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Radio / Rs:</span>
                <span className="font-mono font-bold text-white text-xs">
                  {formatDistanceKm(r1)}
                </span>
              </div>
              <div className="bg-black/30 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Masa:</span>
                <span className="font-mono font-bold text-cyan-300 text-xs">
                  {primaryObject.solarMasses !== undefined
                    ? `${formatScientific(primaryObject.solarMasses)} M☉`
                    : `${formatScientific(primaryObject.massKg)} kg`}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
              {primaryObject.description}
            </p>
          </div>

          {/* Objeto 2 (Derecha) */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-left">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: secondaryObject.color }}
                />
                <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wide">
                  {secondaryObject.name}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-black/40">
                {secondaryObject.type === 'black_hole'
                  ? 'Agujero Negro'
                  : secondaryObject.type === 'star'
                  ? 'Estrella'
                  : secondaryObject.type === 'system'
                  ? 'Sistema'
                  : 'Planeta'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div className="bg-black/30 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Radio / Rs:</span>
                <span className="font-mono font-bold text-white text-xs">
                  {formatDistanceKm(r2)}
                </span>
              </div>
              <div className="bg-black/30 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Masa:</span>
                <span className="font-mono font-bold text-orange-300 text-xs">
                  {secondaryObject.solarMasses !== undefined
                    ? `${formatScientific(secondaryObject.solarMasses)} M☉`
                    : `${formatScientific(secondaryObject.massKg)} kg`}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
              {secondaryObject.description}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};
