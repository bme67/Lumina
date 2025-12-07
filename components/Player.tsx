import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PlayIcon, PauseIcon, VolumeIcon, MuteIcon, FullscreenIcon, ExitFullscreenIcon, BackIcon } from './Icons';
import { VideoData } from '../types';

interface PlayerProps {
  video: VideoData;
  onBack: () => void;
}

export const Player: React.FC<PlayerProps> = ({ video, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const controlsTimeoutRef = useRef<number | null>(null);
  const prevVolumeRef = useRef(1);

  const videoUrl = React.useMemo(() => {
    return URL.createObjectURL(video.blob);
  }, [video.blob]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSpeedMenu(false);
      }
    }, 2000);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const updateTime = () => setProgress(v.currentTime);
    const updateDuration = () => setDuration(v.duration);
    const onEnded = () => setIsPlaying(false);

    // Apply initial playback rate
    v.playbackRate = playbackRate;
    v.volume = volume;

    v.addEventListener('timeupdate', updateTime);
    v.addEventListener('loadedmetadata', updateDuration);
    v.addEventListener('ended', onEnded);

    return () => {
      v.removeEventListener('timeupdate', updateTime);
      v.removeEventListener('loadedmetadata', updateDuration);
      v.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    setShowSpeedMenu(false);
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        // Unmute: restore previous volume
        const restoredVolume = prevVolumeRef.current || 1;
        videoRef.current.volume = restoredVolume;
        videoRef.current.muted = false;
        setVolume(restoredVolume);
        setIsMuted(false);
      } else {
        // Mute: save current volume
        prevVolumeRef.current = volume;
        videoRef.current.volume = 0;
        videoRef.current.muted = true;
        setVolume(0);
        setIsMuted(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (t: number) => {
    if (isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex flex-col"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) {
            setShowControls(false);
            setShowSpeedMenu(false);
        }
      }}
    >
      <div className={`absolute top-0 left-0 right-0 p-6 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button 
          onClick={onBack}
          className="text-white/80 hover:text-white flex items-center gap-2 group"
        >
          <BackIcon size={24} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-light tracking-wide text-sm">Back</span>
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-h-full max-w-full outline-none"
          autoPlay
          onPlay={() => setIsPlaying(true)}
        />
        
        {/* Center Play Button Overlay if paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all scale-100 hover:scale-105">
              <PlayIcon size={32} className="text-white ml-1" />
            </div>
          </div>
        )}
      </div>

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-20 pb-6 px-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-4xl mx-auto w-full">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={progress}
            onChange={handleSeek}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white mb-4 hover:h-1.5 transition-all"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={togglePlay} className="text-white hover:text-gray-300 transition-colors">
                {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
              </button>
              
              <div className="flex items-center gap-2 group">
                <button onClick={toggleMute} className="text-white hover:text-gray-300 transition-colors">
                  {isMuted ? <MuteIcon size={20} /> : <VolumeIcon size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (videoRef.current) videoRef.current.volume = v;
                    
                    if (v === 0) {
                        setIsMuted(true);
                        if (videoRef.current) videoRef.current.muted = true;
                    } else {
                        setIsMuted(false);
                        if (videoRef.current) videoRef.current.muted = false;
                        prevVolumeRef.current = v; // Update prev volume while dragging
                    }
                  }}
                  className="w-0 overflow-hidden group-hover:w-20 transition-all duration-300 h-1 accent-white bg-white/20 rounded-lg"
                />
              </div>

              <span className="text-white/60 text-xs font-mono tracking-wider">
                {formatTime(progress)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-white font-medium text-sm tracking-wide mr-4">
                {video.title}
              </span>
              
              {/* Playback Speed Control */}
              <div className="relative">
                {showSpeedMenu && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-black/90 border border-white/10 rounded-lg p-1 min-w-[50px] flex flex-col shadow-xl z-30 backdrop-blur-md">
                     {[2.5, 2, 1.5, 1, 0.5].map((rate) => (
                       <button
                         key={rate}
                         onClick={(e) => {
                            e.stopPropagation();
                            handleSpeedChange(rate);
                         }}
                         className={`py-1.5 px-2 text-xs rounded-md transition-colors ${
                           playbackRate === rate 
                             ? 'bg-white/20 text-white font-bold' 
                             : 'text-white/70 hover:text-white hover:bg-white/10'
                         }`}
                       >
                         {rate}x
                       </button>
                     ))}
                  </div>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSpeedMenu(!showSpeedMenu);
                  }}
                  className="text-white/80 hover:text-white transition-colors text-xs font-medium bg-white/10 px-2 py-1 rounded hover:bg-white/20 w-[42px]"
                  title="Playback Speed"
                >
                  {playbackRate}x
                </button>
              </div>

              <button onClick={toggleFullscreen} className="text-white hover:text-gray-300 transition-colors">
                {isFullscreen ? <ExitFullscreenIcon size={20} /> : <FullscreenIcon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};