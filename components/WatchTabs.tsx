"use client";

import React, { useState } from "react";
import Link from "next/link";
import MovieCard from "@/components/MovieCard";

interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
}

interface Genre {
  id: number;
  name: string;
}

interface WatchTabsProps {
  overview?: string;
  genres?: Genre[];
  cast?: CastMember[];
  director?: string;
  originalLanguage?: string;
  releaseDate?: string;
  runtime?: number;
  status?: string;
  recommendations: any[];
  type: "movie" | "tv";
  title: string;
}

export default function WatchTabs({
  overview,
  genres = [],
  cast = [],
  director,
  originalLanguage,
  releaseDate,
  runtime,
  status,
  recommendations = [],
  type,
  title,
}: WatchTabsProps) {
  // Tab 1: "recommended" (Default Active as requested)
  // Tab 2: "details"
  const [activeTab, setActiveTab] = useState<"recommended" | "details">("recommended");

  return (
    <div className="space-y-6">
      {/* Clean Underline Tab Navigation Bar (No icons, pure elegant text) */}
      <div className="flex items-center gap-8 sm:gap-10 border-b border-white/10 mb-6">
        {/* Tab 1: Recommended */}
        <button
          type="button"
          onClick={() => setActiveTab("recommended")}
          className={`relative pb-3.5 text-xs sm:text-sm font-black italic uppercase tracking-wider transition-all cursor-pointer select-none border-b-2 -mb-[2px] ${
            activeTab === "recommended"
              ? "border-accent text-white"
              : "border-transparent text-white/40 hover:text-white/80"
          }`}
        >
          Recommended
        </button>

        {/* Tab 2: Details */}
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`relative pb-3.5 text-xs sm:text-sm font-black italic uppercase tracking-wider transition-all cursor-pointer select-none border-b-2 -mb-[2px] ${
            activeTab === "details"
              ? "border-accent text-white"
              : "border-transparent text-white/40 hover:text-white/80"
          }`}
        >
          Details &amp; Cast
        </button>
      </div>

      {/* Tab 1 Content: Recommended */}
      {activeTab === "recommended" && (
        <div className="space-y-6 animate-fadeIn">
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

          {recommendations.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 md:gap-6">
              {recommendations.slice(0, 18).map((item: any) => (
                <MovieCard key={item.id} {...item} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-4 max-w-xl mx-auto my-8">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-accent/20 flex items-center justify-center text-3xl text-accent">
                <i className="ph-bold ph-film-strip"></i>
              </div>
              <h3 className="text-lg font-black italic uppercase text-white">No Direct Recommendations</h3>
              <p className="text-xs md:text-sm text-white/50">
                Explore thousands of popular {type === "movie" ? "movies" : "TV series"} in our curated catalog.
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-black italic uppercase text-xs rounded-xl hover:scale-105 transition-all shadow-lg"
              >
                <span>Browse Catalog</span>
                <i className="ph-bold ph-arrow-right"></i>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab 2 Content: Details & Cast */}
      {activeTab === "details" && (
        <div className="flex flex-col lg:flex-row gap-12 animate-fadeIn pt-2">
          {/* Main Info Column */}
          <div className="flex-1 space-y-8">
            {/* Storyline / Overview */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 bg-accent rounded-full"></div>
                <h3 className="text-base md:text-lg font-black italic uppercase tracking-widest text-white">
                  Storyline &amp; Overview
                </h3>
              </div>
              <p className="text-base md:text-lg text-[#a0a0a0] leading-relaxed max-w-4xl font-medium antialiased">
                {overview || "No detailed synopsis available."}
              </p>
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 bg-accent rounded-full"></div>
                  <h3 className="text-base md:text-lg font-black italic uppercase tracking-widest text-white">
                    Genres
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {genres.map((genre) => (
                    <Link
                      key={genre.id}
                      href={`/explore/genre/${encodeURIComponent(genre.name)}`}
                      className="px-5 py-2.5 bg-white/5 hover:bg-accent/20 hover:border-accent/40 border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Extra Metadata Grid */}
            <div className="pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {director && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    {type === "tv" ? "Creator / Director" : "Director"}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-white truncate">{director}</p>
                </div>
              )}
              {releaseDate && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    Release Date
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-white">{releaseDate}</p>
                </div>
              )}
              {originalLanguage && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    Original Language
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-white uppercase">{originalLanguage}</p>
                </div>
              )}
              {status && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    Status
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-white">{status}</p>
                </div>
              )}
            </div>
          </div>

          {/* Cast Column */}
          <div className="lg:w-96 space-y-8">
            {cast.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 bg-accent rounded-full"></div>
                  <h3 className="text-base md:text-lg font-black italic uppercase tracking-widest text-white">
                    Top Cast
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-3.5">
                  {cast.slice(0, 5).map((person) => (
                    <Link
                      key={person.id}
                      href={`/explore?search=${encodeURIComponent(person.name)}`}
                      className="flex items-center gap-4 group hover:bg-white/5 p-2.5 rounded-2xl transition-all border border-transparent hover:border-white/5"
                    >
                      <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-white/5 group-hover:border-accent/40 transition-all shrink-0">
                        <img
                          src={
                            person.profile_path
                              ? `https://image.tmdb.org/t/p/w200${person.profile_path}`
                              : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"
                          }
                          alt={person.name}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="truncate">
                        <p className="font-black italic uppercase text-sm tracking-tight group-hover:text-accent transition-colors truncate">
                          {person.name}
                        </p>
                        <p className="text-xs text-[#a0a0a0] font-bold truncate">
                          {person.character || "Cast"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Discover More Card */}
            <div className="pt-4 border-t border-white/5">
              <Link
                href="/explore"
                className="flex items-center justify-between p-6 bg-gradient-to-br from-accent/20 to-transparent border border-accent/20 rounded-[32px] group hover:scale-[1.02] transition-all"
              >
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                    Discover More
                  </p>
                  <h4 className="text-xl font-black italic uppercase leading-none">
                    Explore Similar
                  </h4>
                </div>
                <div className="h-12 w-12 bg-accent rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
                  <i className="ph-bold ph-magnifying-glass"></i>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
