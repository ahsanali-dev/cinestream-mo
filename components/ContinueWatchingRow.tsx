"use client";

import React from "react";
import Link from "next/link";
import { useWatchHistory, WatchHistoryItem } from "@/lib/watch-history";
import ScrollRow from "./ScrollRow";

export default function ContinueWatchingRow() {
  const { history, remove, clear, mounted } = useWatchHistory();

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
            className="text-[11px] font-bold text-white/40 hover:text-red-400 transition-colors uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
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
          const watchLink = `/watch/${item.id}-${cleanSlug}?type=${item.type}${
            item.season ? `&s=${item.season}&e=${item.episode}` : ""
          }&t=${resumeTime}`;

          return (
            <div
              key={`cw-${item.id}-${item.type}-${item.season || 0}-${item.episode || 0}`}
              className="w-64 sm:w-72 md:w-80 shrink-0 group relative rounded-2xl overflow-hidden bg-[#121216] border border-white/10 hover:border-red-600/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02]"
            >
              <Link href={watchLink} className="block relative aspect-video w-full overflow-hidden bg-black/60">
                {/* Backdrop Thumbnail */}
                <img
                  src={imageSrc}
                  alt={item.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out opacity-80 group-hover:opacity-100"
                  loading="lazy"
                />

                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>

                {/* Hover Play / Resume Button Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="h-12 w-12 rounded-full bg-red-600 text-white flex items-center justify-center text-xl shadow-[0_0_25px_rgba(229,9,20,0.8)] transform scale-90 group-hover:scale-100 transition-transform duration-300">
                    <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                {/* TV Series Season & Episode Tag */}
                {item.type === "tv" && item.season && item.episode ? (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-black tracking-wider text-white uppercase border border-white/10">
                    S{item.season} • E{item.episode}
                  </div>
                ) : (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-red-600/90 backdrop-blur-md rounded-lg text-[9px] font-black tracking-widest text-white uppercase shadow-md">
                    Resume
                  </div>
                )}

                {/* Progress Bar & Timing Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5 bg-gradient-to-t from-black via-black/80 to-transparent">
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
                      className="h-full bg-red-600 rounded-full shadow-[0_0_8px_rgba(229,9,20,0.9)]"
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
                className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-black/70 hover:bg-red-600 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-10 border border-white/10 hover:border-red-500 shadow-md"
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
