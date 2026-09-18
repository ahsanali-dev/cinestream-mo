"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuickView } from "@/context/QuickViewContext";
import { useWatchlist } from "@/lib/watchlist";
import { getSavedProgress, getWatchHistory } from "@/lib/watch-history";
import { getTVShowEpisodes } from "@/lib/tmdb";

export default function QuickViewModal() {
  const router = useRouter();
  const { isOpen, activeItem, closeQuickView, dismissModal, openQuickView } = useQuickView();
  const { isSaved, toggle } = useWatchlist();

  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [savedProgress, setSavedProgress] = useState<any>(null);
  const [availableServers, setAvailableServers] = useState<any[]>([]);

  const modalRef = useRef<HTMLDivElement>(null);

  const id = activeItem?.id ? String(activeItem.id) : "";
  const type = activeItem?.type || activeItem?.media_type || (activeItem?.name || activeItem?.first_air_date ? "tv" : "movie");
  const inWatchlist = id ? isSaved(id) : false;

  const displayTitle = activeItem?.title || activeItem?.name || details?.title || "Title";
  const cleanSlug = displayTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Active Tab state: TV defaults to "episodes", Movie defaults to "more_like_this"
  const [activeTab, setActiveTab] = useState<string>(type === "tv" ? "episodes" : "more_like_this");

  useEffect(() => {
    setActiveTab(type === "tv" ? "episodes" : "more_like_this");
  }, [type, activeItem]);

  // Fetch full details when modal opens
  useEffect(() => {
    if (!isOpen || !id) return;

    let isMounted = true;
    setLoading(true);
    setDetails(null);

    // Check watch history for auto-selecting last watched season/episode
    if (type === "tv") {
      const history = getWatchHistory();
      const lastWatched = history.find((h) => String(h.id) === id && h.type === "tv");
      if (lastWatched && lastWatched.season) {
        setSelectedSeason(lastWatched.season);
      } else {
        setSelectedSeason(1);
      }
    }

    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/details?id=${id}&type=${type}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setDetails(json.data);
        }
      } catch (err) {
        console.error("Error fetching modal details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Probe available servers
    const fetchServers = async () => {
      try {
        const res = await fetch(`/api/stream?id=${id}&type=${type}&season=1&episode=1`);
        const data = await res.json().catch(() => null);
        if (isMounted && Array.isArray(data?.availableServers)) {
          setAvailableServers(data.availableServers);
        }
      } catch {
        // Fallback
      }
    };

    fetchDetails();
    fetchServers();

    return () => {
      isMounted = false;
    };
  }, [isOpen, id, type]);

  // Check saved progress for current title
  useEffect(() => {
    if (!id) return;

    try {
      const prog = getSavedProgress(id, type, type === "tv" ? selectedSeason : undefined, 1);
      if (prog && prog.currentTime > 5 && prog.progressPercentage < 95) {
        setSavedProgress(prog);
      } else {
        setSavedProgress(null);
      }
    } catch {
      setSavedProgress(null);
    }
  }, [id, type, selectedSeason]);

  // Fetch TV episodes when season changes
  useEffect(() => {
    if (type !== "tv" || !id || !isOpen) return;

    let isMounted = true;
    setLoadingEpisodes(true);

    const fetchEps = async () => {
      try {
        const data = await getTVShowEpisodes(id, selectedSeason);
        if (isMounted) {
          setEpisodes(data?.episodes || []);
        }
      } catch (err) {
        if (isMounted) setEpisodes([]);
      } finally {
        if (isMounted) setLoadingEpisodes(false);
      }
    };

    fetchEps();

    return () => {
      isMounted = false;
    };
  }, [id, type, selectedSeason, isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeQuickView();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeQuickView]);

  if (!isOpen || !activeItem) return null;

  const backdrop = details?.backdrop_path || activeItem.backdrop_path;
  const imageSrc = backdrop
    ? `https://image.tmdb.org/t/p/w1280${backdrop}`
    : activeItem.poster_path
    ? `https://image.tmdb.org/t/p/w780${activeItem.poster_path}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200";

  const releaseYear = details?.releaseYear || activeItem.release_date?.split("-")[0] || activeItem.first_air_date?.split("-")[0] || activeItem.year || "2024";
  const rating = details?.vote_average ? details.vote_average.toFixed(1) : activeItem.vote_average ? activeItem.vote_average.toFixed(1) : "8.5";
  const matchPct = Math.min(99, Math.max(65, Math.round(parseFloat(rating) * 10)));
  const certification = details?.certification || (type === "tv" ? "TV-14" : "U/A 13+");

  const formatDuration = (mins?: number) => {
    if (!mins || mins <= 0) return "HD";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}` : `${m}m`;
  };

  const formatProgressTime = (seconds: number) => {
    const total = Math.max(0, Math.floor(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handlePlayDirect = (seasonNum = 1, episodeNum = 1) => {
    dismissModal();
    const resumeTime = savedProgress?.currentTime ? Math.floor(savedProgress.currentTime) : 0;
    const watchLink = `/watch/${cleanSlug}?type=${type}${
      type === "tv" ? `&s=${seasonNum}&e=${episodeNum}` : ""
    }${resumeTime > 0 ? `&t=${resumeTime}` : ""}&play=1`;
    router.push(watchLink);
  };

  // Navigates reliably to the full watch page
  const handleGoToFullPage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dismissModal();
    router.push(`/watch/${cleanSlug}?type=${type}`);
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle({
      id,
      title: displayTitle,
      name: displayTitle,
      poster_path: details?.poster_path || activeItem.poster_path,
      image: imageSrc,
      vote_average: details?.vote_average || activeItem.vote_average,
      release_date: details?.release_date || activeItem.release_date,
      first_air_date: details?.first_air_date || activeItem.first_air_date,
      year: releaseYear,
      media_type: type,
      overview: details?.overview || activeItem.overview,
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-99999 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden animate-fade-in"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          closeQuickView();
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full sm:max-w-4xl bg-[#111116] border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-3xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.95)] max-h-[92dvh] sm:max-h-[90vh] h-[92dvh] sm:h-auto flex flex-col relative text-white animate-fade-in"
      >
        {/* Mobile Pull Indicator */}
        <div className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 z-40 w-10 h-1 bg-white/30 rounded-full pointer-events-none" />

        {/* Top Right Close Button */}
        <button
          type="button"
          onClick={closeQuickView}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer border border-white/20 transition-all z-40 shadow-lg group hover:scale-105 active:scale-95"
          title="Close (Esc)"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Top Hero Banner Section */}
        <div className="relative w-full h-52 sm:h-80 md:h-96 shrink-0 overflow-hidden bg-black">
          <img
            src={imageSrc}
            alt={displayTitle}
            className="w-full h-full object-cover object-center opacity-70"
          />

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-linear-to-t from-[#111116] via-[#111116]/50 to-transparent"></div>
          <div className="absolute inset-0 bg-linear-to-r from-[#111116]/90 via-[#111116]/30 to-transparent"></div>

          {/* Hero Bottom Info & Action Buttons */}
          <div className="absolute bottom-3.5 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 space-y-2.5 sm:space-y-4 z-20">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-black italic uppercase tracking-tight text-white drop-shadow-md line-clamp-1 sm:line-clamp-2">
              {displayTitle}
            </h2>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Primary Play / Resume Button */}
              <button
                type="button"
                onClick={() => handlePlayDirect(selectedSeason, 1)}
                className="px-4 py-2 sm:px-7 sm:py-3 rounded-xl sm:rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black italic uppercase text-xs sm:text-sm tracking-wider flex items-center gap-1.5 sm:gap-2 shadow-[0_0_25px_rgba(229,9,20,0.8)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-red-400/40 shrink-0"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>{savedProgress ? `Resume (${formatProgressTime(savedProgress.currentTime)})` : "Play Now"}</span>
              </button>

              {/* Watchlist Bookmark */}
              <button
                type="button"
                onClick={handleWatchlistClick}
                className={`h-8.5 w-8.5 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  inWatchlist
                    ? "bg-red-600/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(229,9,20,0.3)]"
                    : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                }`}
                title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                aria-label="Toggle Watchlist"
              >
                <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${inWatchlist ? "fill-current" : "none"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              {/* View Full Watch Page Button */}
              <button
                type="button"
                onClick={handleGoToFullPage}
                className="px-3.5 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all hover:border-white/40 cursor-pointer active:scale-95 shrink-0"
                title="View Full Watch Page with All Details"
              >
                <span>Full Page</span>
                <svg className="w-3.5 h-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body Details */}
        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Metadata Line */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <span className="text-emerald-400 font-black tracking-tight text-xs sm:text-sm">
              {matchPct}% match
            </span>
            <span className="text-white/80 font-semibold text-xs">{releaseYear}</span>
            <span className="text-white/80 font-semibold text-xs">{formatDuration(details?.runtime)}</span>
            <span className="px-1.5 py-0.5 border border-white/30 text-[9px] sm:text-[10px] font-bold text-white/90 rounded tracking-wider">
              HD
            </span>
            <span className="px-1.5 py-0.5 border border-white/30 text-[9px] sm:text-[10px] font-bold text-white/90 rounded tracking-wider">
              {certification}
            </span>
            {details?.contentAdvisory && (
              <span className="text-white/50 text-[10px] sm:text-[11px] font-normal truncate max-w-[200px] sm:max-w-xs">
                {details.contentAdvisory}
              </span>
            )}
          </div>

          {/* Synopsis */}
          <p className="text-white/75 text-xs sm:text-sm leading-relaxed font-normal line-clamp-3 sm:line-clamp-none">
            {details?.overview || activeItem.overview || "No overview available for this title."}
          </p>

          {/* Active Stream Servers */}
          {availableServers.length > 0 && (
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/50 flex items-center gap-1.5 sm:gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Verified Active Servers ({availableServers.length} Available)
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Ready to Stream
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {availableServers.map((srv) => (
                  <span
                    key={srv.id}
                    className="px-2 py-0.8 sm:px-2.5 sm:py-1 rounded-lg bg-black/40 border border-white/10 text-[10px] sm:text-[11px] font-bold text-white/80 flex items-center gap-1 sm:gap-1.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    <span>{srv.name.split("(")[0].trim()}</span>
                    <span className="text-[8px] sm:text-[9px] font-mono px-1 py-0.2 rounded bg-white/10 text-white/60">{srv.badge}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* TAB NAVIGATION HEADER (Netflix Style Underline Tabs) */}
          <div className="flex items-center gap-4 sm:gap-8 border-b border-white/10 text-xs sm:text-sm font-bold pt-1 sm:pt-2 overflow-x-auto no-scrollbar">
            {type === "tv" && (
              <button
                type="button"
                onClick={() => setActiveTab("episodes")}
                className={`pb-2.5 sm:pb-3 transition-all cursor-pointer relative whitespace-nowrap ${
                  activeTab === "episodes"
                    ? "text-white font-black text-xs sm:text-base after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600 after:rounded-full"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Episodes
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("more_like_this")}
              className={`pb-2.5 sm:pb-3 transition-all cursor-pointer relative whitespace-nowrap ${
                activeTab === "more_like_this"
                  ? "text-white font-black text-xs sm:text-base after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600 after:rounded-full"
                  : "text-white/50 hover:text-white"
              }`}
            >
              More Like This
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`pb-2.5 sm:pb-3 transition-all cursor-pointer relative whitespace-nowrap ${
                activeTab === "details"
                  ? "text-white font-black text-xs sm:text-base after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600 after:rounded-full"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Details & Cast
            </button>
          </div>

          {/* TAB 1: TV SHOW EPISODES */}
          {activeTab === "episodes" && type === "tv" && details?.seasons && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-white/50 uppercase tracking-wider">
                  Select Season
                </span>

                {/* Season Picker */}
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(parseInt(e.target.value, 10))}
                  className="bg-black/60 border border-white/15 rounded-lg sm:rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-bold text-white uppercase focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  {details.seasons
                    .filter((s: any) => s.season_number > 0)
                    .map((s: any) => (
                      <option key={s.season_number} value={s.season_number}>
                        {s.name || `Season ${s.season_number}`} (${s.episode_count} Ep)
                      </option>
                    ))}
                </select>
              </div>

              {/* Episodes Grid */}
              {loadingEpisodes ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-video bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 pb-2">
                  {episodes.map((ep: any) => {
                    const epProg = getSavedProgress(id, "tv", selectedSeason, ep.episode_number);
                    const hasProg = Boolean(epProg && epProg.currentTime > 5);

                    return (
                      <div
                        key={ep.episode_number}
                        onClick={() => handlePlayDirect(selectedSeason, ep.episode_number)}
                        className="group/ep relative bg-white/5 border border-white/5 hover:border-red-600/60 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95"
                      >
                        <div className="aspect-video w-full relative overflow-hidden bg-black/50">
                          <img
                            src={
                              ep.still_path
                                ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                                : imageSrc
                            }
                            alt={ep.name}
                            className="w-full h-full object-cover group-hover/ep:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/ep:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
                              <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/80 rounded text-[9px] font-black uppercase text-white border border-white/10">
                            Ep {ep.episode_number}
                          </span>
                          {hasProg && epProg && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                              <div
                                className="h-full bg-red-600"
                                style={{ width: `${epProg.progressPercentage}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="p-2 space-y-0.5">
                          <h6 className="text-[11px] font-bold text-white truncate group-hover/ep:text-red-400">
                            {ep.episode_number}. {ep.name || `Episode ${ep.episode_number}`}
                          </h6>
                          {ep.runtime && (
                            <span className="text-[9px] text-white/40">{ep.runtime}m</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MORE LIKE THIS (RECOMMENDATIONS) */}
          {activeTab === "more_like_this" && (
            <div className="space-y-4 animate-fade-in">
              {details?.recommendations && details.recommendations.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pb-2">
                  {details.recommendations.slice(0, 8).map((rec: any) => {
                    const recImage = rec.poster_path
                      ? `https://image.tmdb.org/t/p/w342${rec.poster_path}`
                      : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400";
                    return (
                      <div
                        key={rec.id}
                        onClick={() => openQuickView(rec)}
                        className="group/rec relative aspect-2/3 rounded-xl overflow-hidden bg-black/40 border border-white/10 hover:border-red-600/60 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                      >
                        <img
                          src={recImage}
                          alt={rec.title || rec.name}
                          className="w-full h-full object-cover group-hover/rec:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent opacity-0 group-hover/rec:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                          <span className="text-[11px] font-black uppercase text-white truncate">
                            {rec.title || rec.name}
                          </span>
                          <span className="text-[9px] font-bold text-white/60">
                            {rec.release_date ? rec.release_date.split("-")[0] : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-white/40 text-xs italic py-4">No recommendations available for this title.</p>
              )}
            </div>
          )}

          {/* TAB 3: DETAILS & CAST */}
          {activeTab === "details" && (
            <div className="space-y-6 animate-fade-in text-xs pb-2">
              {/* Top Cast List */}
              {details?.cast && details.cast.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-white/50 flex items-center gap-2">
                    <span className="h-3 w-1 bg-red-600 rounded-full"></span>
                    Cast Members
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
                    {details.cast.map((c: any) => (
                      <div
                        key={c.name}
                        className="flex items-center gap-2 sm:gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10"
                      >
                        {c.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${c.profile_path}`}
                            alt={c.name}
                            className="h-8 w-8 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <span className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-black text-white/60 shrink-0">
                            {c.name.charAt(0)}
                          </span>
                        )}
                        <div className="truncate">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                {details?.director && (
                  <div className="space-y-1">
                    <span className="text-white/40 font-bold uppercase text-[10px] tracking-wider">Director / Creator:</span>
                    <div className="text-white font-bold text-xs">{details.director}</div>
                  </div>
                )}

                {details?.genres && details.genres.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-white/40 font-bold uppercase text-[10px] tracking-wider">Genres:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {details.genres.map((g: any) => (
                        <span key={g.id} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/80 text-[10px] font-bold">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {details?.spoken_languages && details.spoken_languages.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-white/40 font-bold uppercase text-[10px] tracking-wider">Audio Languages:</span>
                    <div className="text-white/80 text-xs">
                      {details.spoken_languages.map((l: any) => l.english_name || l.name).join(", ")}
                    </div>
                  </div>
                )}

                {details?.release_date && (
                  <div className="space-y-1">
                    <span className="text-white/40 font-bold uppercase text-[10px] tracking-wider">Release Date:</span>
                    <div className="text-white/80 text-xs">
                      {new Date(details.release_date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
