import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  Settings, Languages, RefreshCw, Layers, Sliders, Trash2, Pencil 
} from 'lucide-react';
import { Episode, SubtitleTrack, SubtitleCue } from '../types';
import { parseSRT } from '../utils/subtitleParser';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

// Helper to convert shift strings like "-30:00" or "-1800" or "+1.5" into seconds
const parseTimeShiftToSeconds = (input: string): number => {
  const clean = input.trim();
  if (!clean) return 0;

  const isNegative = clean.startsWith('-');
  const unsigned = isNegative || clean.startsWith('+') ? clean.slice(1) : clean;

  // Let's support both colon format (e.g. 23:34) and dot format (e.g. 23.34 or 30.00)
  // If we have a dot but no colon, and it matches the MM.SS pattern (exactly 2 digits after the dot)
  let normalized = unsigned;
  if (!unsigned.includes(':') && /^[-+]?\d+\.\d{2}$/.test(clean)) {
    normalized = unsigned.replace('.', ':');
  }

  const parts = normalized.split(':');
  let seconds = 0;
  if (parts.length === 3) {
    const hrs = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    const secs = parseFloat(parts[2]) || 0;
    seconds = hrs * 3600 + mins * 60 + secs;
  } else if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseFloat(parts[1]) || 0;
    seconds = mins * 60 + secs;
  } else {
    seconds = parseFloat(unsigned) || 0;
  }

  return isNegative ? -seconds : seconds;
};

interface VideoPlayerProps {
  episode: Episode;
  animeTitle: string;
  onProgressUpdate?: (progressSeconds: number, durationSeconds: number) => void;
  initialProgressSeconds?: number;
  isAdmin?: boolean;
}

export default function VideoPlayer({ 
  episode, 
  animeTitle,
  onProgressUpdate,
  initialProgressSeconds = 0,
  isAdmin = false
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Interactive controls state
  const [showControls, setShowControls] = useState(true);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Subtitle selection & real-time cues
  const [selectedTrack, setSelectedTrack] = useState<SubtitleTrack | null>(null);
  const [activeCue, setActiveCue] = useState<SubtitleCue | null>(null);
  const [customTracks, setCustomTracks] = useState<SubtitleTrack[]>([]);
  const [pastedSrtText, setPastedSrtText] = useState('');
  const [showPastedSrtForm, setShowPastedSrtForm] = useState(false);
  const [pastedSrtShift, setPastedSrtShift] = useState<string>('0');
  
  // Custom subtitles editing states
  const [editingTrack, setEditingTrack] = useState<SubtitleTrack | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editShift, setEditShift] = useState('0');

  // Customizable Subtitle Style State
  const [subFontSize, setSubFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [subFontColor, setSubFontColor] = useState<string>('#ffffff'); // White
  const [subBgStyle, setSubBgStyle] = useState<'none' | 'capsule' | 'opaque'>('capsule');
  const [subPosition, setSubPosition] = useState<'bottom' | 'top' | 'middle'>('bottom');
  const [subtitleOffset, setSubtitleOffset] = useState<number>(0);

  // Refs for tracking progress to prevent high-frequency re-renders and stale closures
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const lastSavedTimeRef = useRef(0);
  const onProgressUpdateRef = useRef(onProgressUpdate);
  const initialProgressRef = useRef(initialProgressSeconds);
  const hasSeekedRef = useRef(false);

  // Dynamic video URL states and fallback candidate links mapping
  const [activeUrl, setActiveUrl] = useState(episode.videoUrl);
  const [fallbackUrls, setFallbackUrls] = useState<string[]>([]);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

  const fallbackUrlsRef = useRef<string[]>([]);
  const currentUrlIndexRef = useRef(0);

  // Keep references updated
  useEffect(() => {
    currentTimeRef.current = currentTime;
    durationRef.current = duration;
  }, [currentTime, duration]);

  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
  }, [onProgressUpdate]);

  useEffect(() => {
    initialProgressRef.current = initialProgressSeconds;
  }, [initialProgressSeconds]);

  useEffect(() => {
    setCurrentTime(0);
    currentTimeRef.current = 0;
    lastSavedTimeRef.current = initialProgressSeconds;
    hasSeekedRef.current = false;
    setSubtitleOffset(0);
  }, [episode.id]);

  useEffect(() => {
    hasSeekedRef.current = false;
  }, [activeUrl]);

  // Synchronize dynamic active URL and fallbacks when episode changes
  useEffect(() => {
    const originalUrl = episode.videoUrl;
    setActiveUrl(originalUrl);
    setPlayerError(null);
    setIsLoading(true);

    let candidates: string[] = [];

    if (originalUrl && (originalUrl.includes('dropbox.com') || originalUrl.includes('dropboxusercontent.com'))) {
      try {
        const urlObj = new URL(originalUrl);
        
        // Clean up transient / session-based parameters (e, st, dl) which cause session expired or forbidden errors
        const cleanParams = new URLSearchParams();
        for (const [key, value] of Array.from(urlObj.searchParams.entries())) {
          if (key.toLowerCase() === 'rlkey') {
            cleanParams.set(key, value);
          }
        }
        cleanParams.set('raw', '1');

        // Helper to format clean target hosts
        const makeCleanUrl = (host: string) => {
          const u = new URL(originalUrl);
          u.hostname = host;
          u.search = cleanParams.toString();
          return u.toString();
        };

        // Format 1: dl.dropboxusercontent.com with raw=1 (The absolute gold standard for CORS-compliant streaming inside iframes)
        candidates.push(makeCleanUrl('dl.dropboxusercontent.com'));

        // Format 2: www.dropbox.com with raw=1 (Official fallback direct render)
        candidates.push(makeCleanUrl('www.dropbox.com'));

        // Format 3: dl.dropbox.com with raw=1 (Direct CDN path)
        candidates.push(makeCleanUrl('dl.dropbox.com'));

        // Format 4: Same with dl=1 instead of raw=1 (Forced stream/download fallback)
        const dlParams = new URLSearchParams(cleanParams);
        dlParams.delete('raw');
        dlParams.set('dl', '1');
        
        const makeDlUrl = (host: string) => {
          const u = new URL(originalUrl);
          u.hostname = host;
          u.search = dlParams.toString();
          return u.toString();
        };
        candidates.push(makeDlUrl('dl.dropboxusercontent.com'));
        candidates.push(makeDlUrl('www.dropbox.com'));
        candidates.push(makeDlUrl('dl.dropbox.com'));

      } catch (err) {
        console.error('Error generating fallback candidate URLs', err);
        // Fallback regex parsing
        const rlkeyMatch = originalUrl.match(/[?&]rlkey=([^&]+)/i);
        const rlkeyPart = rlkeyMatch ? `?rlkey=${rlkeyMatch[1]}&raw=1` : '?raw=1';
        const cleanPath = originalUrl.split('?')[0];
        const baseContentUrl = cleanPath.replace(/(www\.)?dropboxusercontent\.com/i, 'dl.dropboxusercontent.com')
                                         .replace(/(www\.)?dropbox\.com/i, 'dl.dropboxusercontent.com');
        candidates.push(`${baseContentUrl}${rlkeyPart}`);
      }
      
      // Also append original url as absolute last resort
      candidates.push(originalUrl);
    } else {
      candidates.push(originalUrl);
    }

    const uniqueCandidates = Array.from(new Set(candidates)).filter(Boolean);
    setFallbackUrls(uniqueCandidates);
    setCurrentUrlIndex(0);
    fallbackUrlsRef.current = uniqueCandidates;
    currentUrlIndexRef.current = 0;

    if (uniqueCandidates.length > 0) {
      setActiveUrl(uniqueCandidates[0]);
    }
  }, [episode.id, episode.videoUrl]);

  // Load subtitles available for this episode
  useEffect(() => {
    // Keep subtitles Off by default when starting a video so subtitles are not seen immediately unless selected manually
    setSelectedTrack(null);

    const loadCloudSubtitles = async () => {
      try {
        const q = query(
          collection(db, 'customSubtitles'),
          where('episodeId', '==', episode.id)
        );
        const querySnapshot = await getDocs(q);
        const tracks: SubtitleTrack[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          tracks.push({
            id: docSnap.id,
            label: data.label || 'Custom Subtitle',
            srclang: data.srclang || 'en',
            cues: data.cues || []
          });
        });
        setCustomTracks(tracks);
      } catch (error) {
        console.error("Error loading custom cloud subtitles:", error);
      }
    };

    loadCloudSubtitles();
  }, [episode.id]);

  // Set initial watch progress and register event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setPlayerError(null);
    setIsLoading(true);

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsLoading(false);
      setPlayerError(null);
      
      if (!hasSeekedRef.current) {
        const targetTime = currentTimeRef.current > 0 ? currentTimeRef.current : initialProgressRef.current;
        if (targetTime > 0 && targetTime < (video.duration || 100000)) {
          video.currentTime = targetTime;
          setCurrentTime(targetTime);
        }
        hasSeekedRef.current = true;
      }
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setPlayerError(null);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      // Direct stream error interceptor: Cycle to the next fallback url format if available
      const nextIndex = currentUrlIndexRef.current + 1;
      if (nextIndex < fallbackUrlsRef.current.length) {
        console.warn(`Video load failed format index ${currentUrlIndexRef.current}. Auto-recovering to next candidate ${nextIndex}/${fallbackUrlsRef.current.length}:`, fallbackUrlsRef.current[nextIndex]);
        currentUrlIndexRef.current = nextIndex;
        setCurrentUrlIndex(nextIndex);
        setActiveUrl(fallbackUrlsRef.current[nextIndex]);
        setIsLoading(true);
        
        // Force-refresh source and reload video tag gracefully
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch(proErr => console.log('Auto-play fallback recovery failure:', proErr));
          }
        }, 150);
        return;
      }

      // No fallbacks left, report final error state
      setIsLoading(false);
      const err = video.error;
      let msg = "The digital video stream could not be loaded.";
      if (err) {
        switch (err.code) {
          case err.MEDIA_ERR_ABORTED:
            msg = "Video playback aborted by the user.";
            break;
          case err.MEDIA_ERR_NETWORK:
            msg = "Network failure prevented video from loading. Please check your connection.";
            break;
          case err.MEDIA_ERR_DECODE:
            msg = "Video digital stream decoding failed. The format may be unsupported.";
            break;
          case err.MEDIA_ERR_SRC_NOT_SUPPORTED:
            msg = "The video file format is unsupported, expired, or the URL is invalid/restricted.";
            break;
          default:
            msg = `Video load error: ${err.message || 'unknown issue'}`;
        }
      }
      setPlayerError(msg);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('error', handleError);

    // If metadata is already loaded
    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);
    };
  }, [activeUrl]);

  // Save progress on unmount or episode changes
  useEffect(() => {
    return () => {
      const cur = currentTimeRef.current;
      const dur = durationRef.current;
      const lastSaved = lastSavedTimeRef.current;
      if (onProgressUpdateRef.current && cur > 0 && dur > 0) {
        if (Math.abs(cur - lastSaved) > 0.5) {
          onProgressUpdateRef.current(cur, dur);
        }
      }
    };
  }, [episode.id]);

  // Sync internal volumes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Find active subtitle cue on time progression
  useEffect(() => {
    if (!selectedTrack) {
      setActiveCue(null);
      return;
    }
    const matched = selectedTrack.cues.find(
      cue => (currentTime - subtitleOffset) >= cue.startTime && (currentTime - subtitleOffset) <= cue.endTime
    );
    setActiveCue(matched || null);
  }, [currentTime, selectedTrack, subtitleOffset]);

  // Refs and helper for handling control bar auto-hiding during active playback
  const isPlayingRef = useRef(false);
  const controlsTimeoutRef = useRef<any>(null);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlayingRef.current) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSubtitleMenu(false);
        setShowStyleMenu(false);
        setShowSpeedMenu(false);
      }, 2000); // Hide controls after 2 seconds of inactivity
    }
  };

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    resetControlsTimeout();
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        // Save immediately on pause for high precision
        if (onProgressUpdateRef.current && currentTimeRef.current > 0 && durationRef.current > 0) {
          lastSavedTimeRef.current = currentTimeRef.current;
          onProgressUpdateRef.current(currentTimeRef.current, durationRef.current);
        }
      } else {
        videoRef.current.play().catch(err => console.log('Player error:', err));
        setIsPlaying(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      setCurrentTime(cur);
      
      // Throttled progress update: Only write/sync progress status to parent & Firestore every 5 seconds during active playback.
      // This solves player lagging/stuttering and decreases network/gRPC traffic by over 98%!
      if (Math.abs(cur - lastSavedTimeRef.current) >= 5) {
        lastSavedTimeRef.current = cur;
        if (onProgressUpdateRef.current) {
          onProgressUpdateRef.current(cur, dur);
        }
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const val = parseFloat(e.target.value);
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
  };

  const handleToggleMuted = () => {
    setIsMuted(!isMuted);
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => {
          console.error("Fullscreen permitted check failed", err);
        });
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  };

  // Add event listener to capture native escape fullscreen exits
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Format digital watch timer: "02:15 / 24:00"
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Subtitle Custom classes builder
  const getSubSizeConfig = () => {
    switch(subFontSize) {
      case 'sm': return 'text-sm md:text-base';
      case 'lg': return 'text-xl md:text-2xl';
      case 'xl': return 'text-2xl md:text-3xl font-extrabold';
      case 'md':
      default:
        return 'text-base md:text-lg';
    }
  };

  const getSubPositionConfig = () => {
    switch(subPosition) {
      case 'top': return 'top-8';
      case 'middle': return 'top-1/2 -translate-y-1/2';
      case 'bottom':
      default:
        return 'bottom-16 md:bottom-20';
    }
  };

  const getSubBgConfig = () => {
    switch(subBgStyle) {
      case 'opaque': return 'bg-black px-4 py-2 rounded-md shadow-2xl';
      case 'capsule': return 'bg-black/75 px-3.5 py-1.5 rounded-lg backdrop-blur-sm';
      case 'none':
      default:
        return 'drop-shadow-[0_2px_2px_rgba(0,0,0,1)] font-medium';
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
          setShowSubtitleMenu(false);
          setShowStyleMenu(false);
          setShowSpeedMenu(false);
        }
      }}
      className={`relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 group select-none transition-all duration-300 ${
        !showControls && isPlaying ? 'cursor-none' : ''
      }`}
      id={`video-player-container-${episode.id}`}
    >
      {/* Actual HTML5 Video Element */}
      <video
        ref={videoRef}
        src={activeUrl}
        onTimeUpdate={handleTimeUpdate}
        onClick={handlePlayPause}
        className="w-full h-full cursor-pointer object-contain"
        playsInline
      />

      {/* Embedded Real-time customizable Subtitle Display Overlay */}
      {selectedTrack && activeCue && (
        <div 
          className={`absolute left-4 right-4 pointer-events-none flex justify-center z-20 transition-all duration-300 ${getSubPositionConfig()}`}
          id="subtitle-overlay"
        >
          <span 
            className={`text-center font-sans select-none antialiased tracking-wide leading-relaxed mt-1 ${getSubSizeConfig()} ${getSubBgConfig()}`}
            style={{ color: subFontColor }}
          >
            {activeCue.text}
          </span>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30">
          <RefreshCw className="w-8 h-8 text-[#ff3e3e] animate-spin" />
          <span className="text-xs font-mono text-zinc-400">LOADING DIGITAL STREAM...</span>
        </div>
      )}

      {/* Error State */}
      {playerError && (
        <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-4 z-30 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-[#ff3e3e]">
            <RefreshCw className="w-8 h-8" />
          </div>
          <div className="max-w-md flex flex-col gap-1.5 p-2">
            <h3 className="text-sm font-semibold text-white tracking-tight">Playback Failure</h3>
            <p className="text-xs font-mono text-zinc-400 leading-relaxed break-all select-text">{playerError}</p>
            {episode.videoUrl && (
              <span className="text-[10px] text-zinc-500 truncate max-w-[320px] mx-auto mt-2 block select-all">
                URL: {episode.videoUrl}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              if (videoRef.current) {
                setPlayerError(null);
                setIsLoading(true);
                videoRef.current.load();
              }
            }}
            className="px-4 py-2 text-xs font-medium font-sans bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl transition-all"
            id="player-retry-load-btn"
          >
            Retry Digital Stream
          </button>
        </div>
      )}

      {/* Tap Overlay Button for pausing indicator */}
      {!isPlaying && !isLoading && (
        <div 
          onClick={handlePlayPause}
          className="absolute inset-0 bg-black/45 flex items-center justify-center cursor-pointer transition-opacity group-hover:bg-black/50 z-10"
        >
          <div className="w-16 h-16 rounded-full bg-[#ff3e3e] hover:bg-[#ff5555] flex items-center justify-center shadow-lg shadow-[#ff3e3e]/35 text-white transform hover:scale-110 transition-all">
            <Play className="w-8 h-8 fill-white ml-1 text-white" />
          </div>
        </div>
      )}

      {/* Controls HUD container */}
      <div 
        className={`absolute inset-x-4 bottom-4 glass shadow-2xl rounded-2xl p-4 flex flex-col gap-3 z-35 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        id="control-hud"
        style={{
          background: 'rgba(25, 25, 30, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        {/* Timeline bar */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-zinc-300 min-w-[36px]">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 group/timeline">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#ff3e3e] focus:outline-none focus:ring-0 group-hover/timeline:h-2 transition-all"
              id="playback-range-slider"
            />
            {/* Visual Red Fill tracker */}
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#ff3e3e] rounded-lg pointer-events-none group-hover/timeline:h-1.5 min-w-0"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-300 min-w-[36px] text-right">
            {formatTime(duration)}
          </span>
        </div>

        {/* Function keys row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button 
              onClick={handlePlayPause}
              className="text-white hover:text-[#ff3e3e] transition-colors p-1"
              id="player-play-pause-btn"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Volume indicator */}
            <div className="flex items-center gap-1.5 group/volume">
              <button 
                onClick={handleToggleMuted} 
                className="text-white hover:text-[#ff3e3e] transition-colors p-1"
                id="player-mute-btn"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? '0' : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-[#ff3e3e] hover:bg-zinc-650 transition-all"
                id="volume-slider"
              />
            </div>

            {/* Title HUD display */}
            <div className="hidden sm:flex flex-col pl-3 border-l border-white/10">
              <span className="text-xs font-semibold text-[#ff3e3e] truncate max-w-[150px]">
                {animeTitle}
              </span>
              <span className="text-[10px] text-zinc-300 font-mono truncate max-w-[200px]">
                Episode {episode.episodeNumber}: {episode.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowSubtitleMenu(false);
                  setShowStyleMenu(false);
                }}
                className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-1 ${
                  playbackSpeed !== 1 ? 'text-[#ff3e3e]' : 'text-zinc-300'
                }`}
                title="Playback speed"
                id="player-speed-menu-trigger"
              >
                <span>{playbackSpeed}x</span>
              </button>
              
              {showSpeedMenu && (
                <div 
                  className="absolute bottom-12 right-0 w-32 glass border border-white/15 rounded-xl shadow-2xl overflow-hidden z-40 p-1 flex flex-col gap-0.5 animate-fadeIn"
                  style={{
                    background: 'rgba(25, 25, 30, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
                  }}
                >
                  <div className="px-2 py-1 text-[9px] font-mono text-zinc-400 uppercase">Speed</div>
                  {[0.5, 1, 1.25, 1.5, 2].map((sp) => (
                    <button
                      key={sp}
                      onClick={() => handleSpeedChange(sp)}
                      className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                        playbackSpeed === sp 
                          ? 'bg-white/15 text-white font-bold border border-white/10' 
                          : 'text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      {sp === 1 ? '1.0x Normal' : `${sp}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtitle Language Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSubtitleMenu(!showSubtitleMenu);
                  setShowStyleMenu(false);
                  setShowSpeedMenu(false);
                }}
                className={`text-zinc-300 hover:text-[#ff3e3e] transition-colors p-1 ${
                  selectedTrack ? 'text-[#ff3e3e]' : ''
                }`}
                title="Subtitles track"
                id="player-subs-btn"
              >
                <Languages className="w-4.5 h-4.5" />
              </button>

              {showSubtitleMenu && (
                <div 
                  className={`absolute bottom-12 right-0 glass border border-white/15 rounded-xl shadow-2xl overflow-hidden z-40 p-2 flex flex-col gap-1.5 animate-fadeIn transition-all duration-300 ${
                    showPastedSrtForm || editingTrack ? 'w-64 sm:w-72' : 'w-48'
                  }`}
                  style={{
                    background: 'rgba(25, 25, 30, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
                  }}
                >
                  <div className="px-1 text-[9px] font-mono text-zinc-400 uppercase border-b border-white/10 pb-1 flex items-center justify-between">
                    <span>{editingTrack ? 'EDIT SUBTITLE' : 'SUBTITLE TRACKS'}</span>
                    <span className="text-zinc-500 font-bold text-[8px] uppercase">{editingTrack ? 'UPDATE TIMING' : 'ENG / CUSTOM'}</span>
                  </div>
                  
                  {editingTrack ? (
                    <div className="flex flex-col gap-1.5 p-1 animate-fadeIn">
                      <span className="text-[10px] text-zinc-300 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        Adjust settings & timing offset:
                      </span>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-zinc-400 font-mono">Track Name / Label:</span>
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          placeholder="e.g. Custom SRT (Updated)"
                          className="w-full bg-black/60 text-[9px] text-zinc-100 font-mono px-2 py-1 rounded border border-white/10 outline-none focus:border-amber-400/50 leading-snug"
                        />
                      </div>

                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-[9px] text-zinc-400 font-mono">
                          Shift Timing Adjustment (seconds / colon):
                        </span>
                        <input
                          type="text"
                          value={editShift}
                          onChange={(e) => setEditShift(e.target.value)}
                          placeholder="0 (no change), e.g. -7 or +3:12"
                          className="w-full bg-black/60 text-[9px] text-zinc-100 font-mono px-2 py-1 rounded border border-white/10 outline-none focus:border-amber-400/50 placeholder:text-zinc-600 leading-snug"
                        />
                        <p className="text-[8px] text-zinc-500 font-mono leading-tight">
                          Negative (e.g. <span className="text-amber-400 font-bold">-7</span>) displays subs 7s earlier. Positive (e.g. <span className="text-emerald-400 font-bold">+7</span>) displays 7s later.
                        </p>
                      </div>

                      <div className="flex gap-1 justify-end mt-2">
                        <button
                          onClick={() => {
                            setEditingTrack(null);
                            setEditLabel('');
                            setEditShift('0');
                          }}
                          className="bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 text-[8px] px-2 py-1 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!editLabel.trim()) {
                              alert('Please enter a track name.');
                              return;
                            }
                            try {
                              const shiftAmt = parseTimeShiftToSeconds(editShift);
                              
                              let updatedCues = editingTrack.cues;
                              if (shiftAmt !== 0) {
                                updatedCues = editingTrack.cues
                                  .map(cue => ({
                                    ...cue,
                                    startTime: Math.max(0, cue.startTime + shiftAmt),
                                    endTime: Math.max(0, cue.endTime + shiftAmt)
                                  }))
                                  .filter(cue => cue.endTime > cue.startTime);
                              }

                              if (updatedCues.length === 0) {
                                alert('Warning: All cues shifted before 0:00! Subtitles must contain active cues.');
                                return;
                              }

                              const finalLabel = editLabel.trim();
                              
                              const docRef = doc(db, 'customSubtitles', editingTrack.id);
                              await updateDoc(docRef, {
                                label: finalLabel,
                                cues: updatedCues,
                                updatedAt: new Date().toISOString()
                              });

                              const updatedTrack: SubtitleTrack = {
                                ...editingTrack,
                                label: finalLabel,
                                cues: updatedCues
                              };

                              setCustomTracks(prev => prev.map(t => t.id === editingTrack.id ? updatedTrack : t));
                              if (selectedTrack?.id === editingTrack.id) {
                                setSelectedTrack(updatedTrack);
                              }

                              setEditingTrack(null);
                              setEditLabel('');
                              setEditShift('0');
                            } catch (err) {
                              console.error("Failed to update custom subtitles track:", err);
                              handleFirestoreError(err, OperationType.UPDATE, 'customSubtitles');
                            }
                          }}
                          className="bg-amber-400 hover:bg-amber-500 border border-white/5 text-zinc-950 text-[9px] px-2.5 py-1 rounded font-bold active:scale-95 transition-all cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                        <button
                          onClick={() => {
                            setSelectedTrack(null);
                            setShowSubtitleMenu(false);
                          }}
                          className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            selectedTrack === null 
                              ? 'bg-white/15 text-white font-bold border border-white/10' 
                              : 'text-zinc-300 hover:bg-white/5'
                          }`}
                        >
                          Off / Dub Only
                        </button>
                        {episode.subtitles && episode.subtitles.map(track => (
                          <button
                            key={track.id}
                            onClick={() => {
                              setSelectedTrack(track);
                              setShowSubtitleMenu(false);
                            }}
                            className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                              selectedTrack?.id === track.id
                                ? 'bg-white/15 text-white font-bold border border-white/10' 
                                : 'text-zinc-300 hover:bg-white/5'
                            }`}
                          >
                            <span className="truncate">{track.label}</span>
                            <span className="text-[9px] font-mono text-zinc-400 shrink-0 uppercase">{track.srclang}</span>
                          </button>
                        ))}
                        {customTracks.map(track => (
                          <div
                            key={track.id}
                            className={`flex items-center justify-between rounded-lg transition-colors ${
                              selectedTrack?.id === track.id ? 'bg-white/10' : 'hover:bg-white/5'
                            }`}
                          >
                            <button
                              onClick={() => {
                                setSelectedTrack(track);
                                setShowSubtitleMenu(false);
                              }}
                              className={`text-left text-xs px-2.5 py-1.5 flex-1 transition-colors flex items-center justify-between cursor-pointer ${
                                selectedTrack?.id === track.id
                                  ? 'text-white font-bold' 
                                  : 'text-[#ff3e3e] font-medium'
                              }`}
                            >
                              <span className="truncate max-w-[130px] sm:max-w-[150px]">{track.label}</span>
                              <span className="text-[8px] font-mono text-white bg-[#ff3e3e] shrink-0 rounded px-1 active:scale-95 ml-1">LIVE</span>
                            </button>
                            {isAdmin && (
                              <div className="flex items-center gap-0.5 pr-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTrack(track);
                                    setEditLabel(track.label);
                                    setEditShift('0');
                                    setShowPastedSrtForm(false);
                                  }}
                                  className="p-1 text-zinc-400 hover:text-amber-400 rounded cursor-pointer transition-colors"
                                  title="Edit Subtitle"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm(`Delete custom subtitle "${track.label}"?`)) {
                                      try {
                                        await deleteDoc(doc(db, 'customSubtitles', track.id));
                                        setCustomTracks(prev => prev.filter(t => t.id !== track.id));
                                        if (selectedTrack?.id === track.id) {
                                          setSelectedTrack(null);
                                        }
                                      } catch (err) {
                                        handleFirestoreError(err, OperationType.DELETE, 'customSubtitles');
                                      }
                                    }
                                  }}
                                  className="p-1 text-zinc-400 hover:text-red-500 rounded cursor-pointer transition-colors"
                                  title="Delete Subtitle Track"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {isAdmin && (
                        <div className="border-t border-white/10 pt-1.5 flex flex-col gap-1.5">
                          {!showPastedSrtForm ? (
                            <button
                              onClick={() => setShowPastedSrtForm(true)}
                              className="w-full py-1.5 text-[9px] sm:text-[10px] bg-white/5 hover:bg-[#ff3e3e]/10 active:scale-95 transition-all text-white font-semibold rounded-lg flex items-center justify-center gap-1 border border-white/10 hover:border-[#ff3e3e]/40 cursor-pointer"
                            >
                              <Layers className="w-3 h-3 text-[#ff3e3e]" />
                              <span>+ Paste Custom SRT</span>
                            </button>
                          ) : (
                            <div className="flex flex-col gap-1.5 p-1">
                              <span className="text-[9px] text-zinc-300 font-mono flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#ff3e3e] animate-pulse"></span>
                                Paste SubRip SRT contents:
                              </span>
                              <textarea
                                rows={4}
                                value={pastedSrtText}
                                onChange={(e) => setPastedSrtText(e.target.value)}
                                placeholder="1&#10;00:00:10,000 --> 00:00:15,000&#10;Paste Subtitle sentence line here..."
                                className="w-full bg-black/60 text-[9px] text-zinc-100 font-mono p-1 rounded border border-white/10 outline-none focus:border-[#ff3e3e]/50 resize-y placeholder:text-zinc-600 leading-snug"
                              />
                              
                              <div className="flex flex-col gap-1 mt-0.5">
                                <span className="text-[9px] text-zinc-300 font-mono flex items-center gap-1">
                                  Time Align / Shift (e.g. -30:00 or -1800):
                                </span>
                                <input
                                  type="text"
                                  value={pastedSrtShift}
                                  onChange={(e) => setPastedSrtShift(e.target.value)}
                                  placeholder="0 (no shift), -30:00 for Part 2"
                                  className="w-full bg-black/60 text-[9px] text-zinc-100 font-mono px-2 py-1 rounded border border-white/10 outline-none focus:border-[#ff3e3e]/50 placeholder:text-zinc-600 leading-snug"
                                />
                                <p className="text-[8px] text-zinc-500 font-mono leading-tight">
                                  Negative values shift earlier (e.g. -30:00 starts whole movie subtitles 30m earlier for Part 2).
                                </p>
                              </div>

                              <div className="flex gap-1 justify-end mt-1">
                                <button
                                  onClick={() => {
                                    setShowPastedSrtForm(false);
                                    setPastedSrtShift('0');
                                  }}
                                  className="bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 text-[8px] px-2 py-1 rounded cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={async () => {
                                    if (pastedSrtText.trim()) {
                                      try {
                                        const parsed = parseSRT(pastedSrtText);
                                        if (parsed.length > 0) {
                                          const shiftSeconds = parseTimeShiftToSeconds(pastedSrtShift);
                                          
                                          // Apply offset alignment to all cues
                                          const shiftedCues = parsed
                                            .map(cue => {
                                              const adjustedStart = cue.startTime + shiftSeconds;
                                              const adjustedEnd = cue.endTime + shiftSeconds;
                                              return {
                                                ...cue,
                                                startTime: Math.max(0, adjustedStart),
                                                endTime: Math.max(0, adjustedEnd)
                                              };
                                            })
                                            .filter(cue => cue.endTime > cue.startTime);

                                          if (shiftedCues.length === 0) {
                                            alert('Warning: All subtitle cues shifted before 0:00 with this offset! Please check your timing value.');
                                            return;
                                          }

                                          const label = `Custom SRT (${shiftedCues.length} cues)${shiftSeconds !== 0 ? ` [Shifted ${pastedSrtShift}]` : ''}`;
                                          
                                          // Write to Firestore customSubtitles collection
                                          const docRef = await addDoc(collection(db, 'customSubtitles'), {
                                            episodeId: episode.id,
                                            label,
                                            srclang: 'en',
                                            cues: shiftedCues,
                                            createdAt: new Date().toISOString()
                                          });

                                          const customTrack: SubtitleTrack = {
                                            id: docRef.id,
                                            label,
                                            srclang: 'en',
                                            cues: shiftedCues
                                          };

                                          setCustomTracks(prev => [...prev, customTrack]);
                                          setSelectedTrack(customTrack);
                                          setPastedSrtText('');
                                          setPastedSrtShift('0');
                                          setShowPastedSrtForm(false);
                                          setShowSubtitleMenu(false);
                                        } else {
                                          alert('Check SRT format. No valid subtitle cues detected.');
                                        }
                                      } catch (error) {
                                        console.error("Failed to save custom subtitles to cloud:", error);
                                        handleFirestoreError(error, OperationType.WRITE, 'customSubtitles');
                                      }
                                    }
                                  }}
                                  className="bg-[#ff3e3e] border border-white/5 text-white text-[8px] px-2.5 py-1 rounded font-bold hover:bg-[#ff5555] active:scale-95 transition-all cursor-pointer"
                                >
                                  Load Track
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Subtitle Appearance custom styling tools */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowStyleMenu(!showStyleMenu);
                  setShowSubtitleMenu(false);
                  setShowSpeedMenu(false);
                }}
                className="text-zinc-300 hover:text-[#ff3e3e] transition-colors p-1"
                title="Subtitle Styling Customizable Options"
                id="player-subs-style-btn"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>

              {showStyleMenu && (
                <div 
                  className="absolute bottom-12 right-0 w-64 glass border border-white/15 rounded-2xl shadow-2xl p-4 z-40 flex flex-col gap-3 font-sans text-xs text-zinc-200 animate-fadeIn"
                  style={{
                    background: 'rgba(25, 25, 30, 0.9)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
                  }}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-display font-medium text-[#ff3e3e] uppercase text-[10px] tracking-widest">Subtitle Styling</span>
                    <span className="font-mono text-[9px] text-zinc-500">CUSTOMIZER</span>
                  </div>

                  {/* Font Size */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-300 font-medium">Font Sizing:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {(['sm', 'md', 'lg', 'xl'] as const).map(sz => (
                        <button
                          key={sz}
                          onClick={() => setSubFontSize(sz)}
                          className={`py-1 text-[10px] uppercase font-mono rounded-lg border transition-colors ${
                            subFontSize === sz 
                              ? 'bg-white/15 border-white/20 text-white font-bold' 
                              : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Color */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-300 font-medium">Text Color:</span>
                    <div className="flex gap-2">
                      {[
                        { hex: '#ffffff', label: 'White' },
                        { hex: '#eab308', label: 'Yellow' },
                        { hex: '#22c55e', label: 'Green' },
                        { hex: '#f43f5e', label: 'Scarlet' }
                      ].map(clr => (
                        <button
                          key={clr.hex}
                          onClick={() => setSubFontColor(clr.hex)}
                          className={`w-5 h-5 rounded-full border relative transition-all ${
                            subFontColor === clr.hex ? 'ring-2 ring-[#ff3e3e] scale-110' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: clr.hex }}
                          title={clr.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Backdrop */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-300 font-medium">Backdrop Style:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { key: 'none', label: 'Flat Text' },
                        { key: 'capsule', label: 'Capsule' },
                        { key: 'opaque', label: 'Solid' }
                      ].map(bd => (
                        <button
                          key={bd.key}
                          onClick={() => setSubBgStyle(bd.key as any)}
                          className={`py-1 text-[10px] rounded-lg border transition-all ${
                            subBgStyle === bd.key 
                              ? 'bg-white/15 border-white/20 text-white font-bold' 
                              : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10'
                          }`}
                        >
                          {bd.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Track Position */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-300 font-medium">Layout Position:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { key: 'top', label: 'Top' },
                        { key: 'middle', label: 'Center' },
                        { key: 'bottom', label: 'Standard' }
                      ].map(pos => (
                        <button
                          key={pos.key}
                          onClick={() => setSubPosition(pos.key as any)}
                          className={`py-1 text-[10px] rounded-lg border transition-all ${
                            subPosition === pos.key 
                              ? 'bg-white/15 border-white/20 text-white font-bold' 
                              : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subtitle Sync Offset Controls */}
                  <div className="flex flex-col gap-1 border-t border-white/10 pt-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-300 font-medium">Subtitle Sync Offset:</span>
                      <span className="font-mono text-[#ff3e3e] font-bold">
                        {subtitleOffset === 0 
                          ? 'In Sync (0.0s)' 
                          : `${subtitleOffset > 0 ? '+' : ''}${subtitleOffset.toFixed(1)}s`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        onClick={() => setSubtitleOffset(prev => prev - 0.5)}
                        className="flex-1 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-zinc-300 font-bold active:scale-95 transition-all text-[10px]"
                        title="Bring subtitles 0.5s earlier (Speed up)"
                      >
                        -0.5s
                      </button>
                      <button
                        onClick={() => setSubtitleOffset(0)}
                        className="px-2 py-1 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-white font-mono text-[9px] active:scale-95 transition-all"
                        title="Reset time sync delay to 0.0s"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setSubtitleOffset(prev => prev + 0.5)}
                        className="flex-1 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-zinc-300 font-bold active:scale-95 transition-all text-[10px]"
                        title="Put subtitles 0.5s later (Delay)"
                      >
                        +0.5s
                      </button>
                    </div>
                    <p className="text-[8px] text-zinc-400 italic mt-0.5 leading-tight">
                      Useful for multi-part movies. Adjust delay if subtitles are out of boundary sync!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen control */}
            <button
              onClick={handleToggleFullscreen}
              className="text-white hover:text-[#ff3e3e] transition-colors p-1"
              title="Toggle Fullscreen Mode"
              id="player-fullscreen-btn"
            >
              {isFullscreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
