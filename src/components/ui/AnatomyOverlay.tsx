import React from 'react';
import type { AnatomyPart } from '../../types/blackhole';
import {
  Info,
  Sparkles,
  X,
} from 'lucide-react';

interface AnatomyOverlayProps {
  selectedPart: AnatomyPart | null;
  onSelectPart: (part: AnatomyPart | null) => void;
}

export const AnatomyOverlay: React.FC<AnatomyOverlayProps> = ({
  selectedPart,
  onSelectPart,
}) => {
  return (
    <>
      {/* Selected Part Detail Inspector Card (Bottom sheet on mobile, left HUD on desktop) */}
      {selectedPart && (
        <aside className="absolute bottom-3 left-3 right-3 md:bottom-auto md:right-auto md:top-20 md:left-6 z-20 md:w-96 max-h-[55vh] md:max-h-[calc(100vh-120px)] overflow-y-auto bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl p-4 md:p-5 text-left animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full animate-ping"
                  style={{ backgroundColor: selectedPart.color }}
                />
                <h3 className="text-base font-bold text-white tracking-wide">
                  {selectedPart.name}
                </h3>
              </div>
              <p className="text-xs text-orange-400 font-medium mt-0.5">
                {selectedPart.tagline}
              </p>
            </div>
            <button
              onClick={() => onSelectPart(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <div className="mt-3.5 space-y-3 text-xs leading-relaxed text-slate-300">
            <p>{selectedPart.description}</p>

            {/* Formula Block */}
            {selectedPart.physicsFormula && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-center">
                <div className="text-xs font-semibold text-cyan-300 mb-1">
                  Ecuación Fundamental:
                </div>
                <div className="text-sm font-bold text-amber-300 py-1 tracking-wider bg-black/40 rounded px-2">
                  {selectedPart.physicsFormula}
                </div>
                {selectedPart.formulaExplanation && (
                  <div className="text-[10px] text-slate-400 mt-1">
                    {selectedPart.formulaExplanation}
                  </div>
                )}
              </div>
            )}

            {/* Key Facts List */}
            {selectedPart.keyFacts && selectedPart.keyFacts.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 mb-2 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Propiedades y Hechos Clave</span>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {selectedPart.keyFacts.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300 text-[11px] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* 3D Navigation Hint */}
      <div className="absolute bottom-5 right-4 hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/60 text-[11px] font-mono text-slate-400 backdrop-blur pointer-events-none">
        <Info className="w-3.5 h-3.5 text-cyan-400" />
        <span>Arrastra para orbitar | Pellizca para zoom</span>
      </div>
    </>
  );
};
