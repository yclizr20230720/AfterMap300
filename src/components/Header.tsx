import React from 'react';
import { Compass, Video, Layers, Sparkles, Film, ShieldCheck, MapPin } from 'lucide-react';
import { AspectRatio } from '../types/aftermap';

interface HeaderProps {
  activeTab: 'studio' | 'cinema' | 'gallery';
  setActiveTab: (tab: 'studio' | 'cinema' | 'gallery') => void;
  aspectRatio: AspectRatio;
  waypointCount: number;
  selectedLocation: string;
  isGenerating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  aspectRatio,
  waypointCount,
  selectedLocation,
  isGenerating,
}) => {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30">
            <Compass className="w-5 h-5 text-white animate-[spin_18s_linear_infinite]" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-wider text-zinc-100 font-mono">
                AFTER<span className="text-amber-400">MAP</span> <span className="text-xs bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono border border-zinc-700">300</span>
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono tracking-tight font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" /> VEO 3 ACCELERATED
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono hidden sm:block truncate max-w-xs">
              Aerial Cartography & AI Video Synthesis
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'studio'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Map Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('cinema')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
              activeTab === 'cinema'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Cinema Deck</span>
            {isGenerating && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-1 -right-1" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'gallery'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Gallery</span>
          </button>
        </nav>

        {/* Right Status Indicators */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span className="text-zinc-300 truncate max-w-[130px]">{selectedLocation}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono">
            <span className="text-zinc-500">FORMAT:</span>
            <span className="text-amber-400 font-bold">{aspectRatio}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-zinc-300">VEO-3.1</span>
          </div>
        </div>
      </div>
    </header>
  );
};
