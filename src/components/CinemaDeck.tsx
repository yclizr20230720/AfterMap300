import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Download, 
  Sliders, 
  Maximize, 
  Eye, 
  EyeOff, 
  Compass, 
  Navigation, 
  Share2, 
  Copy, 
  Check, 
  Layers,
  Sparkles,
  Ratio,
  Info
} from 'lucide-react';
import { VideoProject } from '../types/aftermap';

interface CinemaDeckProps {
  currentVideo: VideoProject | null;
  onRemixFlight: (video: VideoProject) => void;
  onSelectVideo: (video: VideoProject) => void;
  allVideos: VideoProject[];
}

export const CinemaDeck: React.FC<CinemaDeckProps> = ({
  currentVideo,
  onRemixFlight,
  onSelectVideo,
  allVideos,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showHud, setShowHud] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  }, [currentVideo]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 8);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const copyPrompt = () => {
    if (!currentVideo) return;
    navigator.clipboard.writeText(currentVideo.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentVideo) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
          <Compass className="w-8 h-8 animate-spin" />
        </div>
        <h3 className="text-base font-bold font-mono text-zinc-200">No Video Loaded</h3>
        <p className="text-xs font-mono text-zinc-400 max-w-sm mx-auto">
          Generate a flight video using Veo 3 or select an aerial sequence from the showcase library.
        </p>
      </div>
    );
  }

  const isPortrait = currentVideo.aspectRatio === '9:16';
  const progressRatio = duration > 0 ? currentTime / duration : 0;

  // Simulated dynamic telemetry values synchronized with playback
  const simAltitude = Math.round(
    (currentVideo.flightData?.maxAltitude || 450) * (0.6 + 0.4 * Math.sin(progressRatio * Math.PI))
  );
  const simSpeed = Math.round(
    (currentVideo.flightData?.avgSpeed || 120) * (0.8 + 0.3 * Math.cos(progressRatio * Math.PI * 2))
  );
  const simHeading = Math.round((45 + progressRatio * 180) % 360);
  const simPitch = Math.round(-12 + Math.sin(progressRatio * Math.PI * 2) * 8);
  const simRoll = Math.round(Math.cos(progressRatio * Math.PI * 3) * 14);

  return (
    <div className="space-y-6">
      {/* Video Theater Canvas */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Top Control Bar inside theater */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-sm font-bold font-mono text-zinc-100 truncate max-w-md">
              {currentVideo.title}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-amber-500/20 font-bold">
              {currentVideo.aspectRatio}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
              {currentVideo.resolution}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle HUD */}
            <button
              onClick={() => setShowHud(!showHud)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono border transition-all ${
                showHud
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {showHud ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>HUD Telemetry</span>
            </button>

            {/* Direct Download */}
            <a
              href={currentVideo.videoUrl}
              download={`${currentVideo.title.toLowerCase().replace(/\s+/g, '_')}_veo3.mp4`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download MP4</span>
            </a>
          </div>
        </div>

        {/* Video Viewport Container */}
        <div className="flex justify-center items-center bg-black/60 rounded-2xl overflow-hidden relative select-none">
          <div
            className={`relative flex items-center justify-center transition-all ${
              isPortrait
                ? 'w-full max-w-[340px] sm:max-w-[400px] aspect-[9/16] shadow-2xl rounded-2xl overflow-hidden ring-1 ring-zinc-800'
                : 'w-full aspect-[16/9] shadow-2xl rounded-2xl overflow-hidden ring-1 ring-zinc-800'
            }`}
          >
            <video
              ref={videoRef}
              src={currentVideo.videoUrl}
              loop
              muted={isMuted}
              playsInline
              autoPlay
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onClick={togglePlay}
              className="w-full h-full object-cover cursor-pointer"
            />

            {/* OVERLAY: AfterMap 300 Cockpit Telemetry HUD */}
            {showHud && (
              <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between text-amber-400 font-mono text-[10px] select-none">
                {/* HUD Top Bar */}
                <div className="flex justify-between items-start">
                  <div className="bg-black/40 backdrop-blur-sm p-1.5 rounded border border-amber-500/30 space-y-0.5">
                    <div>AFTERMAP 300 // RECON TELEMETRY</div>
                    <div className="text-zinc-300">
                      LOC: {currentVideo.flightData?.coordinates || '35.6595° N, 139.7005° E'}
                    </div>
                    <div className="text-zinc-400">FPS: 60.0 // SENSOR: RTK LOCK</div>
                  </div>

                  <div className="bg-black/40 backdrop-blur-sm p-1.5 rounded border border-amber-500/30 text-right space-y-0.5">
                    <div>OPTICS: VEO 3 1080P</div>
                    <div className="text-zinc-300">ROLL: {simRoll}° | PITCH: {simPitch}°</div>
                    <div className="text-emerald-400 font-bold">STATE: NOMINAL</div>
                  </div>
                </div>

                {/* HUD Center Artificial Horizon Reticle */}
                <div className="self-center flex flex-col items-center justify-center">
                  <div
                    className="relative w-28 h-28 border border-amber-500/30 rounded-full flex items-center justify-center transition-transform duration-100"
                    style={{ transform: `rotate(${simRoll}deg)` }}
                  >
                    {/* Horizon line */}
                    <div className="w-16 h-0.5 bg-amber-400/80" />
                    <div className="absolute w-0.5 h-3 bg-amber-400 -top-1" />
                    <div className="absolute w-0.5 h-3 bg-amber-400 -bottom-1" />
                    {/* Pitch Ladder notches */}
                    <div className="absolute w-6 h-0.5 bg-amber-400/40 -top-4" />
                    <div className="absolute w-6 h-0.5 bg-amber-400/40 -bottom-4" />
                  </div>
                  <div className="mt-1 text-[9px] text-amber-300/80 tracking-widest">
                    PITCH {simPitch > 0 ? `+${simPitch}` : simPitch}°
                  </div>
                </div>

                {/* HUD Bottom Tape Readouts */}
                <div className="flex justify-between items-end">
                  {/* Speed Tape */}
                  <div className="bg-black/40 backdrop-blur-sm p-1.5 rounded border border-amber-500/30 space-y-0.5">
                    <div className="text-zinc-400">GROUND SPEED</div>
                    <div className="text-sm font-bold text-amber-300">{simSpeed} KM/H</div>
                    <div className="text-[9px] text-zinc-400">MACH {(simSpeed / 1234).toFixed(2)}</div>
                  </div>

                  {/* Heading Indicator */}
                  <div className="bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded border border-amber-500/30 text-center">
                    <div className="text-[9px] text-zinc-400">HDG</div>
                    <div className="text-xs font-bold text-amber-300">{simHeading}°</div>
                  </div>

                  {/* Altitude Tape */}
                  <div className="bg-black/40 backdrop-blur-sm p-1.5 rounded border border-amber-500/30 text-right space-y-0.5">
                    <div className="text-zinc-400">ALTITUDE AGL</div>
                    <div className="text-sm font-bold text-amber-300">{simAltitude} M</div>
                    <div className="text-[9px] text-zinc-400">{(simAltitude * 3.28084).toFixed(0)} FT</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Scrubber & Playback Controls */}
        <div className="mt-4 space-y-3">
          {/* Progress bar */}
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max={duration || 1}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-400">
              <span>{formatTimecode(currentTime)}</span>
              <span>{formatTimecode(duration)}</span>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              {/* Mute */}
              <button
                onClick={toggleMute}
                className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Speed Buttons */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5">
                {[0.5, 1, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleRateChange(rate)}
                    className={`px-2 py-1 text-[11px] font-mono rounded-lg transition-colors ${
                      playbackRate === rate
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRemixFlight(currentVideo)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs hover:bg-amber-500/20 transition-all"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Remix in Map Studio</span>
              </button>

              <button
                onClick={copyPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs hover:bg-zinc-800 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
              </button>

              <button
                onClick={handleFullscreen}
                className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Log & Metadata Details */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
              Flight Telemetry & Prompt Specification
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Render Engine: <strong className="text-amber-400">veo-3.1-fast-generate-preview</strong>
          </span>
        </div>

        {/* Prompt string */}
        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-1.5">
          <div className="text-[11px] font-mono text-zinc-400 uppercase">SYNTHESIS PROMPT:</div>
          <p className="text-xs font-mono text-zinc-200 leading-relaxed">
            "{currentVideo.prompt}"
          </p>
        </div>

        {/* Telemetry specs grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
            <div className="text-zinc-500 text-[10px]">TARGET LOCATION</div>
            <div className="text-zinc-200 font-bold truncate mt-0.5">
              {currentVideo.flightData?.location || 'Aerial Vector'}
            </div>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
            <div className="text-zinc-500 text-[10px]">ASPECT RATIO</div>
            <div className="text-amber-400 font-bold mt-0.5">
              {currentVideo.aspectRatio} ({currentVideo.aspectRatio === '16:9' ? 'Landscape' : 'Portrait'})
            </div>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
            <div className="text-zinc-500 text-[10px]">PEAK ALTITUDE</div>
            <div className="text-cyan-400 font-bold mt-0.5">
              {currentVideo.flightData?.maxAltitude || 450} m AGL
            </div>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
            <div className="text-zinc-500 text-[10px]">TRAJECTORY DYNAMICS</div>
            <div className="text-emerald-400 font-bold mt-0.5">
              {currentVideo.flightData?.flightStyle || 'Smooth Glide'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames
    .toString()
    .padStart(2, '0')}`;
}
