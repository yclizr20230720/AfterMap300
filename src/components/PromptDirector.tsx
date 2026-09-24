import React, { useState } from 'react';
import { 
  Sparkles, 
  Video, 
  Ratio, 
  Sliders, 
  Camera, 
  Sun, 
  RefreshCw, 
  Wand2, 
  Info,
  CheckCircle2,
  Film,
  Zap,
  ArrowRight
} from 'lucide-react';
import { AspectRatio, Resolution, Waypoint } from '../types/aftermap';
import { FLIGHT_STYLES, OPTICAL_LENSES, LIGHTING_PRESETS, LocationPreset } from '../data/presets';

interface PromptDirectorProps {
  prompt: string;
  setPrompt: (p: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  resolution: Resolution;
  setResolution: (r: Resolution) => void;
  flightStyle: string;
  setFlightStyle: (s: string) => void;
  lensType: string;
  setLensType: (l: string) => void;
  lighting: string;
  setLighting: (l: string) => void;
  selectedLocation: LocationPreset;
  waypoints: Waypoint[];
  onGenerateVideo: () => void;
  isGenerating: boolean;
}

export const PromptDirector: React.FC<PromptDirectorProps> = ({
  prompt,
  setPrompt,
  aspectRatio,
  setAspectRatio,
  resolution,
  setResolution,
  flightStyle,
  setFlightStyle,
  lensType,
  setLensType,
  lighting,
  setLighting,
  selectedLocation,
  waypoints,
  onGenerateVideo,
  isGenerating,
}) => {
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhancementNotice, setEnhancementNotice] = useState<string | null>(null);

  // Gemini 3.8 Flash Prompt Enhancer
  const handleEnhanceWithAI = async () => {
    setIsEnhancing(true);
    setEnhancementNotice(null);
    try {
      const avgAltitude = Math.round(
        waypoints.reduce((acc, wp) => acc + wp.altitude, 0) / (waypoints.length || 1)
      );
      const avgSpeed = Math.round(
        waypoints.reduce((acc, wp) => acc + wp.speed, 0) / (waypoints.length || 1)
      );

      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basePrompt: prompt,
          location: `${selectedLocation.name} (${selectedLocation.coordinates})`,
          flightStyle: flightStyle,
          altitude: `Average ${avgAltitude}m AGL (${waypoints.length} choreographed waypoints)`,
          lighting: lighting,
          speed: `${avgSpeed} km/h`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to enhance prompt');
      }

      const data = await res.json();
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
        setEnhancementNotice('Prompt enhanced with Gemini 3.8 Flash for Veo 3 optics!');
        setTimeout(() => setEnhancementNotice(null), 5000);
      }
    } catch (err: any) {
      console.warn('AI enhancement fallback:', err.message);
      // Fallback enhancement if API key is not ready or network offline
      const enriched = `${prompt} Captured with ${lensType}, ${lighting}, continuous stabilized motion vector with cinematic depth of field, photorealistic 1080p aerial rendering.`;
      setPrompt(enriched);
      setEnhancementNotice('Prompt enriched with aerial director optics presets.');
      setTimeout(() => setEnhancementNotice(null), 4000);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Model announcement header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold font-mono text-zinc-100 uppercase tracking-wider">
                Veo 3 Flight Director
              </h2>
              <span className="text-[10px] font-mono bg-zinc-800 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                veo-3.1-fast-generate-preview
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Configured for cinematic aerial flythroughs & cartography synthesis
            </p>
          </div>
        </div>

        {/* Resolution selector */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setResolution('1080p')}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all ${
              resolution === '1080p'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            1080p Master
          </button>
          <button
            onClick={() => setResolution('720p')}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all ${
              resolution === '720p'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            720p Fast
          </button>
        </div>
      </div>

      {/* Mandatory Aspect Ratio Control (16:9 landscape or 9:16 portrait) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-bold text-zinc-300 uppercase flex items-center gap-1.5">
            <Ratio className="w-3.5 h-3.5 text-amber-400" />
            Aspect Ratio (Veo 3 Standard)
          </label>
          <span className="text-[11px] font-mono text-zinc-400">
            Current: <span className="text-amber-400 font-bold">{aspectRatio}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 16:9 Landscape Option */}
          <button
            type="button"
            onClick={() => setAspectRatio('16:9')}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
              aspectRatio === '16:9'
                ? 'bg-amber-500/10 border-amber-500 text-zinc-100 ring-1 ring-amber-500/30'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <div className="w-10 h-7 rounded border border-current flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5 bg-black/40">
              16:9
            </div>
            <div>
              <div className="text-xs font-bold font-mono text-zinc-200 flex items-center gap-1.5">
                <span>16:9 Landscape</span>
                {aspectRatio === '16:9' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Cinematic widescreen, IMAX drone sweeps, desktop presentations
              </div>
            </div>
          </button>

          {/* 9:16 Portrait Option */}
          <button
            type="button"
            onClick={() => setAspectRatio('9:16')}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
              aspectRatio === '9:16'
                ? 'bg-amber-500/10 border-amber-500 text-zinc-100 ring-1 ring-amber-500/30'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <div className="w-7 h-10 rounded border border-current flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5 bg-black/40">
              9:16
            </div>
            <div>
              <div className="text-xs font-bold font-mono text-zinc-200 flex items-center gap-1.5">
                <span>9:16 Portrait</span>
                {aspectRatio === '9:16' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Vertical reels, mobile feeds, skyscraper ascending fly-ups
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Optical Lens & Lighting Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Optical Lens */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold text-zinc-300 uppercase flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            Camera Optics & Lens
          </label>
          <select
            value={lensType}
            onChange={(e) => setLensType(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            {OPTICAL_LENSES.map((lens) => (
              <option key={lens.id} value={lens.label}>
                {lens.label}
              </option>
            ))}
          </select>
        </div>

        {/* Lighting Atmosphere */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold text-zinc-300 uppercase flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            Atmosphere & Lighting
          </label>
          <select
            value={lighting}
            onChange={(e) => setLighting(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            {LIGHTING_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Flight Style Selector */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-bold text-zinc-300 uppercase flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Camera Trajectory Dynamic
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FLIGHT_STYLES.map((style) => {
            const isSelected = flightStyle === style.name;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setFlightStyle(style.name)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/60 text-zinc-100 ring-1 ring-amber-500/30'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span className="text-[9px] font-mono px-1 rounded bg-zinc-800 text-amber-400 block mb-1 w-fit">
                  {style.badge}
                </span>
                <span className="text-xs font-bold font-mono block text-zinc-200 truncate">{style.name}</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">{style.altRange}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-bold text-zinc-300 uppercase flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            Veo 3 Aerial Prompt
          </label>
          <button
            type="button"
            onClick={handleEnhanceWithAI}
            disabled={isEnhancing || isGenerating}
            className="flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 hover:from-amber-500/30 hover:to-orange-500/30 transition-all disabled:opacity-50"
          >
            {isEnhancing ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-400" />
            )}
            <span>Enhance with Gemini 3.8 Flash</span>
          </button>
        </div>

        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your aerial flight flythrough, lighting, terrain, and camera motion..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
        />

        {enhancementNotice && (
          <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{enhancementNotice}</span>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <button
        type="button"
        onClick={onGenerateVideo}
        disabled={isGenerating || !prompt.trim()}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:via-orange-400 hover:to-amber-500 text-zinc-950 font-bold font-mono text-sm tracking-wider uppercase transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <Video className="w-4 h-4" />
        <span>Generate Video with Veo 3 ({aspectRatio})</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
        <span>Model: veo-3.1-fast-generate-preview</span>
        <span>Resolution: {resolution}</span>
        <span>Aspect: {aspectRatio}</span>
      </div>
    </div>
  );
};
