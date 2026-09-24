import React from 'react';
import { 
  Sparkles, 
  Video, 
  Activity, 
  Radio, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Film,
  X
} from 'lucide-react';
import { GenerationStatus } from '../types/aftermap';

interface RenderMonitorProps {
  status: GenerationStatus;
  onCancel?: () => void;
  onDismissError: () => void;
  onTestWithSample: () => void;
}

export const RenderMonitor: React.FC<RenderMonitorProps> = ({
  status,
  onCancel,
  onDismissError,
  onTestWithSample,
}) => {
  if (!status.isGenerating && !status.error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-zinc-100 uppercase tracking-wider">
                {status.error ? 'Generation Interrupted' : 'Veo 3 Neural Synthesis'}
              </h3>
              <p className="text-[11px] font-mono text-zinc-400">
                Model: <span className="text-amber-400 font-bold">veo-3.1-fast-generate-preview</span>
              </p>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-amber-400 font-bold">
            {status.aspectRatio}
          </div>
        </div>

        {/* Content body */}
        {status.error ? (
          /* Error State */
          <div className="space-y-4">
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-xs font-mono text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Backend Error Encountered</span>
              </div>
              <p className="text-rose-300/90 leading-relaxed text-[11px]">
                {status.error}
              </p>
            </div>

            <div className="text-[11px] font-mono text-zinc-400 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
              <p>
                <strong>Tip:</strong> Ensure your Gemini API Key is configured in the environment or Settings panel. You can also explore preloaded AfterMap 300 aerial master simulations immediately in Cinema Deck.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onTestWithSample}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 text-zinc-950 font-bold font-mono text-xs hover:bg-amber-400 transition-colors flex items-center justify-center gap-1.5"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Explore Showcase Aerials</span>
              </button>
              <button
                onClick={onDismissError}
                className="py-2.5 px-4 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono text-xs hover:bg-zinc-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Generating State */
          <div className="space-y-6">
            {/* Visual radar / Progress indicator */}
            <div className="relative flex flex-col items-center justify-center py-4">
              <div className="w-32 h-32 rounded-full border-2 border-amber-500/20 flex items-center justify-center relative">
                {/* Rotating scanner ring */}
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400 border-r-orange-400 animate-spin" />
                <div className="absolute inset-3 rounded-full border border-zinc-800/80" />
                
                {/* Center time & percent */}
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black font-mono text-amber-400 tracking-tight">
                    {status.elapsedSeconds}s
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    ELAPSED
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full mt-6 space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Rendering Stage</span>
                  <span className="text-amber-400 font-bold">{Math.round(status.progressPercent)}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${Math.min(status.progressPercent, 98)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Current Stage Message */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-300 font-semibold">
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span className="truncate">{status.stageMessage}</span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 line-clamp-2 italic">
                "{status.prompt}"
              </p>
            </div>

            {/* Informational banner */}
            <div className="text-[11px] font-mono text-zinc-400 bg-zinc-950/80 border border-zinc-900 p-3 rounded-xl flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Veo 3 typically compiles cinematic videos in 60-90 seconds. Your stream will download and launch automatically.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
