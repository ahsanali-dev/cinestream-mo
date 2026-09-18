"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";
import {
  resolveLanguageInfo,
  isLanguageMatch,
  cleanLanguageName,
  getPreferredAudioLanguage,
  setPreferredAudioLanguage,
} from "@/lib/languages";
import { saveWatchProgress, getSavedProgress } from "@/lib/watch-history";
import { getEmbedFallbackUrl } from "@/lib/stream-extractor";

interface SubtitleTrack {
  label: string;
  lang: string;
  url: string;
  format?: string;
}

interface AudioTrack {
  label: string;
  lang: string;
  url?: string;
  default?: boolean;
}

export interface ServerLanguageItem {
  id: string;
  name: string;
  code: string;
  serverId: string;
  serverName: string;
  serverBadge: string;
  provider: string;
  isDefault?: boolean;
}

export interface ServerOption {
  id: string;
  name: string;
  badge: string;
  description: string;
}

interface AdFreePlayerProps {
  streamUrl?: string | null;
  embedUrl?: string | null;
  format?: "hls" | "mp4" | "embed";
  title?: string;
  poster?: string;
  mediaId: string;
  tmdbId?: string | number;
  mediaType?: "movie" | "tv";
  season?: number;
  episode?: number;
  posterPath?: string;
  backdropPath?: string;
  initialTime?: number;
  subtitles?: SubtitleTrack[];
  audioTracks?: AudioTrack[];
  initialAudioLang?: string;
  serverLanguages?: ServerLanguageItem[];
  servers?: ServerOption[];
  currentServer?: string;
  onServerChange?: (serverId: string, targetLang?: string) => void;
  onClose?: () => void;
}

export default function AdFreePlayer({
  streamUrl,
  embedUrl,
  format,
  title,
  poster,
  mediaId,
  tmdbId,
  mediaType = "movie",
  season,
  episode,
  posterPath,
  backdropPath,
  initialTime,
  subtitles = [],
  audioTracks = [],
  initialAudioLang,
  serverLanguages = [],
  servers = [],
  currentServer = "server1",
  onServerChange,
  onClose,
}: AdFreePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Press and Hold 2X Speed State
  const [isHolding2X, setIsHolding2X] = useState(false);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevPlaybackRateRef = useRef<number>(1);
  const isHoldTriggeredRef = useRef<boolean>(false);

  // Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Settings & Menus
  const [qualities, setQualities] = useState<{ label: string; index: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto
  const [activeSubtitle, setActiveSubtitle] = useState<number>(-1); // -1 = Off
  const [parsedAudioTracks, setParsedAudioTracks] = useState<{ label: string; lang: string; index: number }[]>(
    () =>
      audioTracks && audioTracks.length > 0
        ? audioTracks.map((t, idx) => {
            const info = resolveLanguageInfo(t.lang, t.label);
            return { label: info.name, lang: info.code, index: idx };
          })
        : []
  );
  const [activeAudioTrack, setActiveAudioTrack] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeMenu, setActiveMenu] = useState<"none" | "quality" | "subtitles" | "audio" | "speed" | "servers">("none");

  // Resume prompt
  const [resumeTime, setResumeTime] = useState<number | null>(null);

  // Skip animation feedback
  const [seekFeedback, setSeekFeedback] = useState<"left" | "right" | null>(null);

  // Language notification toast
  const [languageNotice, setLanguageNotice] = useState<string | null>(null);

  const [showAutoDubNotice, setShowAutoDubNotice] = useState(false);

  // Internal Retry Key for self-contained player reload
  const [retryKey, setRetryKey] = useState(0);

  const [isEmbedServerMenuOpen, setIsEmbedServerMenuOpen] = useState(false);

  // Ad-Shield Engine: Silent Popup Interceptor & Anti-Redirect Guard
  useEffect(() => {
    // 1. Intercept popup window creation from ads
    const originalWindowOpen = window.open;
    try {
      window.open = function (url?: string | URL, target?: string, features?: string) {
        if (!url) return null;
        const strUrl = url.toString();
        // Allow legitimate internal navigation or TMDB links
        if (
          strUrl.startsWith("/") ||
          strUrl.includes(window.location.hostname) ||
          strUrl.includes("themoviedb.org")
        ) {
          return originalWindowOpen.call(window, url, target, features);
        }
        // Silently block third-party advertisement popups/redirects
        return null;
      };
    } catch {}

    // 2. Prevent Top-Level Window Location Hijacking (where iframe redirects the parent page)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (document.activeElement && document.activeElement.tagName === "IFRAME") {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    // 3. Focus-Trap: If an ad attempts background window spawning, immediately reclaim focus
    let blurTimeout: NodeJS.Timeout | null = null;
    const handleWindowBlur = () => {
      if (document.activeElement && document.activeElement.tagName === "IFRAME") {
        blurTimeout = setTimeout(() => {
          window.focus();
        }, 80);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      try {
        window.open = originalWindowOpen;
      } catch {}
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("blur", handleWindowBlur);
      if (blurTimeout) clearTimeout(blurTimeout);
    };
  }, []);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec) || !isFinite(timeInSec)) return "00:00";
    const h = Math.floor(timeInSec / 3600);
    const m = Math.floor((timeInSec % 3600) / 60);
    const s = Math.floor(timeInSec % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Auto-hide controls after 3.5s of inactivity
  const triggerShowControls = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && activeMenu === "none") {
        setShowControls(false);
      }
    }, 3500);
  }, [activeMenu]);

  // Press and Hold 2X Handlers
  const handleHoldStart = useCallback(() => {
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    isHoldTriggeredRef.current = false;

    holdTimeoutRef.current = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;

      isHoldTriggeredRef.current = true;
      prevPlaybackRateRef.current = video.playbackRate || 1;
      video.playbackRate = 2.0;
      setIsHolding2X(true);
    }, 280); // 280ms threshold for press-and-hold
  }, []);

  const handleHoldEnd = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (isHoldTriggeredRef.current) {
      const video = videoRef.current;
      if (video) {
        video.playbackRate = prevPlaybackRateRef.current || 1;
      }
      setIsHolding2X(false);
      isHoldTriggeredRef.current = false;
    }
  }, []);

  // Sync audioTracks prop when passed
  useEffect(() => {
    if (audioTracks && audioTracks.length > 0) {
      setParsedAudioTracks(audioTracks.map((t, idx) => ({ ...t, index: idx })));
    }
  }, [audioTracks]);

  // Check saved watch progress on load
  useEffect(() => {
    if (initialTime && initialTime > 5) {
      setResumeTime(initialTime);
      return;
    }

    if (tmdbId) {
      const saved = getSavedProgress(tmdbId, mediaType, season, episode);
      if (saved && saved.currentTime > 10 && saved.currentTime < saved.duration - 30) {
        setResumeTime(saved.currentTime);
        return;
      }
    }

    try {
      const saved = localStorage.getItem(`cinestream_watch_${mediaId}`);
      if (saved) {
        const savedSec = parseFloat(saved);
        if (savedSec > 15) {
          setResumeTime(savedSec);
        }
      }
    } catch {}
  }, [mediaId, tmdbId, mediaType, season, episode, initialTime]);

  // Save watch progress to history library and localStorage periodically
  useEffect(() => {
    if (currentTime > 5 && duration > 20) {
      if (tmdbId) {
        saveWatchProgress({
          id: tmdbId,
          type: mediaType || "movie",
          title: title || "Now Playing",
          posterPath,
          backdropPath,
          season,
          episode,
          currentTime,
          duration,
        });
      }
      try {
        localStorage.setItem(`cinestream_watch_${mediaId}`, currentTime.toString());
      } catch {}
    }
  }, [currentTime, duration, mediaId, tmdbId, mediaType, title, posterPath, backdropPath, season, episode]);

  // Auto-resume playback to initial/saved position
  const hasAutoResumedRef = useRef<boolean>(false);
  useEffect(() => {
    if (hasAutoResumedRef.current) return;
    const targetTime =
      initialTime && initialTime > 5
        ? initialTime
        : resumeTime && resumeTime > 10
        ? resumeTime
        : null;

    if (targetTime && videoRef.current && duration > 0 && currentTime < 5) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      hasAutoResumedRef.current = true;
      setLanguageNotice(`Resumed at ${formatTime(targetTime)}`);
      setTimeout(() => setLanguageNotice(null), 3500);
    }
  }, [initialTime, resumeTime, duration, currentTime]);

  // Initialize HLS.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    if ("autoPictureInPicture" in video) {
      try {
        (video as any).autoPictureInPicture = true;
      } catch {}
    }

    setIsLoading(true);
    setHasError(false);

    const isMp4 = format === "mp4" || streamUrl.endsWith(".mp4") || streamUrl.includes(".mp4");

    if (isMp4) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = streamUrl;
      video.load();

      const onLoadedMetadata = () => {
        setIsLoading(false);
        setDuration(video.duration || 0);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      };

      const onCanPlay = () => {
        setIsLoading(false);
      };

      const onError = () => {
        setHasError(true);
        setIsLoading(false);
      };

      video.addEventListener("loadedmetadata", onLoadedMetadata);
      video.addEventListener("canplay", onCanPlay);
      video.addEventListener("error", onError);

      if (audioTracks && audioTracks.length > 0) {
        setParsedAudioTracks(
          audioTracks.map((t, idx) => {
            const info = resolveLanguageInfo(t.lang, t.label);
            return { label: cleanLanguageName(info.name), lang: info.code, index: idx };
          })
        );
      }

      return () => {
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("canplay", onCanPlay);
        video.removeEventListener("error", onError);
      };
    } else if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 120,
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 6,
        manifestLoadingRetryDelay: 1000,
        levelLoadingTimeOut: 20000,
        levelLoadingMaxRetry: 6,
        levelLoadingRetryDelay: 1000,
        fragLoadingTimeOut: 30000,
        fragLoadingMaxRetry: 8,
        fragLoadingRetryDelay: 1000,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setIsLoading(false);
        const parsedQualities = data.levels.map((level, idx) => ({
          label: level.height ? `${level.height}p` : `Level ${idx + 1}`,
          index: idx,
        }));
        setQualities(parsedQualities);

        // Parse and configure audio tracks
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          const tracks = hls.audioTracks.map((t, idx) => {
            const info = resolveLanguageInfo(t.lang, t.name);
            return {
              index: idx,
              label: cleanLanguageName(info.name),
              lang: info.code,
            };
          });
          setParsedAudioTracks(tracks);

          // Auto-select requested language or saved preference or English if available
          const savedPref = getPreferredAudioLanguage();
          const targetLang = initialAudioLang || savedPref || "English";
          let chosenIdx = -1;

          if (targetLang) {
            chosenIdx = hls.audioTracks.findIndex((t) =>
              isLanguageMatch(targetLang, {
                lang: t.lang,
                name: t.name,
              })
            );
          }

          // If target language not found, prioritize English explicitly
          if (chosenIdx === -1) {
            chosenIdx = hls.audioTracks.findIndex(
              (t) =>
                t.lang?.toLowerCase().startsWith("en") ||
                t.name?.toLowerCase().includes("english")
            );
          }

          // Fallback to default or first track only if English is completely absent
          if (chosenIdx === -1) {
            chosenIdx = hls.audioTracks.findIndex((t) => t.default);
          }

          if (chosenIdx >= 0) {
            hls.audioTrack = chosenIdx;
            setActiveAudioTrack(chosenIdx);
          } else {
            setActiveAudioTrack(0);
          }
        } else if (audioTracks && audioTracks.length > 0) {
          setParsedAudioTracks(
            audioTracks.map((t, idx) => {
              const info = resolveLanguageInfo(t.lang, t.label);
              return { label: cleanLanguageName(info.name), lang: info.code, index: idx };
            })
          );
        }

        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_event, data) => {
        if (data.audioTracks && data.audioTracks.length > 0) {
          const tracks = data.audioTracks.map((t, idx) => {
            const info = resolveLanguageInfo(t.lang, t.name);
            return {
              index: idx,
              label: cleanLanguageName(info.name),
              lang: info.code,
            };
          });
          setParsedAudioTracks(tracks);

          const savedPref = getPreferredAudioLanguage();
          const targetLang = initialAudioLang || savedPref || "English";
          let targetIdx = -1;
          if (targetLang) {
            targetIdx = data.audioTracks.findIndex((t) =>
              isLanguageMatch(targetLang, { lang: t.lang, name: t.name })
            );
          }
          if (targetIdx === -1) {
            targetIdx = data.audioTracks.findIndex(
              (t) =>
                t.lang?.toLowerCase().startsWith("en") ||
                t.name?.toLowerCase().includes("english")
            );
          }
          if (targetIdx >= 0 && hls.audioTrack !== targetIdx) {
            hls.audioTrack = targetIdx;
            setActiveAudioTrack(targetIdx);
          } else if (typeof hls.audioTrack === "number" && hls.audioTrack >= 0) {
            setActiveAudioTrack(hls.audioTrack);
          }
        }
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_event, data) => {
        if (typeof data.id === "number" && data.id >= 0) {
          setActiveAudioTrack(data.id);
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        if (hls.autoLevelEnabled) {
          setCurrentQuality(-1);
        } else {
          setCurrentQuality(data.level);
        }
      });

      let networkRetryCount = 0;
      let mediaRetryCount = 0;

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (networkRetryCount < 5) {
                networkRetryCount++;
                setTimeout(() => {
                  if (hlsRef.current) {
                    hlsRef.current.startLoad();
                  }
                }, 500);
              } else {
                setHasError(true);
                hls.destroy();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              if (mediaRetryCount < 3) {
                mediaRetryCount++;
                hls.recoverMediaError();
              } else {
                setHasError(true);
                hls.destroy();
              }
              break;
            default:
              setHasError(true);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS on Safari
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });
      video.addEventListener("error", () => {
        setHasError(true);
      });
    } else {
      setHasError(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, retryKey]);

  // Video Event Handlers
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);

    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      setBuffered((bufferedEnd / (video.duration || 1)) * 100);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    triggerShowControls();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const targetTime = parseFloat(e.target.value);
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
    triggerShowControls();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = parseFloat(e.target.value);
    video.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
    triggerShowControls();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    triggerShowControls();
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
    setSeekFeedback(seconds > 0 ? "right" : "left");
    setTimeout(() => setSeekFeedback(null), 600);
    triggerShowControls();
  };

  const changeQuality = (levelIndex: number) => {
    if (!hlsRef.current) return;
    if (levelIndex === -1) {
      hlsRef.current.currentLevel = -1; // Auto
      setCurrentQuality(-1);
    } else {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentQuality(levelIndex);
    }
    setActiveMenu("none");
    triggerShowControls();
  };

  const changePlaybackSpeed = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    prevPlaybackRateRef.current = speed;
    setActiveMenu("none");
    triggerShowControls();
  };

  const changeSubtitle = (index: number) => {
    setActiveSubtitle(index);
    const video = videoRef.current;
    if (video && video.textTracks) {
      for (let i = 0; i < video.textTracks.length; i++) {
        video.textTracks[i].mode = i === index ? "showing" : "disabled";
      }
    }
    setActiveMenu("none");
    triggerShowControls();
  };

  const changeAudioTrack = (index: number) => {
    setActiveAudioTrack(index);
    if (parsedAudioTracks[index]) {
      const chosenLang = cleanLanguageName(parsedAudioTracks[index].label);
      setPreferredAudioLanguage(chosenLang);
    }
    if (hlsRef.current && index >= 0 && index < hlsRef.current.audioTracks.length) {
      hlsRef.current.audioTrack = index;
    }
    setActiveMenu("none");
    triggerShowControls();
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    const isCurrentlyFullscreen = Boolean(
      document.fullscreenElement ||
      (video as any)?.webkitDisplayingFullscreen
    );

    if (!isCurrentlyFullscreen) {
      if (container.requestFullscreen) {
        try {
          await container.requestFullscreen();
          setIsFullscreen(true);
          // Auto-rotate to landscape on mobile (YouTube behavior)
          if (typeof screen !== "undefined" && screen.orientation && "lock" in screen.orientation) {
            try {
              await (screen.orientation as any).lock("landscape");
            } catch {}
          }
        } catch {
          // iOS Safari fallback
          if (video && (video as any).webkitEnterFullscreen) {
            try {
              (video as any).webkitEnterFullscreen();
              setIsFullscreen(true);
            } catch {}
          }
        }
      } else if (video && (video as any).webkitEnterFullscreen) {
        try {
          (video as any).webkitEnterFullscreen();
          setIsFullscreen(true);
        } catch {}
      }
    } else {
      if (document.exitFullscreen) {
        try {
          await document.exitFullscreen();
          setIsFullscreen(false);
          if (typeof screen !== "undefined" && screen.orientation && "unlock" in screen.orientation) {
            try {
              (screen.orientation as any).unlock();
            } catch {}
          }
        } catch (err) {
          console.error("Exit fullscreen failed:", err);
        }
      } else if (video && (video as any).webkitExitFullscreen) {
        try {
          (video as any).webkitExitFullscreen();
          setIsFullscreen(false);
        } catch {}
      }
    }
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error("PiP error:", err);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

      switch (e.code) {
        case "Escape":
          if (onClose) onClose();
          break;
        case "Space":
        case "KeyK":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
        case "KeyL":
          e.preventDefault();
          skipTime(10);
          break;
        case "ArrowLeft":
        case "KeyJ":
          e.preventDefault();
          skipTime(-10);
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
        case "ArrowUp":
          e.preventDefault();
          if (videoRef.current) {
            const nextVol = Math.min(1, videoRef.current.volume + 0.1);
            videoRef.current.volume = nextVol;
            setVolume(nextVol);
            setIsMuted(false);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (videoRef.current) {
            const nextVol = Math.max(0, videoRef.current.volume - 0.1);
            videoRef.current.volume = nextVol;
            setVolume(nextVol);
            setIsMuted(nextVol === 0);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fullscreen and orientation listener (Android + iOS Safari)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        (videoRef.current as any)?.webkitDisplayingFullscreen
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    const video = videoRef.current;
    if (video) {
      video.addEventListener("webkitbeginfullscreen", handleFullscreenChange);
      video.addEventListener("webkitendfullscreen", handleFullscreenChange);
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      if (video) {
        video.removeEventListener("webkitbeginfullscreen", handleFullscreenChange);
        video.removeEventListener("webkitendfullscreen", handleFullscreenChange);
      }
    };
  }, []);

  // Click & Double-click handler
  const handlePlayerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isHoldTriggeredRef.current) return;

    const now = Date.now();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftSide = clickX < rect.width / 2;

    if (now - lastClickRef.current < 300) {
      // Double Click: Skip 10s
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      if (isLeftSide) {
        skipTime(-10);
      } else {
        skipTime(10);
      }
      lastClickRef.current = 0;
      return;
    }

    lastClickRef.current = now;

    // Single Click: Toggle controls
    clickTimeoutRef.current = setTimeout(() => {
      setShowControls((prev) => !prev);
      if (!showControls) {
        triggerShowControls();
      }
      clickTimeoutRef.current = null;
    }, 280);
  };

  const handleResume = () => {
    if (resumeTime && videoRef.current) {
      videoRef.current.currentTime = resumeTime;
      setCurrentTime(resumeTime);
      setResumeTime(null);
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Check if we should render in Cloud Embed mode (if format is "embed" or no direct streamUrl is available)
  const isEmbedMode =
    format === "embed" || (!streamUrl && Boolean(embedUrl || tmdbId));

  const activeEmbedUrl = tmdbId
    ? getEmbedFallbackUrl(
        tmdbId.toString(),
        mediaType,
        season,
        episode,
        currentServer,
        initialAudioLang
      )
    : embedUrl || "";

  if (isEmbedMode) {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-full bg-black select-none group overflow-hidden flex flex-col justify-between"
      >
        {/* Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 z-30 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent pt-[max(env(safe-area-inset-top,0px),16px)] pointer-events-auto">
          <div className="flex items-center gap-3 truncate mr-4">
            {title && (
              <h3 className="text-xs md:text-sm font-bold text-white/90 truncate drop-shadow-md">
                {title}
              </h3>
            )}
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-accent/20 text-accent border border-accent/30">
              Cloud HD Stream
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Server Selector Dropdown Button */}
            {servers && servers.length > 0 && onServerChange && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsEmbedServerMenuOpen(!isEmbedServerMenuOpen)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="hidden sm:inline">
                    {servers.find((s) => s.id === currentServer)?.name.split("(")[0].trim() || "Server 1"}
                  </span>
                  <span className="sm:hidden">Servers</span>
                  <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isEmbedServerMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl bg-[#141418]/98 border border-white/15 p-2 shadow-2xl space-y-1 backdrop-blur-xl">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/40 border-b border-white/5">
                      Select Cloud Stream Server
                    </div>
                    {servers.map((s) => {
                      const isSelected = s.id === currentServer;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            onServerChange(s.id);
                            setIsEmbedServerMenuOpen(false);
                            setLanguageNotice(`Switched to ${s.name}`);
                            setTimeout(() => setLanguageNotice(null), 3000);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-accent text-white shadow-md"
                              : "text-white/70 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <div className="flex flex-col text-left truncate">
                            <span className="truncate">{s.name}</span>
                            <span className="text-[10px] opacity-60 font-normal">{s.badge}</span>
                          </div>
                          {isSelected && <span className="text-xs font-black ml-2">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all shadow-xl cursor-pointer"
              title="Fullscreen"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>

            {/* Close Button (✕) */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-white/10 hover:bg-red-600 border border-white/15 hover:border-red-500 text-white flex items-center justify-center transition-all shadow-xl cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                title="Close Player (Esc)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Embedded Video Iframe */}
        <iframe
          key={activeEmbedUrl}
          src={activeEmbedUrl}
          className="w-full h-full border-0 bg-black"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
          allowFullScreen
          referrerPolicy="origin"
          title={title || "CineStream Player"}
        />
      </div>
    );
  }



  return (
    <div
      ref={containerRef}
      onMouseMove={triggerShowControls}
      onClick={handlePlayerClick}
      onMouseDown={handleHoldStart}
      onMouseUp={handleHoldEnd}
      onMouseLeave={handleHoldEnd}
      onTouchStart={handleHoldStart}
      onTouchEnd={handleHoldEnd}
      onTouchCancel={handleHoldEnd}
      style={{ touchAction: "manipulation" }}
      className="relative w-full h-full bg-black select-none group overflow-hidden flex flex-col justify-between touch-manipulation"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
      >
        {subtitles.map((sub, idx) => (
          <track
            key={sub.url}
            kind="subtitles"
            label={sub.label}
            srcLang={sub.lang}
            src={sub.url}
            default={idx === activeSubtitle}
          />
        ))}
      </video>

      {/* Floating 2X Speed Hold Indicator */}
      {isHolding2X && (
        <div className="absolute top-10 md:top-14 left-1/2 -translate-x-1/2 z-40 px-4 py-1 rounded-full bg-zinc-800/85 backdrop-blur-md border border-white/10 text-zinc-300 shadow-lg pointer-events-none">
          <span className="text-xs md:text-sm font-bold tracking-wider">
            2X
          </span>
        </div>
      )}

      {/* Audio Language Notice Toast */}
      {languageNotice && (
        <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/20 text-white/95 text-xs font-semibold shadow-2xl pointer-events-none flex items-center gap-2 max-w-sm text-center">
          <span className="h-2 w-2 rounded-full bg-accent shrink-0 animate-pulse"></span>
          <span>{languageNotice}</span>
        </div>
      )}

      {/* Double Tap Skip Feedback (-10s / +10s) */}
      {seekFeedback && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${
            seekFeedback === "left" ? "left-8 md:left-16" : "right-8 md:right-16"
          } flex flex-col items-center justify-center pointer-events-none z-30 animate-pulse`}
        >
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-black/80 border border-white/20 backdrop-blur-xl flex items-center justify-center text-accent text-2xl shadow-2xl">
            {seekFeedback === "left" ? (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            )}
          </div>
          <span className="text-sm font-black text-white mt-2 drop-shadow-md">
            {seekFeedback === "left" ? "-10s" : "+10s"}
          </span>
        </div>
      )}

      {/* Simplified Clean Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none z-20">
          <div className="h-12 w-12 rounded-full border-3 border-accent/20 border-t-accent animate-spin shadow-lg"></div>
          <p className="text-xs font-bold text-white/70 mt-3 tracking-wider uppercase">
            Loading...
          </p>
        </div>
      )}

      {/* Error Fallback Prompt with Multi-Server Switch */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-30 p-8 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-2xl mb-1">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-black uppercase text-white">
            Playback Interrupted
          </h3>
          <p className="text-xs text-white/60 max-w-sm">
            Current server connection interrupted. Switch to backup server or retry playback.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onServerChange && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setHasError(false);
                  setIsLoading(true);
                  const nextServer = currentServer === "server1" ? "server2" : "server1";
                  onServerChange(nextServer);
                  setLanguageNotice(`Switched to ${nextServer === "server1" ? "Server 1 (Ultra Cloud)" : "Server 2 (Multi-Audio)"}`);
                  setTimeout(() => setLanguageNotice(null), 3000);
                }}
                className="px-5 py-2.5 bg-white text-black hover:bg-white/90 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all cursor-pointer"
              >
                Switch to {currentServer === "server1" ? "Server 2 (Backup)" : "Server 1 (Cloud)"}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setHasError(false);
                setIsLoading(true);
                setRetryKey((k) => k + 1);
              }}
              className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-accent/25 transition-all cursor-pointer"
            >
              Retry Playback
            </button>
            {onClose && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}


      {/* Top Header Bar with Title and Close Button (✕) - Hides with controls */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 md:p-6 z-30 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-300 pt-[max(env(safe-area-inset-top,0px),16px)] ${
          showControls || !isPlaying ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="truncate mr-4">
          {title && (
            <h3 className="text-xs md:text-sm font-bold text-white/90 truncate drop-shadow-md">
              {title}
            </h3>
          )}
        </div>

        {/* Close Player Cross Button (✕) */}
        {onClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-white/10 hover:bg-red-600 border border-white/15 hover:border-red-500 text-white flex items-center justify-center transition-all shadow-xl cursor-pointer hover:scale-105 active:scale-95 shrink-0"
            title="Close Player (Esc)"
            aria-label="Close player"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* NetMirror / Netflix Style Settings & Tracks Tabbed Modal */}
      {activeMenu !== "none" && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute right-4 md:right-8 bottom-16 sm:bottom-20 z-40 w-72 sm:w-80 h-[380px] max-h-[70vh] bg-[#222222] border border-white/10 rounded-sm shadow-2xl flex flex-col select-none animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Top Tabs Bar */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-white/10 bg-[#222222] shrink-0">
            {/* 5 Tabs: Quality, Subtitles, Speed, Audio, Servers */}
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Tab 1: Quality (Signal Bars) */}
              <button
                type="button"
                onClick={() => setActiveMenu("quality")}
                className={`flex flex-col items-center cursor-pointer transition-colors p-1 ${
                  activeMenu === "quality" ? "text-[#ff4d5a]" : "text-white/80 hover:text-white"
                }`}
                title="Quality"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M2 17h3v4H2v-4zm6-5h3v9H8v-9zm6-5h3v14h-3V7zm6-5h3v19h-3V2z" />
                </svg>
                {activeMenu === "quality" && (
                  <div className="h-0.5 bg-red-600 w-full mt-1.5 rounded-full" />
                )}
              </button>

              {/* Tab 2: Subtitles (CC Box) */}
              <button
                type="button"
                onClick={() => setActiveMenu("subtitles")}
                className={`flex flex-col items-center cursor-pointer transition-colors p-1 ${
                  activeMenu === "subtitles" ? "text-[#ff4d5a]" : "text-white/80 hover:text-white"
                }`}
                title="Subtitles"
              >
                <svg className="w-5 h-5 fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5a1.5 1.5 0 00-1.5 1.5v0a1.5 1.5 0 001.5 1.5h1M16 10.5a1.5 1.5 0 00-1.5 1.5v0a1.5 1.5 0 001.5 1.5h1" />
                </svg>
                {activeMenu === "subtitles" && (
                  <div className="h-0.5 bg-red-600 w-full mt-1.5 rounded-full" />
                )}
              </button>

              {/* Tab 3: Speed (Speedometer Clock) */}
              <button
                type="button"
                onClick={() => setActiveMenu("speed")}
                className={`flex flex-col items-center cursor-pointer transition-colors p-1 ${
                  activeMenu === "speed" ? "text-[#ff4d5a]" : "text-white/80 hover:text-white"
                }`}
                title="Playback Speed"
              >
                <svg className="w-5 h-5 fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 108-8" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 9h3M2 13h4" />
                </svg>
                {activeMenu === "speed" && (
                  <div className="h-0.5 bg-red-600 w-full mt-1.5 rounded-full" />
                )}
              </button>

              {/* Tab 4: Audio (Headphones with lines) */}
              <button
                type="button"
                onClick={() => setActiveMenu("audio")}
                className={`flex flex-col items-center cursor-pointer transition-colors p-1 ${
                  activeMenu === "audio" ? "text-[#ff4d5a]" : "text-white/80 hover:text-white"
                }`}
                title="Audio Languages"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="3" y1="6" x2="15" y2="6" strokeLinecap="round" />
                  <line x1="3" y1="10" x2="15" y2="10" strokeLinecap="round" />
                  <line x1="3" y1="14" x2="11" y2="14" strokeLinecap="round" />
                  <path d="M17 12a3 3 0 00-3 3v4a2 2 0 002 2h1v-4h-1v-2a1 1 0 011-1 1 1 0 011 1v2h-1v4h1a2 2 0 002-2v-4a3 3 0 00-3-3z" />
                </svg>
                {activeMenu === "audio" && (
                  <div className="h-0.5 bg-red-600 w-full mt-1.5 rounded-full" />
                )}
              </button>

              {/* Tab 5: Server (Servers Stack Icon) */}
              {servers && servers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveMenu("servers")}
                  className={`flex flex-col items-center cursor-pointer transition-colors p-1 ${
                    activeMenu === "servers" ? "text-[#ff4d5a]" : "text-white/80 hover:text-white"
                  }`}
                  title="Change Server"
                >
                  <svg className="w-5 h-5 fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="2" y="3" width="20" height="5" rx="1.5" />
                    <rect x="2" y="10" width="20" height="5" rx="1.5" />
                    <rect x="2" y="17" width="20" height="5" rx="1.5" />
                    <circle cx="6" cy="5.5" r="1" fill="currentColor" />
                    <circle cx="6" cy="12.5" r="1" fill="currentColor" />
                    <circle cx="6" cy="19.5" r="1" fill="currentColor" />
                  </svg>
                  {activeMenu === "servers" && (
                    <div className="h-0.5 bg-red-600 w-full mt-1.5 rounded-full" />
                  )}
                </button>
              )}
            </div>

            {/* Close ✕ Button */}
            <button
              type="button"
              onClick={() => setActiveMenu("none")}
              className="text-white hover:text-white/80 p-1 cursor-pointer transition-colors"
              aria-label="Close settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab 1: Quality List */}
          {activeMenu === "quality" && (
            <div className="flex-1 overflow-y-auto py-2 [scrollbar-width:thin] [scrollbar-color:#dc2626_transparent]">
              {/* Auto Option */}
              <button
                type="button"
                onClick={() => changeQuality(-1)}
                className={`w-full flex items-center px-4 py-2.5 text-left cursor-pointer transition-colors ${
                  currentQuality === -1
                    ? "bg-[#383838] border-l-4 border-red-600 text-green-500 font-bold"
                    : "text-white font-bold hover:bg-white/5 border-l-4 border-transparent"
                }`}
              >
                {currentQuality === -1 ? (
                  <span className="text-green-500 mr-2.5 text-xs">▶</span>
                ) : (
                  <span className="w-4 mr-2.5" />
                )}
                <span className="text-sm tracking-wide">Auto</span>
                <span className="ml-3 text-xs opacity-80 font-normal">
                  {qualities.length > 0 ? qualities[0].label : "1080p"}
                </span>
              </button>

              {/* Levels / Resolutions (1080p, 720p, 480p, 360p) */}
              {(qualities.length > 0 ? qualities : [
                { label: "1080p", index: 0 },
                { label: "720p", index: 1 },
                { label: "480p", index: 2 },
              ]).map((q) => {
                const isSelected = currentQuality === q.index;
                return (
                  <button
                    key={q.index}
                    type="button"
                    onClick={() => changeQuality(q.index)}
                    className={`w-full flex items-center px-4 py-2.5 text-left cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#383838] border-l-4 border-red-600 text-green-500 font-bold"
                        : "text-white font-bold hover:bg-white/5 border-l-4 border-transparent"
                    }`}
                  >
                    {isSelected ? (
                      <span className="text-green-500 mr-2.5 text-xs">▶</span>
                    ) : (
                      <span className="w-4 mr-2.5" />
                    )}
                    <span className="text-sm tracking-wide">{q.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 2: Subtitles List */}
          {activeMenu === "subtitles" && (
            <div className="flex-1 overflow-y-auto py-2 [scrollbar-width:thin] [scrollbar-color:#dc2626_transparent]">
              <div className="text-center py-2 text-sm font-bold text-white/90 underline cursor-default">
                Subtitle Settings
              </div>

              {/* Off Option */}
              <button
                type="button"
                onClick={() => changeSubtitle(-1)}
                className={`w-full flex items-center px-4 py-2.5 text-left cursor-pointer transition-colors ${
                  activeSubtitle === -1
                    ? "bg-[#383838] border-l-4 border-red-600 text-green-500 font-bold"
                    : "text-white font-bold hover:bg-white/5 border-l-4 border-transparent"
                }`}
              >
                {activeSubtitle === -1 ? (
                  <span className="text-green-500 mr-2.5 text-xs">▶</span>
                ) : (
                  <span className="w-4 mr-2.5" />
                )}
                <span className="text-sm tracking-wide">Off</span>
              </button>

              {/* Subtitles list */}
              {subtitles.map((sub, idx) => {
                const isSelected = activeSubtitle === idx;
                return (
                  <button
                    key={sub.url || idx}
                    type="button"
                    onClick={() => changeSubtitle(idx)}
                    className={`w-full flex items-center px-4 py-2.5 text-left cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#383838] border-l-4 border-red-600 text-green-500 font-bold"
                        : "text-white font-bold hover:bg-white/5 border-l-4 border-transparent"
                    }`}
                  >
                    {isSelected ? (
                      <span className="text-green-500 mr-2.5 text-xs">▶</span>
                    ) : (
                      <span className="w-4 mr-2.5" />
                    )}
                    <span className="text-sm tracking-wide">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 3: Playback Speed List */}
          {activeMenu === "speed" && (
            <div className="flex-1 overflow-y-auto py-2 [scrollbar-width:thin] [scrollbar-color:#dc2626_transparent]">
              {[0.5, 1, 1.25, 1.5, 2].map((s) => {
                const isSelected = playbackSpeed === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => changePlaybackSpeed(s)}
                    className={`w-full flex items-center px-4 py-2.5 text-left cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#383838] border-l-4 border-red-600 text-green-500 font-bold"
                        : "text-white font-bold hover:bg-white/5 border-l-4 border-transparent"
                    }`}
                  >
                    {isSelected ? (
                      <span className="text-green-500 mr-2.5 text-xs">▶</span>
                    ) : (
                      <span className="w-4 mr-2.5" />
                    )}
                    <span className="text-sm tracking-wide">{s === 1 ? "1x" : `${s}x`}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 4: Audio Languages List */}
          {activeMenu === "audio" && (
            <div className="flex-1 overflow-y-auto py-2 [scrollbar-width:thin] [scrollbar-color:#dc2626_transparent]">
              <div className="text-center py-1.5 text-xs font-bold text-white/50 uppercase tracking-wider cursor-default">
                Available Multi-Server Audio
              </div>
              {serverLanguages && serverLanguages.length > 0 ? (
                serverLanguages.map((track) => {
                  const isCurrentServer = currentServer === track.serverId;
                  const currentActiveLabel = parsedAudioTracks[activeAudioTrack]?.label || initialAudioLang || "English";
                  const isAudioMatch = isLanguageMatch(track.name, { label: currentActiveLabel });
                  const isSelected = isCurrentServer && isAudioMatch;

                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => {
                        if (!isCurrentServer) {
                          if (onServerChange) {
                            onServerChange(track.serverId, track.name);
                            setLanguageNotice(`Switching to ${track.serverName} (${track.name})...`);
                            setTimeout(() => setLanguageNotice(null), 3500);
                          }
                        } else {
                          const localIdx = parsedAudioTracks.findIndex((t) =>
                            isLanguageMatch(track.name, { label: t.label, lang: t.lang })
                          );
                          if (localIdx >= 0) {
                            changeAudioTrack(localIdx);
                          }
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#383838] border-l-4 border-red-600 text-green-500 font-bold"
                          : "text-white font-bold hover:bg-white/5 border-l-4 border-transparent"
                      }`}
                    >
                      <div className="flex items-center min-w-0">
                        {isSelected ? (
                          <span className="text-green-500 mr-2.5 text-xs">▶</span>
                        ) : (
                          <span className="w-4 mr-2.5" />
                        )}
                        <span className="text-sm tracking-wide truncate">{track.name}</span>
                        <span className="text-[10px] text-white/40 font-mono ml-2">[{track.code}]</span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ml-2 ${
                        isCurrentServer
                          ? "bg-red-600/30 text-red-300 border border-red-500/40"
                          : "bg-white/10 text-white/60"
                      }`}>
                        {track.serverBadge || (track.serverId === "server2" ? "Netflix" : track.serverId === "server1" ? "1080p" : "Cloud")}
                      </span>
                    </button>
                  );
                })
              ) : parsedAudioTracks.length === 0 ? (
                <button
                  type="button"
                  className="w-full flex items-center px-4 py-2.5 text-left bg-[#383838] border-l-4 border-red-600 text-green-500 font-bold"
                >
                  <span className="text-green-500 mr-2.5 text-xs">▶</span>
                  <span className="text-sm tracking-wide">English (Original)</span>
                </button>
              ) : (
                parsedAudioTracks.map((track) => {
                  const isSelected = activeAudioTrack === track.index;
                  return (
                    <button
                      key={track.index}
                      type="button"
                      onClick={() => changeAudioTrack(track.index)}
                      className={`w-full flex items-center px-4 py-2.5 text-left cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#383838] border-l-4 border-red-600 text-green-500 font-bold"
                          : "text-white font-bold hover:bg-white/5 border-l-4 border-transparent"
                      }`}
                    >
                      {isSelected ? (
                        <span className="text-green-500 mr-2.5 text-xs">▶</span>
                      ) : (
                        <span className="w-4 mr-2.5" />
                      )}
                      <span className="text-sm tracking-wide capitalize">{track.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 5: Servers List */}
          {activeMenu === "servers" && (
            <div className="flex-1 overflow-y-auto py-2 [scrollbar-width:thin] [scrollbar-color:#dc2626_transparent]">
              <div className="text-center py-1.5 text-xs font-bold text-white/50 uppercase tracking-wider cursor-default">
                Select Stream Server
              </div>
              {servers.map((s) => {
                const isSelected = currentServer === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      if (onServerChange) {
                        onServerChange(s.id);
                        setLanguageNotice(`Connecting to ${s.name}...`);
                        setTimeout(() => setLanguageNotice(null), 3000);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#383838] border-l-4 border-red-600 text-green-500 font-bold"
                        : "text-white font-bold hover:bg-white/5 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-center min-w-0">
                      {isSelected ? (
                        <span className="text-green-500 mr-2.5 text-xs">▶</span>
                      ) : (
                        <span className="w-4 mr-2.5" />
                      )}
                      <span className="text-sm tracking-wide truncate">{s.name}</span>
                    </div>
                    {s.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold shrink-0 ml-2 ${
                        isSelected
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-white/10 text-white/60"
                      }`}>
                        {s.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-3 pt-8 z-30 bg-gradient-to-t from-black/95 via-black/80 to-transparent transition-all duration-300 space-y-2 ${
          showControls || !isPlaying
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        {/* Full-width Progress / Scrubber Bar */}
        <div className="relative group/bar flex items-center h-4 cursor-pointer">
          {/* Background track (grey) */}
          <div className="absolute inset-x-0 h-1 bg-white/25 rounded-full transition-all group-hover/bar:h-1.5" />
          
          {/* Buffered track (light white) */}
          <div
            style={{ width: `${buffered}%` }}
            className="absolute left-0 h-1 bg-white/40 rounded-full transition-all group-hover/bar:h-1.5 pointer-events-none"
          />

          {/* Played track (red) */}
          <div
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            className="absolute left-0 h-1 bg-red-600 rounded-full transition-all group-hover/bar:h-1.5 shadow-[0_0_8px_rgba(229,9,20,0.8)] pointer-events-none"
          />

          {/* Scrubber thumb */}
          <div
            style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            className="absolute -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white shadow-md scale-0 group-hover/bar:scale-100 transition-transform pointer-events-none"
          />

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            aria-label="Seek video position"
          />
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between text-white select-none py-1">
          {/* Left Actions: Play/Pause, Rewind 10s, Forward 10s, Volume, Time */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5 shrink-0">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="text-white hover:text-white/80 transition-transform hover:scale-110 active:scale-95 cursor-pointer p-1 flex items-center justify-center"
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? (
                <svg className="w-5 h-5 md:w-6 md:h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 md:w-6 md:h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Rewind 10s Button (Netflix Circular Style) */}
            <button
              type="button"
              onClick={() => skipTime(-10)}
              className="text-white hover:text-white/80 transition-transform hover:scale-110 active:scale-95 cursor-pointer p-1 flex items-center justify-center"
              title="Rewind 10s (Left Arrow or J)"
              aria-label="Rewind 10 seconds"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12.5 4.5a8 8 0 1 0 7.5 5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <polyline
                  points="12.5 2 9.5 4.5 12.5 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <text
                  x="12.5"
                  y="14.2"
                  textAnchor="middle"
                  fontSize="7"
                  fontWeight="800"
                  fill="currentColor"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  10
                </text>
              </svg>
            </button>

            {/* Forward 10s Button (Netflix Circular Style) */}
            <button
              type="button"
              onClick={() => skipTime(10)}
              className="text-white hover:text-white/80 transition-transform hover:scale-110 active:scale-95 cursor-pointer p-1 flex items-center justify-center"
              title="Forward 10s (Right Arrow or L)"
              aria-label="Forward 10 seconds"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none">
                <path
                  d="M11.5 4.5a8 8 0 1 1-7.5 5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <polyline
                  points="11.5 2 14.5 4.5 11.5 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <text
                  x="11.5"
                  y="14.2"
                  textAnchor="middle"
                  fontSize="7"
                  fontWeight="800"
                  fill="currentColor"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  10
                </text>
              </svg>
            </button>

            {/* Volume + Slider */}
            <div className="flex items-center gap-2 group/vol">
              <button
                type="button"
                onClick={toggleMute}
                className="text-white hover:text-white/80 transition-colors cursor-pointer p-1 flex items-center justify-center"
                aria-label={isMuted ? "Unmute (M)" : "Mute (M)"}
                title={isMuted ? "Unmute (M)" : "Mute (M)"}
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5 md:w-6 md:h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 md:w-6 md:h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-18 md:w-20 h-1 bg-white/30 accent-red-600 rounded-full cursor-pointer transition-all opacity-80 group-hover/vol:opacity-100"
                aria-label="Volume level"
              />
            </div>

            {/* Time Display */}
            <span className="text-[11px] sm:text-xs font-semibold text-white/90 tracking-wider whitespace-nowrap ml-1 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>


          {/* Right Actions: Settings ⚙, Fullscreen ⤢ */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5 shrink-0">

            {/* Settings Gear (Quality Tab) */}
            <button
              type="button"
              onClick={() =>
                setActiveMenu(activeMenu === "quality" ? "none" : "quality")
              }
              className={`p-1 transition-transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center ${
                activeMenu === "quality" || activeMenu === "speed"
                  ? "text-red-500"
                  : "text-white hover:text-white/80"
              }`}
              title="Settings (Quality & Speed)"
              aria-label="Settings"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1 text-white hover:text-white/80 transition-transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
              title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? (
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 14h6v6m10-10h-6V4m0 16h6v-6M4 4h6v6" />
                </svg>
              ) : (
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
