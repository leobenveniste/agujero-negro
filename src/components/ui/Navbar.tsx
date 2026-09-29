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
    <header className="absolute top-0 left-0 right-0 z-30 px-3 md:px-5 py-3 md:py-4 pointer-events-none">
      {/* Top Header Row: Brand, Desktop Nav (md+), and Audio button */}
      <div className="flex items-center justify-between gap-2">
        {/* Brand: AGUJERO NEGRO por Emma Benveniste */}
        <div className="flex items-center gap-2.5 pointer-events-auto shrink-0">
          <div className="relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-amber-500 via-orange-600 to-black p-[1.5px] shadow-lg shadow-orange-950/40">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <div className="w-3 md:w-3.5 h-3 md:h-3.5 rounded-full bg-cyan-400 blur-[1px] animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold tracking-wider text-slate-100 uppercase leading-none">
              AGUJERO NEGRO
            </h1>
            <p className="text-[10px] md:text-xs text-slate-300 font-medium tracking-normal mt-0.5">
              por Emma Benveniste
            </p>
          </div>
        </div>

        {/* Desktop Navigation Bar (md and up: >= 768px) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800/80 shadow-2xl pointer-events-auto max-w-[calc(100vw-340px)] overflow-x-auto scrollbar-none">
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

          {/* Selector de Vista y Detalles en Desktop */}
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
            className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border transition-all duration-200 backdrop-blur-md shadow-xl ${
              isAudioActive
                ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-cyan-950/60 ring-2 ring-cyan-500/30'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
            }`}
          >
            {isAudioActive ? (
              <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400 animate-pulse" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Controls (< md: < 768px) */}
      <div className="md:hidden mt-2 flex flex-col gap-1.5 items-center pointer-events-auto">
        {/* Mode Selector (Segmented control) */}
        <div className="flex items-center w-full max-w-[320px] bg-slate-950/85 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl">
          {navItems.map((item) => {
            const isActive = currentMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectMode(item.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.id === 'scale' ? 'Comparador' : item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Anatomy Sub-Views on Mobile (Scrollable horizontal chips) */}
        {currentMode === 'anatomy' && (
          <div className="flex items-center gap-1.5 max-w-full overflow-x-auto py-0.5 px-1 scrollbar-none">
            <button
              onClick={() => onSelectPart(null)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap backdrop-blur-md border transition-all ${
                selectedPart === null
                  ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800/80 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>Vista General</span>
            </button>

            {ANATOMY_PARTS.map((part) => {
              const isSelected = selectedPart?.id === part.id;
              return (
                <button
                  key={part.id}
                  onClick={() => onSelectPart(part)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap backdrop-blur-md border transition-all ${
                    isSelected
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-sm font-semibold'
                      : 'bg-slate-950/80 text-slate-400 border-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: part.color }}
                  />
                  <span>{part.shortName}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
