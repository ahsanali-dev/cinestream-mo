"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTVShowEpisodes, getSourceBadgeStyle, MediaSource } from "@/lib/tmdb";
import {
  resolveLanguageInfo,
  isLanguageMatch,
  cleanLanguageName,
  getPreferredAudioLanguage,
  setPreferredAudioLanguage,
} from "@/lib/languages";
import { getWatchHistory, getSavedProgress, WatchHistoryItem } from "@/lib/watch-history";
import AdFreePlayer from "./AdFreePlayer";
import WatchlistButton from "./WatchlistButton";
import ShareButton from "./ShareButton";
import MovieCard from "./MovieCard";

interface Season {
  season_number: number;
  episode_count: number;
  name?: string;
}

interface PlayerContainerProps {
  id: string;
  type: "movie" | "tv";
  seasons?: Season[];
  backdropPath?: string | null;
  posterPath?: string | null;
  title?: string;
  overview?: string;
  voteAverage?: number;
  releaseYear?: string;
  runtime?: number;
  certification?: string;
  contentAdvisory?: string;
  cast?: string[];
  genres?: string[];
  keywords?: string[];
  spokenLanguages?: { english_name?: string; name?: string; iso_639_1?: string }[];
  originalLanguage?: string;
  initialTime?: number;
  initialSeason?: number;
  initialEpisode?: number;
  autoPlay?: boolean;
  recommendations?: any[];
  creditsCast?: {
    id: number;
    name: string;
    character?: string;
    profile_path?: string | null;
  }[];
  director?: string;
  releaseDate?: string;
  status?: string;
  cleanSlug?: string;
  trailerKey?: string | null;
  source?: MediaSource | { name: string; logo?: string | null } | null;
}

interface StreamData {
  streamUrl?: string | null;
  embedUrl?: string | null;
  format?: "hls" | "mp4" | "embed";
  subtitles?: { label: string; lang: string; url: string }[];
  audioTracks?: { label: string; lang: string; url?: string; default?: boolean }[];
  qualities?: string[];
  provider?: string;
  currentServer?: string;
  availableServers?: { id: string; name: string; badge: string; description: string }[];
  availableLanguages?: ServerLanguageItem[];
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

interface AudioTrackItem {
  id: string;
  name: string;
  code: string;
  rawLabel: string;
  rawLang: string;
  isDefault: boolean;
  serverId?: string;
  serverBadge?: string;
}

export default function PlayerContainer({
  id,
  type,
  seasons = [],
  backdropPath,
  posterPath,
  title,
  overview,
  voteAverage,
  releaseYear,
  runtime,
  certification,
  contentAdvisory,
  cast = [],
  genres = [],
  keywords = [],
  spokenLanguages = [],
  originalLanguage,
  initialTime,
  initialSeason,
  initialEpisode,
  autoPlay = false,
  recommendations = [],
  creditsCast = [],
  director,
  releaseDate,
  status,
  cleanSlug,
  trailerKey,
  source,
}: PlayerContainerProps) {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [selectedServer, setSelectedServer] = useState<string>("server1");
  const [availableServers, setAvailableServers] = useState<
    { id: string; name: string; badge: string; description: string }[]
  >([]);
  const [serverLanguages, setServerLanguages] = useState<ServerLanguageItem[]>([]);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState<boolean>(false);
  const seasonDropdownRef = useRef<HTMLDivElement>(null);
  const audioScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isTrailerOpen, setIsTrailerOpen] = useState<boolean>(false);

  // Tabs state: TV shows default to "episodes", Movies default to "more_like_this"
  const [activeTab, setActiveTab] = useState<"episodes" | "more_like_this" | "details">(
    type === "tv" ? "episodes" : "more_like_this"
  );

  // Audio Language Horizontal Drag-to-Scroll & Non-Passive Wheel Refs
  const isAudioDraggingRef = useRef(false);
  const audioStartXRef = useRef(0);
  const audioStartScrollLeftRef = useRef(0);
  const audioHasMovedRef = useRef(false);

  const handleAudioMouseDown = (e: React.MouseEvent) => {
    if (!audioScrollRef.current) return;
    isAudioDraggingRef.current = true;
    audioHasMovedRef.current = false;
    audioStartXRef.current = e.pageX - audioScrollRef.current.offsetLeft;
    audioStartScrollLeftRef.current = audioScrollRef.current.scrollLeft;
  };

  const checkAudioScroll = React.useCallback(() => {
    if (audioScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = audioScrollRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
    }
  }, []);

  const scrollAudio = (direction: "left" | "right") => {
    if (audioScrollRef.current) {
      const offset = direction === "left" ? -280 : 280;
      audioScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const isUpcoming = React.useMemo(() => {
    const y = parseInt(releaseYear || "2024", 10);
    return y > new Date().getFullYear();
  }, [releaseYear]);

  // Computed Match % & Formatted Runtime
  const matchPercentage = Math.min(99, Math.max(65, Math.round((voteAverage || 7.8) * 10)));
  const formattedDuration = React.useMemo(() => {
    if (!runtime || runtime <= 0) return "HD";
    const h = Math.floor(runtime / 60);
    const m = runtime % 60;
    if (h > 0) {
      return `${h}h ${m > 0 ? `${m}m` : ""}`;
    }
    return `${m}m`;
  }, [runtime]);

  // Cinema Mode Player Open State (auto-open ONLY when autoPlay is explicitly true)
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(() => Boolean(autoPlay));
  const [mounted, setMounted] = useState<boolean>(false);
  const [playheadTime, setPlayheadTime] = useState<number | undefined>(initialTime);
  const [savedProgress, setSavedProgress] = useState<WatchHistoryItem | null>(null);

  useEffect(() => {
    setMounted(true);
    if (autoPlay) {
      setIsPlayerOpen(true);
    }
  }, [autoPlay]);

  // Direct Ad-Free Stream state
  const [directStream, setDirectStream] = useState<StreamData | null>(null);
  const [isDirectLoading, setIsDirectLoading] = useState<boolean>(true);
  const [directError, setDirectError] = useState<string | null>(null);

  useEffect(() => {
    const el = audioScrollRef.current;
    if (el) {
      checkAudioScroll();
      el.addEventListener("scroll", checkAudioScroll, { passive: true });
      window.addEventListener("resize", checkAudioScroll);
      return () => {
        el.removeEventListener("scroll", checkAudioScroll);
        window.removeEventListener("resize", checkAudioScroll);
      };
    }
  }, [checkAudioScroll]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(e.target as Node)) {
        setIsSeasonDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll, add cinema-mode-active class to hide sidebar/header/nav, & listen for Escape
  useEffect(() => {
    if (isPlayerOpen) {
      document.body.classList.add("cinema-mode-active");
      document.body.style.overflow = "hidden";
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsPlayerOpen(false);
        }
      };
      window.addEventListener("keydown", handleEsc);
      return () => {
        document.body.classList.remove("cinema-mode-active");
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleEsc);
      };
    } else {
      document.body.classList.remove("cinema-mode-active");
      document.body.style.overflow = "";
    }
  }, [isPlayerOpen]);

  // Filter seasons
  const activeSeasons = seasons.filter(
    (s) => s.season_number > 0 || (seasons.length === 1 && s.season_number === 0)
  );

  const [selectedSeason, setSelectedSeason] = useState<number>(
    initialSeason || (activeSeasons.length > 0 ? activeSeasons[0].season_number : 1)
  );
  const [selectedEpisode, setSelectedEpisode] = useState<number>(initialEpisode || 1);

  // Auto-detect last watched season & episode for TV shows if not explicitly provided in URL
  useEffect(() => {
    if (type !== "tv") return;
    if (initialSeason) return;

    try {
      const history = getWatchHistory();
      const lastWatched = history.find(
        (item) => String(item.id) === String(id) && item.type === "tv"
      );

      if (lastWatched && lastWatched.season) {
        setSelectedSeason(lastWatched.season);
        if (lastWatched.episode) {
          setSelectedEpisode(lastWatched.episode);
        }
      }
    } catch (err) {
      console.error("Error reading watch history for auto-select:", err);
    }
  }, [id, type, initialSeason]);

  // Check saved progress for current title / episode
  useEffect(() => {
    try {
      const progress = getSavedProgress(id, type, selectedSeason, selectedEpisode);
      if (progress && progress.currentTime > 5 && progress.progressPercentage < 95) {
        setSavedProgress(progress);
        if (initialTime === undefined) {
          setPlayheadTime(progress.currentTime);
        }
      } else {
        setSavedProgress(null);
      }
    } catch (err) {
      console.error("Error checking saved progress:", err);
    }
  }, [id, type, selectedSeason, selectedEpisode, initialTime]);

  const formatProgressTime = (seconds: number) => {
    const total = Math.max(0, Math.floor(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  const [episodesList, setEpisodesList] = useState<any[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(false);

  // Fetch season episodes from TMDB
  useEffect(() => {
    if (type !== "tv") return;

    let isMounted = true;
    const fetchEpisodes = async () => {
      setIsLoadingEpisodes(true);
      try {
        const data = await getTVShowEpisodes(id, selectedSeason);
        if (isMounted) {
          if (data && data.episodes) {
            setEpisodesList(data.episodes);
          } else {
            setEpisodesList([]);
          }
        }
      } catch (error) {
        console.error("Error fetching episodes:", error);
        if (isMounted) setEpisodesList([]);
      } finally {
        if (isMounted) setIsLoadingEpisodes(false);
      }
    };

    fetchEpisodes();

    return () => {
      isMounted = false;
    };
  }, [id, selectedSeason, type]);

  // Fetch direct ad-free stream from backend extractor API
  useEffect(() => {
    let isMounted = true;

    const fetchDirectStream = async () => {
      setIsDirectLoading(true);
      setDirectError(null);

      try {
        const queryParams = new URLSearchParams({
          id,
          type,
          season: selectedSeason.toString(),
          episode: selectedEpisode.toString(),
          server: selectedServer,
          lang: selectedLanguage,
          origLang: originalLanguage || spokenLanguages?.[0]?.iso_639_1 || "en",
        });

        const res = await fetch(`/api/stream?${queryParams.toString()}`);
        const data = await res.json().catch(() => null);

        if (!isMounted) return;

        if (data && data.success && (data.streamUrl || data.embedUrl)) {
          setDirectStream(data);
          if (Array.isArray(data.availableLanguages)) {
            setServerLanguages(data.availableLanguages);
          }
          if (Array.isArray(data.availableServers)) {
            setAvailableServers(data.availableServers);
            // If currently selected server is not in available servers, select first available
            if (
              data.availableServers.length > 0 &&
              !data.availableServers.some((s: any) => s.id === selectedServer)
            ) {
              setSelectedServer(data.availableServers[0].id);
            }
          }
          setDirectError(null);
        } else {
          setDirectStream(null);
          if (Array.isArray(data?.availableServers)) {
            setAvailableServers(data.availableServers);
          }
          if (Array.isArray(data?.availableLanguages)) {
            setServerLanguages(data.availableLanguages);
          }
          setDirectError(
            data?.error ||
            "Direct stream is currently unavailable for this title on our servers."
          );
        }
      } catch (error) {
        console.error("Direct stream fetch error:", error);
        if (isMounted) {
          setDirectStream(null);
          setDirectError("Direct stream could not be loaded. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setIsDirectLoading(false);
        }
      }
    };

    fetchDirectStream();

    return () => {
      isMounted = false;
    };
  }, [id, type, selectedSeason, selectedEpisode, selectedServer, selectedLanguage, retryCount]);

  const currentSeasonInfo = activeSeasons.find(
    (s) => s.season_number === selectedSeason
  ) || activeSeasons[0];

  const episodeCount = currentSeasonInfo ? currentSeasonInfo.episode_count : 10;

  // Dynamically compute real available audio tracks from the stream manifest
  const availableAudioTracks = React.useMemo<AudioTrackItem[]>(() => {
    if (directStream?.audioTracks && directStream.audioTracks.length > 0) {
      const seen = new Set<string>();
      const tracks: AudioTrackItem[] = [];

      for (const track of directStream.audioTracks) {
        const rawLang = (track.lang || "").toLowerCase().trim();
        const rawLabel = (track.label || "").trim();
        const info = resolveLanguageInfo(rawLang, rawLabel);
        const dedupeKey = `${info.name}_${info.code}`.toLowerCase();

        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        tracks.push({
          id: `track_${rawLang}_${rawLabel}_${tracks.length}`,
          name: info.name,
          code: info.code,
          rawLabel,
          rawLang,
          isDefault: Boolean(track.default),
        });
      }
      return tracks;
    }

    // Fallback if stream has a single multiplexed audio track without separate manifest tracks
    if (directStream && !isDirectLoading) {
      const origLang = spokenLanguages?.[0]?.english_name || spokenLanguages?.[0]?.name || "English (Original)";
      const info = resolveLanguageInfo(spokenLanguages?.[0]?.iso_639_1, origLang);
      return [{
        id: "default_audio",
        name: origLang,
        code: info.code || "ENG",
        rawLabel: origLang,
        rawLang: spokenLanguages?.[0]?.iso_639_1 || "en",
        isDefault: true,
      }];
    }

    return [];
  }, [directStream, isDirectLoading, spokenLanguages]);

  // Aggregated multi-server languages list with deduplication and clean names
  const displayLanguages = React.useMemo(() => {
    let rawList: (ServerLanguageItem | AudioTrackItem)[] = [];

    if (serverLanguages.length > 0) {
      rawList = serverLanguages;
    } else if (availableAudioTracks.length > 0) {
      rawList = availableAudioTracks;
    } else {
      // Default to genuine Original / English audio options (only verified audio tracks)
      const origInfo = resolveLanguageInfo(originalLanguage, originalLanguage);
      rawList = [
        {
          id: "s1_eng_def",
          name: "English",
          code: "ENG",
          rawLabel: "English",
          rawLang: "en",
          serverId: selectedServer,
          serverName: "Server 1 (CineStream Fast HD)",
          serverBadge: "Fast HD",
          provider: "CineStream Cloud Direct",
          isDefault: !originalLanguage || originalLanguage === "en",
        },
      ];

      if (origInfo.name && origInfo.name.toLowerCase() !== "english") {
        rawList.push({
          id: `s1_orig_${origInfo.code}`,
          name: origInfo.name,
          code: origInfo.code,
          rawLabel: origInfo.name,
          rawLang: originalLanguage || "und",
          serverId: selectedServer,
          serverName: "Original Audio",
          serverBadge: "Original",
          provider: "Original Master",
          isDefault: true,
        });
      }
    }

    const seenNames = new Set<string>();
    const cleaned: ServerLanguageItem[] = [];

    for (const item of rawList) {
      const pureName = cleanLanguageName(item.name);
      const key = pureName.toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        cleaned.push({
          id: item.id,
          name: pureName,
          code: item.code,
          serverId: item.serverId || selectedServer,
          serverName: "serverName" in item ? item.serverName : "Server 1",
          serverBadge: item.serverBadge || "1080p",
          provider: "provider" in item ? item.provider : "CineStream Cloud",
          isDefault: item.isDefault,
        });
      }
    }

    // Sort: English first if present, then alphabetical
    cleaned.sort((a, b) => {
      const aEng = a.name.toLowerCase() === "english";
      const bEng = b.name.toLowerCase() === "english";
      if (aEng && !bEng) return -1;
      if (!aEng && bEng) return 1;
      return a.name.localeCompare(b.name);
    });

    return cleaned;
  }, [serverLanguages, availableAudioTracks, spokenLanguages, originalLanguage, selectedServer]);

  // Keep selectedLanguage synced with user's saved preference or first available track
  useEffect(() => {
    if (displayLanguages.length === 0) return;

    // 1. Check if user previously selected a preferred language (e.g. Hindi, English)
    const savedPref = getPreferredAudioLanguage();
    if (savedPref) {
      const match = displayLanguages.find((l) =>
        isLanguageMatch(savedPref, { label: l.name, lang: l.code })
      );
      if (match) {
        setSelectedLanguage(match.name);
        return;
      }
    }

    // 2. If current selectedLanguage matches an available track, keep it
    const currentMatch = displayLanguages.find((l) =>
      isLanguageMatch(selectedLanguage, { label: l.name, lang: l.code })
    );

    if (!currentMatch) {
      const defaultLang = displayLanguages.find((l) => l.isDefault) || displayLanguages[0];
      if (defaultLang) {
        setSelectedLanguage(defaultLang.name);
      }
    }
  }, [displayLanguages]);

  // Attach non-passive wheel listener and window drag listeners for audio scroll
  useEffect(() => {
    const el = audioScrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      } else if (e.deltaX !== 0) {
        el.scrollLeft += e.deltaX;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isAudioDraggingRef.current || !audioScrollRef.current) return;
      const x = e.pageX - audioScrollRef.current.offsetLeft;
      const walk = x - audioStartXRef.current;
      if (Math.abs(walk) > 4) {
        audioHasMovedRef.current = true;
      }
      audioScrollRef.current.scrollLeft = audioStartScrollLeftRef.current - walk;
    };

    const onMouseUp = () => {
      isAudioDraggingRef.current = false;
      setTimeout(() => {
        audioHasMovedRef.current = false;
      }, 50);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [displayLanguages]);

  const subtitlesList = React.useMemo(() => {
    if (directStream?.subtitles && directStream.subtitles.length > 0) {
      return Array.from(new Set(directStream.subtitles.map((s) => s.label || s.lang)));
    }
    return ["English", "Spanish", "French", "German", "Multi-Language"];
  }, [directStream?.subtitles]);

  // Close trailer on Escape key
  useEffect(() => {
    if (!isTrailerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsTrailerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTrailerOpen]);

  const fallbackEpisodesArray = Array.from({ length: episodeCount }, (_, i) => i + 1);
  const handleSelectLanguage = (lang: string, serverId?: string) => {
    const clean = cleanLanguageName(lang);
    setSelectedLanguage(clean);
    setPreferredAudioLanguage(clean);
    if (serverId && serverId !== selectedServer) {
      if (
        availableServers.length === 0 ||
        availableServers.some((s) => s.id === serverId)
      ) {
        setSelectedServer(serverId);
      }
    }
  };

  const handleSeasonChange = (seasonNum: number) => {
    setSelectedSeason(seasonNum);
    setSelectedEpisode(1);
  };

  const handleEpisodeSelect = (episodeNum: number) => {
    setSelectedEpisode(episodeNum);
    const prog = getSavedProgress(id, "tv", selectedSeason, episodeNum);
    if (prog && prog.currentTime > 5 && prog.progressPercentage < 95) {
      setPlayheadTime(prog.currentTime);
    } else {
      setPlayheadTime(0);
    }
    setIsPlayerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Visual Breadcrumbs for SEO & Fast Navigation */}
      <nav aria-label="Breadcrumb" className="px-4 sm:px-6 md:px-16 pt-1">
        <ol className="flex items-center flex-wrap gap-2 text-xs font-bold text-white/50">
          <li className="flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1.5">
              <i className="ph-bold ph-house text-sm"></i>
              <span>Home</span>
            </Link>
          </li>
          <li className="text-white/20">/</li>
          <li className="flex items-center gap-2">
            <Link href={type === "movie" ? "/movies" : "/tv-shows"} className="hover:text-white transition-colors">
              {type === "movie" ? "Movies" : "TV Shows"}
            </Link>
          </li>
          {genres && genres.length > 0 && (
            <>
              <li className="text-white/20">/</li>
              <li className="flex items-center gap-2">
                <Link href={`/explore/genre/${genres[0]}`} className="hover:text-accent transition-colors">
                  {genres[0]}
                </Link>
              </li>
            </>
          )}
          <li className="text-white/20">/</li>
          <li className="text-white/90 font-black truncate max-w-[200px] sm:max-w-md">
            {title}
          </li>
        </ol>
      </nav>

      {/* Dynamic Watch Preview Hero Banner */}
      <div className="relative px-4 sm:px-6 md:px-16">
        {backdropPath && (
          <div
            className="absolute -inset-2 md:-inset-6 -z-10 bg-cover bg-center opacity-30 blur-[70px] rounded-3xl scale-95 pointer-events-none"
            style={{ backgroundImage: `url('https://image.tmdb.org/t/p/w500${backdropPath}')` }}
          />
        )}

        <div
          onClick={() => setIsPlayerOpen(true)}
          className="relative w-full h-64 sm:h-80 md:h-[75vh] bg-[#0c0c10] shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-10 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 group cursor-pointer flex flex-col justify-end p-4 sm:p-6 md:p-12 select-none"
        >
          {/* Background Poster Image */}
          {backdropPath && (
            <img
              src={`https://image.tmdb.org/t/p/w1280${backdropPath}`}
              alt={title || "Movie Backdrop"}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-60 group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          )}

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20 group-hover:via-black/30 transition-all duration-500"></div>

          {/* Center Play Button with Pulsing Ring */}
          <div className="absolute inset-0 m-auto flex flex-col items-center justify-center gap-2.5 sm:gap-4 text-center z-10 max-w-lg px-3 sm:px-4">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full bg-accent/40 animate-ping"></span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (savedProgress) {
                    setPlayheadTime(savedProgress.currentTime);
                  }
                  setIsPlayerOpen(true);
                }}
                className="relative h-13 w-13 sm:h-18 sm:w-18 md:h-24 md:w-24 rounded-full bg-accent hover:bg-accent/90 text-white flex items-center justify-center text-2xl sm:text-3xl md:text-4xl shadow-[0_0_50px_rgba(231,76,60,0.7)] transition-all duration-300 group-hover:scale-110 cursor-pointer border-2 border-white/30 active:scale-95"
                aria-label={savedProgress ? "Resume Playback" : "Play Video"}
              >
                <svg className="w-6 h-6 sm:w-9 sm:h-9 md:w-11 md:h-11 fill-current ml-0.5 sm:ml-1" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-base sm:text-xl md:text-3xl font-black italic uppercase tracking-wider text-white drop-shadow-md">
                {savedProgress
                  ? type === "tv"
                    ? `Resume S${selectedSeason} • E${selectedEpisode}`
                    : "Resume Movie"
                  : type === "tv"
                    ? `Play Season ${selectedSeason} • Episode ${selectedEpisode}`
                    : "Play Movie"}
              </h3>

              {savedProgress && (
                <div className="space-y-2 pt-1 animate-fade-in">
                  <div className="flex items-center gap-2 justify-center flex-wrap">
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-md">
                      Resume at {formatProgressTime(savedProgress.currentTime)}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-white/70">
                      ({savedProgress.progressPercentage}% completed)
                    </span>
                  </div>

                  <div className="w-36 sm:w-64 h-1 sm:h-1.5 bg-white/20 rounded-full overflow-hidden mx-auto shadow-inner">
                    <div
                      className="h-full bg-red-600 rounded-full shadow-[0_0_10px_rgba(229,9,20,0.9)]"
                      style={{ width: `${Math.min(100, Math.max(5, savedProgress.progressPercentage))}%` }}
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayheadTime(0);
                        setIsPlayerOpen(true);
                      }}
                      className="text-[11px] font-bold text-white/50 hover:text-white transition-colors uppercase tracking-wider underline underline-offset-4 cursor-pointer hover:scale-105 inline-block mt-1"
                    >
                      Start from Beginning (0:00)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cinema Mode Fullscreen Player Modal - 100% Ad-Free Native HLS Player */}
      {mounted && isPlayerOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/98 flex items-center justify-center cinema-modal-wrapper h-[100dvh] w-[100vw] touch-manipulation overscroll-none select-none"
          style={{ touchAction: "manipulation" }}
        >
          <div className="relative w-full h-full max-w-none flex items-center justify-center overflow-hidden bg-black">
            {isDirectLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
                <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
                <div className="space-y-1">
                  <h3 className="text-base font-black uppercase text-white tracking-wider">Connecting to Stream Server</h3>
                  <p className="text-xs text-[#a0a0a0]">Decrypting and loading 100% ad-free stream...</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlayerOpen(false)}
                  className="mt-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : directError || !directStream ? (
              <div className="flex flex-col items-center justify-center gap-4 text-center p-8 max-w-md">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black border ${isUpcoming
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-red-500/20 text-red-500 border-red-500/30"
                  }`}>
                  {isUpcoming ? "📅" : "!"}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black uppercase text-white tracking-wide">
                    {isUpcoming ? `Upcoming Release (${releaseYear})` : "Playback Unavailable"}
                  </h3>
                  <p className="text-xs text-[#a0a0a0] leading-relaxed">
                    {isUpcoming
                      ? `"${title}" is an upcoming title scheduled for release in ${releaseYear}. Full HD streaming will be available automatically as soon as it officially premieres.`
                      : directError || "Direct stream could not be loaded for this title on selected server."}
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  {!isUpcoming && (
                    <button
                      type="button"
                      onClick={() => setRetryCount((c) => c + 1)}
                      className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer"
                    >
                      Retry Connection
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsPlayerOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <AdFreePlayer
                key={`adfree-player-${id}-${selectedSeason}-${selectedEpisode}-${selectedServer}`}
                streamUrl={directStream.streamUrl || undefined}
                embedUrl={directStream.embedUrl}
                format={directStream.format}
                title={title || (type === "tv" ? `Season ${selectedSeason} • Episode ${selectedEpisode}` : undefined)}
                poster={backdropPath ? `https://image.tmdb.org/t/p/w1280${backdropPath}` : undefined}
                mediaId={`${id}-${type}-${selectedSeason}-${selectedEpisode}`}
                tmdbId={id}
                mediaType={type}
                season={selectedSeason}
                episode={selectedEpisode}
                posterPath={posterPath || undefined}
                backdropPath={backdropPath || undefined}
                initialTime={playheadTime}
                subtitles={directStream.subtitles}
                audioTracks={directStream.audioTracks}
                initialAudioLang={selectedLanguage}
                serverLanguages={serverLanguages}
                servers={availableServers.length > 0 ? availableServers : directStream.availableServers || []}
                currentServer={selectedServer}
                onServerChange={(sId, targetLang) => {
                  setSelectedServer(sId);
                  if (targetLang) setSelectedLanguage(targetLang);
                }}
                onClose={() => setIsPlayerOpen(false)}
              />
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Episode Controls on Watch Page & Audio Language Bar */}
      <div className="px-3 sm:px-6 md:px-16 space-y-6 sm:space-y-8">

        {/* 1. Title & Quick Actions Header (Positioned cleanly at top below player) */}
        <div className="space-y-3.5 pt-2">
          {/* Badge & Media Type & Streaming Source */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="bg-accent px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest italic shadow-md shadow-accent/20">
              Now Playing
            </span>
            <span className="text-white/40 font-bold text-xs tracking-widest uppercase">
              {type}
            </span>
            {source && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider border transition-all select-none shadow-md ${
                  getSourceBadgeStyle(source.name).bg
                } ${getSourceBadgeStyle(source.name).border} ${
                  getSourceBadgeStyle(source.name).text
                } ${getSourceBadgeStyle(source.name).glow}`}
              >
                {getSourceBadgeStyle(source.name).isNetflix ? (
                  <span className="text-[11px] font-black tracking-tighter">N</span>
                ) : null}
                <span>{getSourceBadgeStyle(source.name).badgeText}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black italic uppercase tracking-tight text-white leading-tight">
            {title}
          </h1>

          {/* Single Unified, Rich Metadata Line (No Duplication) */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 text-xs sm:text-sm">
            <span className="text-emerald-400 font-black tracking-tight text-sm md:text-base">
              {matchPercentage}% match
            </span>
            {voteAverage && voteAverage > 0 ? (
              <div className="flex items-center gap-1 text-yellow-400 bg-yellow-500/10 px-2.5 py-0.5 rounded-md border border-yellow-500/20 text-xs font-bold">
                <i className="ph-fill ph-star text-xs"></i>
                <span>{voteAverage.toFixed(1)}</span>
              </div>
            ) : null}
            <span className="text-white/80 font-medium">
              {releaseYear || "2024"}
            </span>
            <span className="text-white/80 font-medium">
              {formattedDuration}
            </span>
            <span className="px-1.5 py-0.5 border border-white/30 text-[10px] md:text-[11px] font-bold text-white/90 rounded tracking-wider">
              HD
            </span>
            <span className="px-1.5 py-0.5 border border-white/30 text-[10px] md:text-[11px] font-bold text-white/90 rounded tracking-wider">
              {certification || (type === "tv" ? "TV-MA" : "U/A 13+")}
            </span>
            {contentAdvisory && (
              <span className="text-white/50 text-xs font-normal hidden sm:inline">
                {contentAdvisory}
              </span>
            )}
            {spokenLanguages && spokenLanguages.length > 0 && (
              <div className="flex items-center gap-1 text-white/60 text-xs font-medium">
                <i className="ph-bold ph-globe text-xs text-white/40"></i>
                <span className="capitalize">
                  {spokenLanguages.map((l) => l.english_name || l.name).slice(0, 2).join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons: Watchlist & Share */}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <WatchlistButton
              item={{
                id,
                title: title || "",
                name: title || "",
                poster_path: posterPath || undefined,
                image: posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : undefined,
                vote_average: voteAverage,
                release_date: releaseDate,
                media_type: type,
                overview,
              }}
            />
            <ShareButton
              title={title || "Watch on CineStream"}
              text={`Watch ${title || ""}${releaseYear ? ` (${releaseYear})` : ""} in Full HD on CineStream! 🍿🎬`}
              poster={posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : undefined}
              url={`https://cinestream-mo.vercel.app/watch/${cleanSlug || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : id)}?type=${type}`}
            />
            {trailerKey && (
              <button
                type="button"
                onClick={() => setIsTrailerOpen(true)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3.5 text-xs md:text-sm font-black uppercase tracking-wider backdrop-blur-md transition-all duration-300 cursor-pointer bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95 shadow-md"
              >
                <i className="ph-fill ph-film-strip text-lg text-red-500"></i>
                <span>Trailer</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Stream Servers & Audio Languages Box (Brought below Title & Names) */}
        <div className="bg-[#0f0f12]/95 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 space-y-4 shadow-2xl backdrop-blur-xl">
          {/* Smart Stream Servers Selector (if available) */}
          {/* {availableServers.length > 0 && (
            <div className="space-y-2.5 pb-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-white/50 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Servers ({availableServers.length} Available)
                </span>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Connected: {availableServers.find((s) => s.id === selectedServer)?.name.split("(")[0].trim() || "Server 1"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 py-1">
                {availableServers.map((srv) => {
                  const isSelected = selectedServer === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedServer(srv.id)}
                      className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 border ${
                        isSelected
                          ? "bg-accent/20 border-accent text-white shadow-lg shadow-accent/20"
                          : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-accent animate-pulse" : "bg-white/30"}`} />
                      <span>{srv.name.split("(")[0].trim()}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-white/60">
                        {srv.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )} */}

          {/* If no verified direct servers exist and playback error occurred, show smart status banner */}
          {availableServers.length === 0 && !isDirectLoading && directError && !directStream?.embedUrl && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-3">
              <span className="text-base">⚠️</span>
              <span>{directError}</span>
            </div>
          )}

          {/* Clean Audio Languages Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white/50 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
                Select Audio Language {displayLanguages.length > 0 && `(${displayLanguages.length} Available)`}
              </span>
              {selectedLanguage && (
                <span className="text-[11px] font-bold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20">
                  Active: {cleanLanguageName(selectedLanguage)}
                </span>
              )}
            </div>

            {/* Scrollable Clean Audio Tracks Row with Simple Overflow Scroll Bar */}
            <div
              ref={audioScrollRef}
              onMouseDown={handleAudioMouseDown}
              className="flex items-center gap-4 sm:gap-6 horizontal-scrollbar py-2 px-1 pb-3 select-none"
            >
              {displayLanguages.map((track) => {
                const isSelected = isLanguageMatch(selectedLanguage, { label: track.name, lang: track.code });

                return (
                  <button
                    key={track.id}
                    type="button"
                    data-active={isSelected ? "true" : undefined}
                    onClick={(e) => {
                      if (audioHasMovedRef.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                      handleSelectLanguage(track.name, track.serverId);
                    }}
                    className={`relative shrink-0 pb-2 text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${isSelected
                      ? "text-white font-black text-sm md:text-base after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600 after:rounded-full"
                      : "text-white/60 hover:text-white"
                      }`}
                  >
                    <span>{cleanLanguageName(track.name)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION HEADER (Netflix Style Underline Tabs - Matching Modal) */}
        <div className="flex items-center gap-6 sm:gap-10 border-b border-white/10 text-xs sm:text-sm font-bold pt-4 overflow-x-auto no-scrollbar">
          {type === "tv" && (
            <button
              type="button"
              onClick={() => setActiveTab("episodes")}
              className={`pb-3 transition-all cursor-pointer relative whitespace-nowrap text-sm sm:text-base ${activeTab === "episodes"
                ? "text-white font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600 after:rounded-full"
                : "text-white/50 hover:text-white"
                }`}
            >
              Episodes
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("more_like_this")}
            className={`pb-3 transition-all cursor-pointer relative whitespace-nowrap text-sm sm:text-base ${activeTab === "more_like_this"
              ? "text-white font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600 after:rounded-full"
              : "text-white/50 hover:text-white"
              }`}
          >
            More Like This
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`pb-3 transition-all cursor-pointer relative whitespace-nowrap text-sm sm:text-base ${activeTab === "details"
              ? "text-white font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600 after:rounded-full"
              : "text-white/50 hover:text-white"
              }`}
          >
            Details &amp; Cast
          </button>
        </div>

        {/* TAB 1: TV SHOW EPISODES */}
        {activeTab === "episodes" && type === "tv" && (
          <div className="space-y-6 animate-fade-in">
            {/* Season Selector */}
            {activeSeasons.length > 0 && (
              <div className="bg-white/5 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-1.5 bg-accent rounded-full"></div>
                  <h4 className="text-xs sm:text-sm font-black italic uppercase tracking-wider text-white">
                    Select Season
                  </h4>
                </div>

                <div ref={seasonDropdownRef} className="relative w-full sm:max-w-md">
                  <button
                    type="button"
                    onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-[#0f0f12] border border-white/10 hover:border-accent/40 text-white transition-all cursor-pointer shadow-lg active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="text-xs md:text-sm font-black uppercase tracking-wider truncate">
                        {currentSeasonInfo?.name || `Season ${selectedSeason}`}
                      </span>
                      <span className="text-[10px] font-bold text-white/40 uppercase bg-white/5 px-2 py-0.5 rounded-md shrink-0">
                        {episodeCount} Episodes
                      </span>
                    </div>
                    <svg className={`w-4 h-4 text-white/60 transition-transform duration-300 ml-2 ${isSeasonDropdownOpen ? "rotate-180 text-accent" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isSeasonDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-[#0f0f12]/98 backdrop-blur-xl border border-white/15 p-2 shadow-2xl max-h-64 overflow-y-auto space-y-1 animate-fade-in">
                      {activeSeasons.map((season) => {
                        const isSelected = selectedSeason === season.season_number;
                        return (
                          <button
                            key={season.season_number}
                            onClick={() => {
                              handleSeasonChange(season.season_number);
                              setIsSeasonDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${isSelected
                              ? "bg-accent text-white shadow-md"
                              : "text-white/70 hover:text-white hover:bg-white/5"
                              }`}
                          >
                            <div className="flex items-center gap-3 truncate">
                              <span className="truncate">{season.name || `Season ${season.season_number}`}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isSelected ? "bg-white/20 text-white" : "bg-white/5 text-white/40"}`}>
                                {season.episode_count} Ep
                              </span>
                            </div>
                            {isSelected && <span className="font-bold">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Episode Cards Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-1.5 bg-accent rounded-full"></div>
                  <h4 className="text-xs sm:text-sm md:text-base font-black italic uppercase tracking-wider text-white">
                    Episodes (Season {selectedSeason})
                  </h4>
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-white/40 uppercase tracking-widest">
                  {episodesList.length > 0 ? episodesList.length : episodeCount} Episodes Available
                </span>
              </div>

              {isLoadingEpisodes ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                  {Array.from({ length: Math.min(episodeCount, 8) }).map((_, i) => (
                    <div
                      key={`skeleton-s${selectedSeason}-${i}`}
                      className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden aspect-video relative animate-pulse flex flex-col justify-end p-3 md:p-4 h-[150px] md:h-[220px]"
                    >
                      <div className="space-y-2 z-10 w-full">
                        <div className="h-3 md:h-4 bg-white/10 rounded w-2/3" />
                        <div className="h-2 md:h-3 bg-white/10 rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                  {(episodesList.length > 0
                    ? episodesList
                    : fallbackEpisodesArray.map((epNum) => ({
                      episode_number: epNum,
                      name: `Episode ${epNum}`,
                      overview: "No description available for this episode.",
                      still_path: null,
                      runtime: null,
                      air_date: null,
                    }))
                  ).map((episode, idx) => {
                    const epProg = mounted ? getSavedProgress(id, "tv", selectedSeason, episode.episode_number) : null;
                    const hasEpProgress = Boolean(epProg && epProg.currentTime > 5 && epProg.progressPercentage < 95);

                    return (
                      <div
                        key={`ep-s${selectedSeason}-e${episode.episode_number}-${episode.id || idx}`}
                        onClick={() => handleEpisodeSelect(episode.episode_number)}
                        className={`group relative flex flex-col bg-white/5 border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${selectedEpisode === episode.episode_number
                          ? "border-accent ring-1 ring-accent/30 bg-accent/5 shadow-[0_0_25px_rgba(231,76,60,0.15)] scale-[1.01]"
                          : "border-white/5 hover:border-white/20 hover:bg-white/10 hover:scale-[1.02]"
                          }`}
                      >
                        <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                          <img
                            src={
                              episode.still_path
                                ? `https://image.tmdb.org/t/p/w500${episode.still_path}`
                                : "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600"
                            }
                            alt={episode.name || `Episode ${episode.episode_number}`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />

                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-accent text-white flex items-center justify-center text-lg md:text-xl shadow-lg shadow-accent/40 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                              <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>

                          <div className="absolute top-2 left-2 md:top-3 md:left-3 px-2 py-0.5 md:py-1 bg-black/80 backdrop-blur-md rounded-lg text-[9px] md:text-[10px] font-black tracking-widest text-white uppercase border border-white/10 z-10">
                            Ep {episode.episode_number}
                          </div>

                          {/* Red Progress Track for Episode */}
                          {hasEpProgress && epProg && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
                              <div
                                className="h-full bg-red-600 shadow-[0_0_8px_rgba(229,9,20,0.9)]"
                                style={{ width: `${Math.min(100, Math.max(5, epProg.progressPercentage))}%` }}
                              />
                            </div>
                          )}

                          {selectedEpisode === episode.episode_number ? (
                            <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 px-2 py-0.5 md:py-1 bg-accent rounded-lg text-[8px] md:text-[9px] font-black tracking-widest text-white uppercase shadow-lg shadow-accent/30 flex items-center gap-1 z-10">
                              <span>{hasEpProgress && epProg ? `Resume (${formatProgressTime(epProg.currentTime)})` : "Selected"}</span>
                            </div>
                          ) : hasEpProgress && epProg ? (
                            <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 px-2 py-0.5 md:py-1 bg-black/80 backdrop-blur-md border border-white/20 rounded-lg text-[8px] md:text-[9px] font-bold text-white/90 uppercase z-10">
                              <span>{epProg.progressPercentage}%</span>
                            </div>
                          ) : null}
                        </div>

                        <div className="p-2.5 md:p-4 flex-1 flex flex-col justify-between space-y-1.5 md:space-y-2">
                          <div>
                            <div className="flex items-start justify-between gap-1.5">
                              <h5 className="font-black italic uppercase text-xs md:text-sm tracking-tight text-white line-clamp-1 group-hover:text-accent transition-colors duration-300">
                                {episode.episode_number}. {episode.name || `Episode ${episode.episode_number}`}
                              </h5>
                              {episode.runtime && (
                                <span className="text-[9px] md:text-[10px] font-bold text-white/45 shrink-0 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                                  {episode.runtime}m
                                </span>
                              )}
                            </div>
                            {episode.overview && (
                              <p className="hidden md:block mt-1.5 text-xs text-white/50 line-clamp-2 font-medium leading-relaxed">
                                {episode.overview}
                              </p>
                            )}
                          </div>

                          {episode.air_date && (
                            <div className="pt-1 md:pt-2 text-[9px] md:text-[10px] font-bold text-white/30 flex items-center gap-1">
                              <span className="truncate">
                                {new Date(episode.air_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MORE LIKE THIS (RECOMMENDATIONS) */}
        {activeTab === "more_like_this" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs sm:text-sm font-bold text-white/50">
                More titles similar to <span className="text-white font-black italic">{title}</span>
              </p>

              <Link
                href="/explore"
                className="text-xs font-black uppercase tracking-widest text-accent hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span>Explore All</span>
                <i className="ph-bold ph-arrow-right"></i>
              </Link>
            </div>

            {recommendations && recommendations.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 md:gap-6">
                {recommendations.slice(0, 18).map((item: any) => (
                  <MovieCard key={item.id} {...item} media_type={item.media_type || type} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 border border-white/5 rounded-2xl">
                <p className="text-white/40 text-xs sm:text-sm italic">No recommendations available for this title.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DETAILS & CAST (MATCHING MODAL LAYOUT) */}
        {activeTab === "details" && (
          <div className="space-y-8 animate-fade-in text-xs sm:text-sm">
            {/* Story / Overview */}
            {overview && (
              <div className="space-y-2 bg-white/5 border border-white/5 rounded-2xl p-5 md:p-6">
                <h5 className="text-xs font-black uppercase tracking-wider text-white/50 flex items-center gap-2">
                  <span className="h-3 w-1 bg-red-600 rounded-full"></span>
                  Storyline
                </h5>
                <p className="text-white/80 text-xs sm:text-sm leading-relaxed font-normal">
                  {overview}
                </p>
              </div>
            )}

            {/* Cast Members (matching modal's rich layout) */}
            {creditsCast && creditsCast.length > 0 && (
              <div className="space-y-4">
                <h5 className="text-xs font-black uppercase tracking-wider text-white/50 flex items-center gap-2">
                  <span className="h-3 w-1 bg-red-600 rounded-full"></span>
                  Cast Members ({creditsCast.length})
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {creditsCast.slice(0, 18).map((c) => (
                    <div
                      key={c.id || c.name}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                    >
                      {c.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                          alt={c.name}
                          className="h-10 w-10 rounded-lg object-cover shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <span className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-xs font-black text-white/60 shrink-0">
                          {c.name.charAt(0)}
                        </span>
                      )}
                      <div className="truncate min-w-0">
                        <div className="font-bold text-white truncate text-xs">{c.name}</div>
                        {c.character && (
                          <div className="text-[10px] text-white/40 truncate">{c.character}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extended Production & Metadata Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 md:p-6 bg-white/5 border border-white/5 rounded-2xl">
              {director && (
                <div className="space-y-1">
                  <span className="text-white/40 font-bold uppercase text-[10px] tracking-wider">Director / Creator:</span>
                  <div className="text-white font-bold text-xs sm:text-sm">{director}</div>
                </div>
              )}

              {genres && genres.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-white/40 font-bold uppercase text-[10px] tracking-wider">Genres:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {genres.map((g) => (
                      <span key={g} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/80 text-[10px] font-bold">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {spokenLanguages && spokenLanguages.length > 0 && (
                <div className="space-y-1">
                  <span className="text-white/40 font-bold uppercase text-[10px] tracking-wider">Audio Languages:</span>
                  <div className="text-white/80 text-xs sm:text-sm">
                    {spokenLanguages.map((l) => l.english_name || l.name).join(", ")}
                  </div>
                </div>
              )}

              {releaseDate && (
                <div className="space-y-1">
                  <span className="text-white/40 font-bold uppercase text-[10px] tracking-wider">Release Date:</span>
                  <div className="text-white/80 text-xs sm:text-sm">
                    {new Date(releaseDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              )}

              {status && (
                <div className="space-y-1">
                  <span className="text-white/40 font-bold uppercase text-[10px] tracking-wider">Status:</span>
                  <div className="text-white/80 text-xs sm:text-sm">{status}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cinematic Trailer Modal Popup */}
      {isTrailerOpen && trailerKey && typeof document !== "undefined" && createPortal(
        <div
          onClick={() => setIsTrailerOpen(false)}
          className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/85 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-black rounded-2xl sm:rounded-3xl border border-white/15 overflow-hidden shadow-2xl animate-scale-in"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#0f0f12]/95">
              <div className="flex items-center gap-2.5 truncate">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
                <span className="text-xs sm:text-sm font-black italic uppercase tracking-wider text-white truncate">
                  {title} • Official Trailer
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsTrailerOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close trailer"
              >
                <i className="ph-bold ph-x text-base"></i>
              </button>
            </div>

            {/* Embedded YouTube Player */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                title={`${title} Trailer`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
