"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWatchHistory, WatchHistoryItem } from "@/lib/watch-history";
import { useQuickView } from "@/context/QuickViewContext";
import ScrollRow from "./ScrollRow";

export default function ContinueWatchingRow() {
  const router = useRouter();
  const { history, remove, clear, mounted } = useWatchHistory();
  const { openQuickView } = useQuickView();

  if (!mounted || history.length === 0) {
    return null;
  }

  const formatRemainingTime = (currentTime: number, duration: number) => {
    const remainingSec = Math.max(0, duration - currentTime);
    const m = Math.floor(remainingSec / 60);
    const h = Math.floor(m / 60);
    const remM = m % 60;

    if (h > 0) {
      return `${h}h ${remM > 0 ? `${remM}m` : ""} left`;
    }
    if (m > 0) {
      return `${m}m left`;
    }
    return `${Math.round(remainingSec)}s left`;
  };

  return (
    <section className="px-8 md:px-16 pt-16 animate-fade-in">
      {/* Section Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <span>Continue Watching</span>
          </h2>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Are you sure you want to clear your continue watching history?")) {
                clear();
              }
            }}
            className="text-[11px] font-bold text-white/40 hover:text-accent transition-colors uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ph-bold ph-trash"></i>
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Continue Watching Carousel */}
      <ScrollRow>
        {history.map((item: WatchHistoryItem) => {
          const imageSrc = item.backdropPath
            ? `https://image.tmdb.org/t/p/w780${item.backdropPath}`
            : item.posterPath
            ? `https://image.tmdb.org/t/p/w500${item.posterPath}`
            : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800";

          const cleanSlug = item.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          const resumeTime = Math.max(0, Math.floor(item.currentTime));
          
          // 1. Normal link (navigates to page, does NOT auto-play directly, clean slug without ID)
          const pageLink = `/watch/${cleanSlug}?type=${item.type}${
            item.season ? `&s=${item.season}&e=${item.episode}` : ""
          }&t=${resumeTime}`;

          // 2. Direct Play link (clicking the Play button opens cinema player immediately)
          const directPlayLink = `${pageLink}&play=1`;

          return (
            <div
              key={`cw-${item.id}-${item.type}-${item.season || 0}-${item.episode || 0}`}
              className="w-64 sm:w-72 md:w-80 shrink-0 group relative rounded-2xl overflow-hidden bg-[#121216] border border-white/10 hover:border-accent/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02]"
            >
              {/* Card Body - Clicking anywhere on card opens Quick View Detail Modal with clean URL */}
              <Link 
                href={pageLink} 
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    openQuickView({
                      id: item.id,
                      title: item.title,
                      name: item.title,
                      poster_path: item.posterPath,
                      backdrop_path: item.backdropPath,
                      type: item.type,
                    });
                  }
                }}
                className="block relative aspect-video w-full overflow-hidden bg-black/60"
                title={`View ${item.title} details & resume`}
              >
                {/* Backdrop Thumbnail */}
                <img
                  src={imageSrc}
                  alt={item.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out opacity-80 group-hover:opacity-95"
                  loading="lazy"
                />

                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>

                {/* Dedicated Play Button Overlay - Clicking THIS plays immediately */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(directPlayLink);
                    }}
                    className="pointer-events-auto h-12 w-12 sm:h-13 sm:w-13 rounded-full bg-accent/90 hover:bg-accent text-white flex items-center justify-center text-xl shadow-[0_0_25px_rgba(255,106,0,0.85)] border border-white/40 transform scale-90 group-hover:scale-100 hover:!scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
                    title="Play Immediately"
                    aria-label={`Play ${item.title} now`}
                  >
                    <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>

                {/* TV Series Season & Episode Tag */}
                {item.type === "tv" && item.season && item.episode ? (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-black tracking-wider text-white uppercase border border-white/10 z-10">
                    S{item.season} • E{item.episode}
                  </div>
                ) : (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-accent/90 backdrop-blur-md rounded-lg text-[9px] font-black tracking-widest text-white uppercase shadow-md z-10">
                    Resume
                  </div>
                )}

                {/* Progress Bar & Timing Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5 bg-gradient-to-t from-black via-black/80 to-transparent z-10">
                  <div className="flex items-center justify-between text-[11px] font-bold text-white/80">
                    <span className="truncate max-w-[170px] drop-shadow-md text-white font-black uppercase text-xs">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-white/60 font-mono">
                      {formatRemainingTime(item.currentTime, item.duration)}
                    </span>
                  </div>

                  {/* Red Track Progress Bar */}
                  <div className="relative w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(3, item.progressPercentage))}%` }}
                      className="h-full bg-accent rounded-full shadow-[0_0_8px_rgba(255,106,0,0.9)]"
                    />
                  </div>
                </div>
              </Link>

              {/* Dismiss / Remove from Continue Watching Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  remove(item.id, item.type, item.season, item.episode);
                }}
                className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-black/70 hover:bg-accent text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-20 border border-white/10 hover:border-accent shadow-md"
                title="Remove from Continue Watching"
                aria-label="Remove item"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </ScrollRow>
    </section>
  );
}
