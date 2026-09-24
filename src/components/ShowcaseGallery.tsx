import React, { useState } from 'react';
import { Play, Download, Trash2, Film, Layers, Compass, Ratio, Sparkles } from 'lucide-react';
import { VideoProject, AspectRatio } from '../types/aftermap';

interface ShowcaseGalleryProps {
  videos: VideoProject[];
  onSelectVideo: (video: VideoProject) => void;
  onDeleteVideo: (id: string) => void;
  onRemixFlight: (video: VideoProject) => void;
}

export const ShowcaseGallery: React.FC<ShowcaseGalleryProps> = ({
  videos,
  onSelectVideo,
  onDeleteVideo,
  onRemixFlight,
}) => {
  const [filterRatio, setFilterRatio] = useState<'all' | AspectRatio>('all');

  const filteredVideos = videos.filter((v) => {
    if (filterRatio === 'all') return true;
    return v.aspectRatio === filterRatio;
  });

  return (
    <div className="space-y-6">
      {/* Filter and stats header */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold font-mono text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-400" />
            <span>AfterMap Flight Archive & Showcase</span>
          </h2>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            Veo 3 AI generated flythroughs and cartographic flights
          </p>
        </div>

        {/* Aspect Ratio Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setFilterRatio('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              filterRatio === 'all'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Formats ({videos.length})
          </button>
          <button
            onClick={() => setFilterRatio('16:9')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              filterRatio === '16:9'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            16:9 Landscape
          </button>
          <button
            onClick={() => setFilterRatio('9:16')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              filterRatio === '9:16'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            9:16 Portrait
          </button>
        </div>
      </div>

      {/* Grid of videos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVideos.map((video) => {
          const isPortrait = video.aspectRatio === '9:16';
          return (
            <div
              key={video.id}
              className="bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col group shadow-xl"
            >
              {/* Media container */}
              <div
                onClick={() => onSelectVideo(video)}
                className={`relative bg-black cursor-pointer overflow-hidden flex items-center justify-center ${
                  isPortrait ? 'h-64' : 'h-48'
                }`}
              >
                <video
                  src={video.videoUrl}
                  muted
                  playsInline
                  loop
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Dark gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 pointer-events-none" />

                {/* Top badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-amber-400 border border-amber-500/30 font-bold">
                    {video.aspectRatio}
                  </span>

                  {video.isSample ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 backdrop-blur-sm">
                      CURATED
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 font-bold">
                      VEO 3 LIVE
                    </span>
                  )}
                </div>

                {/* Center play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5" />
                  </div>
                </div>

                {/* Bottom title on media */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 pointer-events-none">
                  <h3 className="text-xs font-bold font-mono text-zinc-100 truncate">
                    {video.title}
                  </h3>
                  <div className="text-[10px] font-mono text-zinc-400 truncate">
                    {video.flightData?.location || 'Aerial Sequence'}
                  </div>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-zinc-900/60">
                <p className="text-[11px] font-mono text-zinc-400 line-clamp-2 leading-relaxed">
                  "{video.prompt}"
                </p>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
                  <button
                    onClick={() => onRemixFlight(video)}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Remix Flight</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={video.videoUrl}
                      download={`${video.title.toLowerCase().replace(/\s+/g, '_')}.mp4`}
                      className="text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                      title="Download Video"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    {!video.isSample && (
                      <button
                        onClick={() => onDeleteVideo(video.id)}
                        className="text-rose-400 hover:text-rose-300 transition-colors p-1"
                        title="Delete from session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
