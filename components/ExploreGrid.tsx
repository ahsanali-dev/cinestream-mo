"use client";

import React, { useState } from "react";
import MovieCard from "@/components/MovieCard";

interface ExploreGridProps {
  initialMovies: any[];
  type: string;
  subType?: string;
}

export default function ExploreGrid({
  initialMovies,
  type,
  subType,
}: ExploreGridProps) {
  const [movies, setMovies] = useState<any[]>(initialMovies || []);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState((initialMovies?.length || 0) >= 10);

  const handleLoadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/explore?type=${encodeURIComponent(type)}&subType=${encodeURIComponent(
          subType || ""
        )}&page=${nextPage}`
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.results) && data.results.length > 0) {
        setMovies((prev) => {
          const existingIds = new Set(prev.map((m) => String(m.id)));
          const uniqueNew = data.results.filter(
            (m: any) => !existingIds.has(String(m.id))
          );
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
        setHasMore(data.results.length >= 10);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more titles:", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  if (!movies || movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <i className="ph-fill ph-monitor-play text-8xl text-white/5 mb-6"></i>
        <p className="text-xl font-bold text-[#a0a0a0]">No content found for this category</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Grid of Movies / Shows */}
      <div className="grid grid-cols-2 gap-6 sm:gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
        {movies.map((movie: any) => (
          <div key={`${movie.id}-${movie.title || movie.name}`} className="animate-fade-in">
            <MovieCard {...movie} />
          </div>
        ))}
      </div>

      {/* View More / Load More Section */}
      <div className="flex flex-col items-center justify-center pt-6 pb-12">
        {hasMore ? (
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loading}
              className="group relative px-8 py-3.5 sm:px-10 sm:py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-accent/60 text-white font-black uppercase text-xs sm:text-sm tracking-wider flex items-center gap-3 shadow-2xl hover:shadow-accent/20 transition-all cursor-pointer transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none backdrop-blur-xl"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  <span className="text-white/80">Loading More Titles...</span>
                </>
              ) : (
                <>
                  <span>View More</span>
                  <svg
                    className="w-4 h-4 text-white/70 group-hover:text-accent group-hover:translate-y-0.5 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>

            <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">
              Showing {movies.length} titles
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-white/30 text-xs font-bold uppercase tracking-wider py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-white/30"></span>
            <span>You have reached the end • {movies.length} titles loaded</span>
            <span className="h-1.5 w-1.5 rounded-full bg-white/30"></span>
          </div>
        )}
      </div>
    </div>
  );
}
