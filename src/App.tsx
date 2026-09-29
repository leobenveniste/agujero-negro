import React, { useState } from 'react';
import type { ViewMode, AnatomyPart, CelestialObject } from './types/blackhole';
import { CELESTIAL_OBJECTS } from './data/celestialObjects';
import { cosmicAudio } from './utils/audio';

// 3D Viewport Scenes
import { BlackHoleScene } from './components/3d/BlackHoleScene';
import { ScaleComparisonScene } from './components/3d/ScaleComparisonScene';

// UI Overlays
import { Navbar } from './components/ui/Navbar';
import { AnatomyOverlay } from './components/ui/AnatomyOverlay';
import { ScaleComparatorOverlay } from './components/ui/ScaleComparatorOverlay';

export const App: React.FC = () => {
  // Navigation & Audio State
  const [currentMode, setCurrentMode] = useState<ViewMode>('anatomy');
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);

  // Mode 1: Anatomy State (All layers always active)
  const [selectedPart, setSelectedPart] = useState<AnatomyPart | null>(null);

  // Mode 2: Scale Comparison State
  const [primaryObject, setPrimaryObject] = useState<CelestialObject>(
    CELESTIAL_OBJECTS.find((o) => o.id === 'earth') || CELESTIAL_OBJECTS[0]
  );
  const [secondaryObject, setSecondaryObject] = useState<CelestialObject>(
    CELESTIAL_OBJECTS.find((o) => o.id === 'sun') || CELESTIAL_OBJECTS[5]
  );

  const handleToggleAudio = () => {
    const active = cosmicAudio.toggle();
    setIsAudioActive(active);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020204] text-slate-100 select-none">
      {/* Universal Top Header / Navbar with View & Details Selector */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        selectedPart={selectedPart}
        onSelectPart={setSelectedPart}
        isAudioActive={isAudioActive}
        onToggleAudio={handleToggleAudio}
      />

      {/* 3D Viewport Rendering according to mode */}
      <main className="absolute inset-0 w-full h-full">
        {currentMode === 'anatomy' && (
          <BlackHoleScene
            selectedPart={selectedPart}
            onSelectPart={setSelectedPart}
          />
        )}

        {currentMode === 'scale' && (
          <ScaleComparisonScene
            primaryObject={primaryObject}
            secondaryObject={secondaryObject}
          />
        )}
      </main>

      {/* Contextual UI HUD Overlays */}
      {currentMode === 'anatomy' && (
        <AnatomyOverlay
          selectedPart={selectedPart}
          onSelectPart={setSelectedPart}
        />
      )}

      {currentMode === 'scale' && (
        <ScaleComparatorOverlay
          primaryObject={primaryObject}
          setPrimaryObject={setPrimaryObject}
          secondaryObject={secondaryObject}
          setSecondaryObject={setSecondaryObject}
        />
      )}
    </div>
  );
};

export default App;
