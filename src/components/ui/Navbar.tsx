import React from 'react';
import type { ViewMode, AnatomyPart } from '../../types/blackhole';
import { ANATOMY_PARTS } from '../../data/celestialObjects';
import {
  Compass,
  Maximize2,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface NavbarProps {
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  selectedPart: AnatomyPart | null;
  onSelectPart: (part: AnatomyPart | null) => void;
  isAudioActive: boolean;
  onToggleAudio: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  selectedPart,
  onSelectPart,
  isAudioActive,
  onToggleAudio,
}) => {
  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    {
      id: 'anatomy',
      label: 'Anatomía 3D',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'scale',
      label: 'Comparador de Escalas',
      icon: <Maximize2 className="w-4 h-4" />,
    },
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-30 px-5 py-4 flex items-center justify-between pointer-events-none">
      {/* Brand: AGUJERO NEGRO por Emma Benveniste */}
      <div className="flex items-center gap-3 pointer-events-auto shrink-0">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 via-orange-600 to-black p-[1.5px] shadow-lg shadow-orange-950/40">
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 blur-[1px] animate-pulse" />
          </div>
        </div>
        <div>
          <h1 className="text-base font-bold tracking-wider text-slate-100 uppercase leading-none">
            AGUJERO NEGRO
          </h1>
          <p className="text-xs text-slate-300 font-medium tracking-normal mt-1">
            por Emma Benveniste
          </p>
        </div>
      </div>

      {/* Navigation Bar: Modos y Selector de Vista & Detalles */}
      <nav className="flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800/80 shadow-2xl pointer-events-auto max-w-[calc(100vw-340px)] overflow-x-auto scrollbar-none">
        {/* Modos Principales (Anatomía 3D & Comparador de Escalas) */}
        <div className="flex items-center gap-1 shrink-0">
          {navItems.map((item) => {
            const isActive = currentMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectMode(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selector de Vista y Detalles (Ubicado junto al de anatomía y escalas) */}
        {currentMode === 'anatomy' && (
          <>
            <div className="h-5 w-px bg-slate-800/80 mx-1 shrink-0" />

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onSelectPart(null)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedPart === null
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vista General</span>
              </button>

              {ANATOMY_PARTS.map((part) => {
                const isSelected = selectedPart?.id === part.id;
                return (
                  <button
                    key={part.id}
                    onClick={() => onSelectPart(part)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: part.color }}
                    />
                    <span>{part.shortName}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Floating Audio Icon Button */}
      <div className="pointer-events-auto shrink-0">
        <button
          onClick={onToggleAudio}
          title={isAudioActive ? 'Silenciar drone cósmico' : 'Activar drone sonoro'}
          className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200 backdrop-blur-md shadow-xl ${
            isAudioActive
              ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-cyan-950/60 ring-2 ring-cyan-500/30'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
          }`}
        >
          {isAudioActive ? (
            <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
};
