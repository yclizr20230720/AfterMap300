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
  onRunSimulation?: () => void;
}

export const RenderMonitor: React.FC<RenderMonitorProps> = ({
  status,
  onCancel,
  onDismissError,
  onTestWithSample,
  onRunSimulation,
}) => {
  if (!status.isGenerating && !status.error) return null;

  // Safely parse JSON error strings to avoid raw JSON dumps in UI
  let cleanErrorMessage = status.error || '';
  let isQuotaExhausted = false;

  if (status.error) {
    const errorStr = status.error.trim();
    if (errorStr.startsWith('{')) {
      try {
        const parsed = JSON.parse(errorStr);
        if (parsed.error?.message) {
          cleanErrorMessage = parsed.error.message;
        } else if (parsed.message) {
          cleanErrorMessage = parsed.message;
        }
        if (parsed.error?.code === 429 || parsed.error?.status === 'RESOURCE_EXHAUSTED' || parsed.code === 429) {
          isQuotaExhausted = true;
        }
      } catch {
        // Fall back to original string
      }
    }

    if (
      cleanErrorMessage.includes('429') ||
      cleanErrorMessage.includes('quota') ||
      cleanErrorMessage.includes('RESOURCE_EXHAUSTED') ||
      cleanErrorMessage.includes('rate-limits')
    ) {
      isQuotaExhausted = true;
    }
  }

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
                Model: <span className="text-amber-400 font-bold">veo-3.1-lite-generate-preview</span>
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
            {isQuotaExhausted ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs font-mono text-amber-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Veo 3 Quota Limit Reached (429 Resource Exhausted)</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Google Veo 3 high-definition aerial video synthesis requires an active paid tier with Cloud billing. Free or trial quotas do not include Veo synthesis credits.
                </p>
                <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800 text-[10px] text-zinc-400 space-y-1">
                  <div>
                    <span className="text-zinc-300">Solution: </span>
                    <span>You can run our </span>
                    <strong className="text-amber-400">Flight Simulator</strong>
                    <span> to preview this mission telemetry without consuming any quota, or configure a paid key in Settings &gt; Secrets.</span>
                  </div>
                  <div>
                    <a
                      href="https://ai.google.dev/gemini-api/docs/rate-limits"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 underline hover:text-amber-300 transition-colors"
                    >
                      Gemini API Quotas & Billing Docs &rarr;
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-xs font-mono text-rose-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Synthesis Alert</span>
                </div>
                <p className="text-rose-300/90 leading-relaxed text-[11px]">
                  {cleanErrorMessage}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {onRunSimulation && (
                <button
                  onClick={onRunSimulation}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-bold font-mono text-xs hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Synthesize with Flight Simulator (Quota-Free)</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={onTestWithSample}
                  className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs hover:bg-zinc-850 hover:text-zinc-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span>Showcase Flights</span>
                </button>
                <button
                  onClick={onDismissError}
                  className="py-2 px-4 rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono text-xs hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
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
