import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, Disc3, Sparkles, Youtube, Radio } from 'lucide-react';
import { WeddingTheme } from '../../types/wedding';

interface AudioPlayerProps {
  audioTrack?: {
    enabled: boolean;
    title: string;
    artist: string;
    url: string;
  };
  theme: WeddingTheme;
}

/**
 * Extracts an 11-character YouTube video ID from various YouTube URL formats.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([^"&?\/\s]{11})/i
  );
  return match && match[1].length === 11 ? match[1] : null;
}

/**
 * Determines whether the URL is a YouTube video, a direct audio stream/file, or needs procedural synth fallback.
 */
export function resolveAudioSource(
  rawUrl: string
): { type: 'youtube'; videoId: string } | { type: 'audio'; url: string } | { type: 'synth' } {
  if (!rawUrl || !rawUrl.trim()) return { type: 'synth' };
  const trimmed = rawUrl.trim();

  // Check YouTube
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return { type: 'youtube', videoId: ytId };
  }

  // Dropbox direct link transform
  if (trimmed.includes('dropbox.com')) {
    const directUrl = trimmed.replace('?dl=0', '?dl=1').replace('&dl=0', '&dl=1');
    return { type: 'audio', url: directUrl };
  }

  // Google Drive direct link transform
  const gdriveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveMatch && gdriveMatch[1]) {
    return { type: 'audio', url: `https://drive.google.com/uc?export=download&id=${gdriveMatch[1]}` };
  }

  return { type: 'audio', url: trimmed };
}

let ytApiPromise: Promise<void> | null = null;
function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as unknown as { YT?: { Player?: unknown } }).YT?.Player) {
    return Promise.resolve();
  }

  if (!ytApiPromise) {
    ytApiPromise = new Promise<void>((resolve) => {
      const existing = document.getElementById('youtube-iframe-api');
      if (!existing) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScript = document.getElementsByTagName('script')[0];
        firstScript?.parentNode?.insertBefore(tag, firstScript);
      }

      const prevOnReady = (window as unknown as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady;
      (window as unknown as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = () => {
        if (prevOnReady) prevOnReady();
        resolve();
      };

      const poll = setInterval(() => {
        if ((window as unknown as { YT?: { Player?: unknown } }).YT?.Player) {
          clearInterval(poll);
          resolve();
        }
      }, 150);
    });
  }

  return ytApiPromise;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioTrack, theme }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.65);
  const [showControls, setShowControls] = useState(false);
  const [, setHasUserInteracted] = useState(false);

  // References
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<number | null>(null);

  const isPlayingRef = useRef(true);
  const isMutedRef = useRef(isMuted);
  const volumeRef = useRef(volume);
  const userPausedRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const track = audioTrack || {
    enabled: true,
    title: 'Canon in D - Acoustic Romance',
    artist: 'Johann Pachelbel (Acoustic Arr.)',
    url: '',
  };

  const source = useMemo(() => {
    return resolveAudioSource(track.url || '');
  }, [track.url]);

  if (!track.enabled) {
    return null;
  }

  // Synthesizer Fallback: Procedural gentle romantic harp/chime arpeggio
  const playSynthArpeggio = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Romantic chord progression in D / C major (Canon in D harmony)
      const chordNotes = [
        [261.63, 329.63, 392.0, 523.25], // C
        [196.0, 246.94, 293.66, 392.0], // G
        [220.0, 261.63, 329.63, 440.0], // Am
        [164.81, 196.0, 246.94, 329.63], // Em
        [174.61, 220.0, 261.63, 349.23], // F
        [261.63, 329.63, 392.0, 523.25], // C
        [174.61, 220.0, 261.63, 349.23], // F
        [196.0, 246.94, 293.66, 392.0], // G
      ];

      let chordIndex = 0;
      let noteStep = 0;

      const step = () => {
        if (userPausedRef.current || !isPlayingRef.current || isMutedRef.current) return;
        const currentChord = chordNotes[chordIndex % chordNotes.length];
        const freq = currentChord[noteStep % currentChord.length];

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = noteStep % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const currentVol = isMutedRef.current ? 0 : volumeRef.current * 0.15;
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.001, currentVol), ctx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.3);

        noteStep++;
        if (noteStep >= currentChord.length) {
          noteStep = 0;
          chordIndex++;
        }
      };

      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
      }
      step();
      synthIntervalRef.current = window.setInterval(step, 550);
    } catch {
      // AudioContext blocked
    }
  };

  const stopSynth = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  };

  // YouTube Player Initializer and Synchronizer
  useEffect(() => {
    if (!track.enabled || source.type !== 'youtube') {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
        ytPlayerRef.current = null;
      }
      return;
    }

    let isCancelled = false;

    loadYouTubeIframeApi().then(() => {
      if (isCancelled) return;

      const host = document.getElementById('youtube-audio-host');
      if (!host) return;

      // Re-create mount point
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
        ytPlayerRef.current = null;
      }
      host.innerHTML = '<div id="youtube-audio-player-element"></div>';

      try {
        const YT = (window as unknown as { YT: any }).YT;
        if (!YT || !YT.Player) return;

        ytPlayerRef.current = new YT.Player('youtube-audio-player-element', {
          height: '200',
          width: '200',
          videoId: source.videoId,
          playerVars: {
            autoplay: 1, // Attempt automatic playback
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            loop: 1,
            playlist: source.videoId, // Required for YouTube loop to work
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
          events: {
            onReady: (event: any) => {
              if (isCancelled) return;
              ytPlayerRef.current = event.target;
              event.target.setVolume(Math.round(volumeRef.current * 100));
              if (isMutedRef.current) {
                event.target.mute();
              } else {
                event.target.unMute();
              }

              // Autoplay immediately unless user explicitly paused
              if (!userPausedRef.current) {
                try {
                  event.target.playVideo();
                  setIsPlaying(true);
                } catch (_) {}
              }
            },
            onStateChange: (event: any) => {
              if (isCancelled) return;
              // 1 = playing, 2 = paused, 0 = ended
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2) {
                if (userPausedRef.current) {
                  setIsPlaying(false);
                }
              } else if (event.data === 0) {
                // Loop
                try {
                  event.target.seekTo(0);
                  event.target.playVideo();
                } catch (_) {}
              }
            },
            onError: (err: any) => {
              console.warn('YouTube audio playback restriction, switching to gentle synth:', err);
              if (!userPausedRef.current) {
                playSynthArpeggio();
              }
            },
          },
        });
      } catch (err) {
        console.warn('YouTube Player initialization failed:', err);
      }
    });

    return () => {
      isCancelled = true;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
        ytPlayerRef.current = null;
      }
    };
  }, [track.enabled, source.type, source.type === 'youtube' ? source.videoId : '']);

  // Sync HTML5 audio element volume & mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
    if (source.type === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setVolume(Math.round(volume * 100));
        if (isMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
        }
      } catch (_) {}
    }
  }, [volume, isMuted, source.type]);

  // Robust Autoplay & Universal Interaction Listener (tap/click/scroll anywhere to unmute/play)
  useEffect(() => {
    if (!track.enabled) return;

    let isMounted = true;

    // 1. Immediate playback trigger
    const attemptAutoplay = () => {
      if (!isMounted || userPausedRef.current) return;

      if (source.type === 'youtube') {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
          try {
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
          } catch (_) {}
        }
      } else if (source.type === 'audio' && audioRef.current) {
        const promise = audioRef.current.play();
        if (promise !== undefined) {
          promise
            .then(() => {
              if (isMounted) setIsPlaying(true);
            })
            .catch(() => {
              // If unmuted playback is restricted, start muted playback so buffering/timing works,
              // then unmute on first user interaction anywhere
              if (audioRef.current && !userPausedRef.current) {
                audioRef.current.muted = true;
                audioRef.current.play().catch(() => {});
              }
            });
        }
      } else if (source.type === 'synth') {
        playSynthArpeggio();
        setIsPlaying(true);
      }
    };

    // 2. Universal first interaction trigger (User touching, scrolling, clicking anywhere on page)
    const handleUniversalInteraction = () => {
      if (!isMounted || userPausedRef.current) return;
      setHasUserInteracted(true);

      // YouTube resume/unmute
      if (source.type === 'youtube' && ytPlayerRef.current) {
        try {
          if (!isMutedRef.current) {
            ytPlayerRef.current.unMute();
          }
          ytPlayerRef.current.setVolume(Math.round(volumeRef.current * 100));
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        } catch (_) {}
      }

      // Direct Audio resume/unmute
      if (source.type === 'audio' && audioRef.current) {
        if (!isMutedRef.current) {
          audioRef.current.muted = false;
        }
        audioRef.current.play().then(() => {
          if (isMounted) setIsPlaying(true);
        }).catch(() => {});
      }

      // Synth resume if audio context was suspended
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          if (source.type === 'synth' && !synthIntervalRef.current) {
            playSynthArpeggio();
          }
        }).catch(() => {});
      } else if (source.type === 'synth' && !synthIntervalRef.current) {
        playSynthArpeggio();
      }
    };

    // Run autoplay check immediately
    attemptAutoplay();
    const timer = setTimeout(attemptAutoplay, 350);

    // Register passive global interaction listeners on window & document
    const interactionEvents = [
      'pointerdown',
      'touchstart',
      'touchend',
      'click',
      'scroll',
      'wheel',
      'keydown',
    ];

    interactionEvents.forEach((evt) => {
      window.addEventListener(evt, handleUniversalInteraction, { passive: true, capture: true });
      document.addEventListener(evt, handleUniversalInteraction, { passive: true, capture: true });
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      interactionEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUniversalInteraction, { capture: true });
        document.removeEventListener(evt, handleUniversalInteraction, { capture: true });
      });
    };
  }, [
    track.enabled,
    source.type,
    source.type === 'youtube' ? source.videoId : source.type === 'audio' ? source.url : '',
  ]);

  // Cleanup synthesizer on unmount
  useEffect(() => {
    return () => {
      stopSynth();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Toggle playback
  const handleTogglePlay = () => {
    setHasUserInteracted(true);

    if (isPlaying) {
      // User explicitly paused
      userPausedRef.current = true;
      if (source.type === 'youtube' && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch (_) {}
      } else if (source.type === 'audio' && audioRef.current) {
        audioRef.current.pause();
      }
      stopSynth();
      setIsPlaying(false);
    } else {
      // User explicitly played
      userPausedRef.current = false;
      setIsPlaying(true);
      if (source.type === 'youtube') {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
          try {
            ytPlayerRef.current.playVideo();
          } catch (_) {
            playSynthArpeggio();
          }
        }
      } else if (source.type === 'audio' && audioRef.current) {
        audioRef.current.play().catch(() => {
          playSynthArpeggio();
        });
      } else {
        playSynthArpeggio();
      }
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (source.type === 'youtube' && ytPlayerRef.current) {
      try {
        if (nextMuted) ytPlayerRef.current.mute();
        else ytPlayerRef.current.unMute();
      } catch (_) {}
    }
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);

    if (source.type === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setVolume(Math.round(val * 100));
        if (val === 0) ytPlayerRef.current.mute();
        else if (isMuted) ytPlayerRef.current.unMute();
      } catch (_) {}
    }

    if (audioRef.current) {
      audioRef.current.volume = val;
    }

    if (val === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  return (
    <aside aria-label="Wedding celebration soundtrack" className="fixed bottom-5 left-5 z-40 select-none">
      {/* Hidden YouTube audio host element (audio-only: video off-screen) */}
      <div
        id="youtube-audio-host"
        className="fixed -bottom-40 -right-40 w-[200px] h-[200px] pointer-events-none overflow-hidden opacity-0 z-[-10]"
        aria-hidden="true"
      >
        <div id="youtube-audio-player-element" />
      </div>

      {/* Hidden HTML5 audio element for direct MP3/WAV/OGG streams */}
      {source.type === 'audio' && source.url && (
        <audio
          ref={audioRef}
          src={source.url}
          loop
          autoPlay
          playsInline
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => {
            if (userPausedRef.current) {
              setIsPlaying(false);
            }
          }}
          onError={() => {
            if (!userPausedRef.current) {
              playSynthArpeggio();
            }
          }}
        />
      )}

      {/* Expanded Mini Player Card */}
      {showControls && (
        <div
          className="mb-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 w-64 text-stone-900 animate-in fade-in slide-in-from-bottom-2"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.cardBorder,
            boxShadow: theme.decorations.cardShadow,
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <span
                className="text-[10px] uppercase font-bold tracking-wider block"
                style={{ color: theme.colors.goldOrMetallic }}
              >
                Ceremony Melody
              </span>
              <p
                className="text-xs font-bold truncate"
                style={{ color: theme.colors.textHeading }}
                title={track.title}
              >
                {track.title}
              </p>
              <p className="text-[11px] text-stone-500 truncate">{track.artist}</p>

              {/* Source Badge */}
              <div className="mt-1">
                {source.type === 'youtube' ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md">
                    <Youtube className="w-2.5 h-2.5 text-red-600" />
                    <span>YouTube Audio</span>
                  </span>
                ) : source.type === 'audio' ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                    <Radio className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Direct Audio / MP3</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                    <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                    <span>Acoustic Synthesizer</span>
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowControls(false)}
              className="text-stone-400 hover:text-stone-700 text-xs p-1"
              aria-label="Close soundtrack panel"
            >
              ✕
            </button>
          </div>

          {/* Sound waves animation indicator */}
          <div className="flex items-center gap-1 h-3 my-2 justify-center">
            {[0.4, 0.9, 0.6, 1, 0.5, 0.8, 0.3].map((height, i) => (
              <span
                key={i}
                className="w-1 rounded-full transition-all duration-300"
                style={{
                  height: isPlaying && !isMuted ? `${height * 100}%` : '20%',
                  backgroundColor: theme.colors.primary,
                  opacity: isPlaying && !isMuted ? 0.85 : 0.25,
                  animation: isPlaying && !isMuted ? `pulse 1.2s infinite ${i * 0.15}s` : 'none',
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={handleTogglePlay}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 shadow-sm"
              style={{ backgroundColor: theme.colors.primary }}
              aria-label={isPlaying ? 'Pause music' : 'Play music'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            <button
              onClick={handleToggleMute}
              className="text-stone-500 hover:text-stone-800 p-1.5 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1.5 rounded-lg appearance-none cursor-pointer bg-stone-200 accent-rose-600"
              aria-label="Volume slider"
            />
          </div>
        </div>
      )}

      {/* Floating Main Audio Pill */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleTogglePlay}
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full border shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.cardBorder,
            color: theme.colors.textHeading,
          }}
          title={isPlaying ? 'Pause background music' : 'Play background wedding melody'}
        >
          {/* Vinyl / Disc icon with spinning animation when active */}
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              isPlaying && !isMuted ? 'animate-spin' : ''
            }`}
            style={{
              animationDuration: '4s',
              backgroundColor: isPlaying ? theme.colors.primary : 'transparent',
              color: isPlaying ? '#ffffff' : theme.colors.primary,
            }}
          >
            {isPlaying ? (
              <Disc3 className="w-4 h-4" />
            ) : (
              <Music className="w-3.5 h-3.5" />
            )}
          </div>

          <div className="text-left pr-1 hidden sm:block">
            <p className="text-[11px] font-bold leading-tight flex items-center gap-1">
              <span>{isPlaying ? 'Melody Playing' : 'Play Music'}</span>
              {isPlaying && <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse" />}
            </p>
            <p className="text-[9px] text-stone-500 truncate max-w-[100px]">{track.title}</p>
          </div>
        </button>

        {/* Quick Settings Drawer Toggle */}
        <button
          onClick={() => setShowControls(!showControls)}
          className="w-8 h-8 rounded-full border shadow-lg backdrop-blur-md flex items-center justify-center text-stone-600 transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.cardBorder,
          }}
          title="Soundtrack options & volume"
          aria-label="Soundtrack options"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </aside>
  );
};
