/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { MapStudio } from './components/MapStudio';
import { PromptDirector } from './components/PromptDirector';
import { CinemaDeck } from './components/CinemaDeck';
import { ShowcaseGallery } from './components/ShowcaseGallery';
import { RenderMonitor } from './components/RenderMonitor';
import { AspectRatio, Resolution, Waypoint, VideoProject, GenerationStatus } from './types/aftermap';
import { LOCATION_PRESETS, LocationPreset, SHOWCASE_VIDEOS } from './data/presets';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'cinema' | 'gallery'>('studio');
  const [selectedLocation, setSelectedLocation] = useState<LocationPreset>(LOCATION_PRESETS[0]);
  
  // Waypoint state
  const [waypoints, setWaypoints] = useState<Waypoint[]>(() =>
    LOCATION_PRESETS[0].waypoints.map((w, idx) => ({
      id: `wp-${idx + 1}`,
      name: `WP-${idx + 1}`,
      x: w.x,
      y: w.y,
      altitude: w.altitude,
      speed: w.speed,
      heading: w.heading,
    }))
  );

  // Flight & Video Configuration (Veo 3 parameters)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [flightStyle, setFlightStyle] = useState<string>('Urban Motion Hyperlapse');
  const [lensType, setLensType] = useState<string>(LOCATION_PRESETS[0].recommendedLens);
  const [lighting, setLighting] = useState<string>(LOCATION_PRESETS[0].recommendedLighting);
  const [prompt, setPrompt] = useState<string>(LOCATION_PRESETS[0].defaultPrompt);

  // Gallery state
  const [videos, setVideos] = useState<VideoProject[]>(SHOWCASE_VIDEOS);
  const [currentVideo, setCurrentVideo] = useState<VideoProject | null>(SHOWCASE_VIDEOS[0]);

  // Generation status state
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    isGenerating: false,
    progressPercent: 0,
    stageMessage: '',
    elapsedSeconds: 0,
    error: null,
    aspectRatio: '16:9',
    prompt: '',
  });

  const pollIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Handle Preset Selection
  const handleSelectPreset = (preset: LocationPreset) => {
    setSelectedLocation(preset);
    setWaypoints(
      preset.waypoints.map((w, idx) => ({
        id: `wp-${idx + 1}`,
        name: `WP-${idx + 1}`,
        x: w.x,
        y: w.y,
        altitude: w.altitude,
        speed: w.speed,
        heading: w.heading,
      }))
    );
    setPrompt(preset.defaultPrompt);
    setAspectRatio(preset.recommendedAspect);
    setLighting(preset.recommendedLighting);
    setLensType(preset.recommendedLens);
  };

  // Handle Remix Flight Plan from an existing video
  const handleRemixFlight = (video: VideoProject) => {
    setPrompt(video.prompt);
    setAspectRatio(video.aspectRatio);
    setResolution(video.resolution);
    if (video.flightData?.flightStyle) {
      setFlightStyle(video.flightData.flightStyle);
    }
    setActiveTab('studio');
  };

  // Video generation flow with Veo 3
  const handleGenerateVideo = async () => {
    if (generationStatus.isGenerating) return;

    // Reset status
    setGenerationStatus({
      isGenerating: true,
      progressPercent: 5,
      stageMessage: 'Initializing Veo 3 neural tensor (veo-3.1-fast-generate-preview)...',
      elapsedSeconds: 0,
      error: null,
      aspectRatio: aspectRatio,
      prompt: prompt,
    });

    // Start elapsed timer
    let seconds = 0;
    timerIntervalRef.current = setInterval(() => {
      seconds += 1;
      setGenerationStatus((prev) => {
        // Calculate simulated progress up to 92% until done
        let newProgress = Math.min(10 + seconds * 1.2, 92);
        let msg = prev.stageMessage;
        if (seconds > 6 && seconds <= 20) {
          msg = 'Synthesizing topographical voxel terrain and elevation contours...';
        } else if (seconds > 20 && seconds <= 40) {
          msg = 'Raytracing atmospheric scattering, cloud density, and sunlight reflections...';
        } else if (seconds > 40 && seconds <= 60) {
          msg = 'Interpolating 60fps fluid camera motion vector and optical anamorphic flares...';
        } else if (seconds > 60) {
          msg = 'Assembling final 1080p MP4 master stream...';
        }
        return {
          ...prev,
          elapsedSeconds: seconds,
          progressPercent: newProgress,
          stageMessage: msg,
        };
      });
    }, 1000);

    try {
      // Step 1: Initiate video generation on backend
      console.log('[Veo 3] Requesting generation...');
      const genRes = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          aspectRatio: aspectRatio, // strictly '16:9' or '9:16'
          resolution: resolution,
        }),
      });

      if (!genRes.ok) {
        const errJson = await genRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${genRes.status}`);
      }

      const { operationName } = await genRes.json();
      console.log('[Veo 3] Operation started:', operationName);

      setGenerationStatus((prev) => ({
        ...prev,
        operationName,
        progressPercent: 18,
        stageMessage: 'Veo 3 operation created. Polling neural render queue...',
      }));

      // Step 2: Poll operation status every 5 seconds
      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch('/api/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName }),
          });

          if (!pollRes.ok) {
            const pollErr = await pollRes.json().catch(() => ({}));
            throw new Error(pollErr.error || 'Failed to poll video status');
          }

          const pollData = await pollRes.json();
          console.log('[Veo 3] Poll update:', pollData);

          if (pollData.error) {
            throw new Error(pollData.error);
          }

          if (pollData.done) {
            // Done! Clear intervals
            clearInterval(pollIntervalRef.current);
            clearInterval(timerIntervalRef.current);

            setGenerationStatus((prev) => ({
              ...prev,
              progressPercent: 96,
              stageMessage: 'Synthesis complete. Streaming 1080p MP4 to Cinema Deck...',
            }));

            // Step 3: Fetch and stream completed video
            const downloadRes = await fetch('/api/video-download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName }),
            });

            if (!downloadRes.ok) {
              const dlErr = await downloadRes.json().catch(() => ({}));
              throw new Error(dlErr.error || 'Failed to download generated video stream');
            }

            const videoBlob = await downloadRes.blob();
            const blobUrl = URL.createObjectURL(videoBlob);

            // Compute flight summary
            const avgAlt = Math.round(
              waypoints.reduce((acc, wp) => acc + wp.altitude, 0) / (waypoints.length || 1)
            );
            const avgSpd = Math.round(
              waypoints.reduce((acc, wp) => acc + wp.speed, 0) / (waypoints.length || 1)
            );

            const newProject: VideoProject = {
              id: `veo-${Date.now()}`,
              title: `${selectedLocation.name.split('&')[0].trim()} Flight`,
              prompt: prompt,
              aspectRatio: aspectRatio,
              resolution: resolution,
              videoUrl: blobUrl,
              createdAt: Date.now(),
              flightData: {
                location: selectedLocation.name,
                coordinates: selectedLocation.coordinates,
                maxAltitude: avgAlt,
                avgSpeed: avgSpd,
                flightStyle: flightStyle,
              },
            };

            setVideos((prev) => [newProject, ...prev]);
            setCurrentVideo(newProject);
            setActiveTab('cinema');

            setGenerationStatus({
              isGenerating: false,
              progressPercent: 100,
              stageMessage: 'Completed',
              elapsedSeconds: seconds,
              error: null,
              aspectRatio: aspectRatio,
              prompt: prompt,
            });
          }
        } catch (pollError: any) {
          console.error('[Veo 3] Polling error:', pollError);
          clearInterval(pollIntervalRef.current);
          clearInterval(timerIntervalRef.current);
          setGenerationStatus((prev) => ({
            ...prev,
            isGenerating: false,
            error: pollError.message || 'Operation failed during synthesis',
          }));
        }
      }, 5000);
    } catch (startError: any) {
      console.error('[Veo 3] Generation initiation error:', startError);
      clearInterval(pollIntervalRef.current);
      clearInterval(timerIntervalRef.current);
      setGenerationStatus((prev) => ({
        ...prev,
        isGenerating: false,
        error: startError.message || 'Failed to start Veo 3 generation',
      }));
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(pollIntervalRef.current);
      clearInterval(timerIntervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950 font-sans">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        aspectRatio={aspectRatio}
        waypointCount={waypoints.length}
        selectedLocation={selectedLocation.name.split(' ')[0]}
        isGenerating={generationStatus.isGenerating}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Cols: Interactive Map Studio & Topo Canvas */}
            <div className="lg:col-span-7 space-y-6">
              <MapStudio
                waypoints={waypoints}
                setWaypoints={setWaypoints}
                selectedPreset={selectedLocation}
                onSelectPreset={handleSelectPreset}
                flightStyle={flightStyle}
                onFlightStyleChange={setFlightStyle}
                aspectRatio={aspectRatio}
              />
            </div>

            {/* Right 5 Cols: Veo 3 Flight Director & Prompt Desk */}
            <div className="lg:col-span-5 space-y-6">
              <PromptDirector
                prompt={prompt}
                setPrompt={setPrompt}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                resolution={resolution}
                setResolution={setResolution}
                flightStyle={flightStyle}
                setFlightStyle={setFlightStyle}
                lensType={lensType}
                setLensType={setLensType}
                lighting={lighting}
                setLighting={setLighting}
                selectedLocation={selectedLocation}
                waypoints={waypoints}
                onGenerateVideo={handleGenerateVideo}
                isGenerating={generationStatus.isGenerating}
              />
            </div>
          </div>
        )}

        {activeTab === 'cinema' && (
          <div className="max-w-5xl mx-auto">
            <CinemaDeck
              currentVideo={currentVideo}
              onRemixFlight={handleRemixFlight}
              onSelectVideo={setCurrentVideo}
              allVideos={videos}
            />
          </div>
        )}

        {activeTab === 'gallery' && (
          <ShowcaseGallery
            videos={videos}
            onSelectVideo={(v) => {
              setCurrentVideo(v);
              setActiveTab('cinema');
            }}
            onDeleteVideo={(id) => {
              setVideos((prev) => prev.filter((v) => v.id !== id));
              if (currentVideo?.id === id) {
                setCurrentVideo(videos.find((v) => v.id !== id) || null);
              }
            }}
            onRemixFlight={handleRemixFlight}
          />
        )}
      </main>

      {/* Render Progress & Error Modal */}
      <RenderMonitor
        status={generationStatus}
        onDismissError={() =>
          setGenerationStatus((prev) => ({ ...prev, error: null, isGenerating: false }))
        }
        onTestWithSample={() => {
          setGenerationStatus((prev) => ({ ...prev, error: null, isGenerating: false }));
          setActiveTab('cinema');
        }}
      />
    </div>
  );
}
