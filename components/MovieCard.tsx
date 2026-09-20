"use client";
import React from 'react';
import Link from 'next/link';
import { useWatchlist } from '@/lib/watchlist';
import { useQuickView } from '@/context/QuickViewContext';
import { getSourceBadgeStyle, MediaSource } from '@/lib/tmdb';

interface MovieCardProps {
  id: string | number;
  title?: string;
  name?: string; // TMDB uses name for TV shows
  poster_path?: string;
  image?: string;
  vote_average?: number;
  rating?: string | number;
  release_date?: string;
  first_air_date?: string;
  year?: string | number;
  media_type?: 'movie' | 'tv';
  overview?: string;
  source?: MediaSource | { name: string; logo?: string | null } | string | null;
  network?: string;
  provider?: string;
}

const MovieCard = (props: MovieCardProps) => {
  const { id, title, name, poster_path, image, vote_average, rating, release_date, first_air_date, year, media_type, overview, source, network, provider } = props;
  const { isSaved, toggle } = useWatchlist();
  const { openQuickView } = useQuickView();
  
  const displayTitle = title || name || "Unknown Title";
  const displayImage = poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : (image || "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2000");
  const displayRating = vote_average ? vote_average.toFixed(1) : (rating || "N/A");
  const displayYear = release_date ? release_date.split('-')[0] : (first_air_date ? first_air_date.split('-')[0] : (year || "N/A"));

  const type = media_type || (name || first_air_date ? 'tv' : 'movie');
  const inWatchlist = isSaved(id);

  // Extract source name and styling
  const sourceName = typeof source === "string" ? source : (source?.name || network || provider || null);
  const sourceStyle = sourceName ? getSourceBadgeStyle(sourceName) : null;

  const cleanSlug = displayTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const watchUrl = `/watch/${cleanSlug}?type=${type}`;

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle({
      id,
      title: displayTitle,
      name: displayTitle,
      poster_path,
      image: displayImage,
      vote_average,
      release_date,
      first_air_date,
      year: displayYear,
      media_type: type,
      overview,
    });
  };

  return (
    <Link 
      href={watchUrl}
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
          e.preventDefault();
          openQuickView({
            id,
            title: displayTitle,
            name: displayTitle,
            poster_path,
            image: displayImage,
            vote_average,
            release_date,
            first_air_date,
            year: displayYear,
            media_type: type,
            overview,
          });
        }
      }}
      className="group block cursor-pointer"
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-500 ease-out group-hover:-translate-y-3 group-hover:scale-[1.03] group-hover:border-accent/40 group-hover:shadow-[0_20px_40px_rgba(231,76,60,0.2)]">
        <img 
          src={displayImage} 
          alt={displayTitle}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Streaming Source / Network Badge at Top Left */}
        {sourceStyle && (
          <div
            className={`absolute left-2 top-2 z-10 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all duration-300 group-hover:scale-105 select-none ${sourceStyle.bg} ${sourceStyle.border} ${sourceStyle.text} ${sourceStyle.glow}`}
          >
            {sourceStyle.isNetflix ? (
              <span className="text-[10px] font-black tracking-tighter">N</span>
            ) : null}
            <span className="truncate max-w-[70px]">{sourceStyle.badgeText}</span>
          </div>
        )}

        {/* Watchlist Quick Button (repositioned neatly below badge when badge is present) */}
        <button
          onClick={handleWatchlistClick}
          aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          className={`absolute ${sourceStyle ? "left-2 top-8" : "left-2 top-2"} z-20 flex h-7 w-7 items-center justify-center rounded-lg backdrop-blur-md border transition-all duration-300 ${
            inWatchlist
              ? "bg-accent border-accent text-white shadow-lg shadow-accent/40 scale-100 opacity-100"
              : "bg-black/60 border-white/10 text-white/70 hover:text-white hover:bg-black/90 hover:scale-110 opacity-0 group-hover:opacity-100"
          }`}
        >
          <i className={`${inWatchlist ? "ph-fill ph-heart text-white text-sm" : "ph-bold ph-heart text-xs"}`}></i>
        </button>
        
        {/* Hover Overlay */}
        <div className="hidden md:flex absolute inset-0 flex-col justify-end bg-gradient-to-t from-black via-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
           <div className="flex items-center gap-2 mb-2">
              <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-black uppercase text-white">4K UHD</span>
              <span className="text-[10px] font-bold text-white/60">{displayYear}</span>
           </div>
           <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2 text-xs font-black text-black shadow-lg">
              <i className="ph-fill ph-play"></i> PLAY NOW
           </div>
        </div>

        {/* Rating Badge */}
        <div className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-black text-yellow-500 backdrop-blur-md border border-white/10">
           <i className="ph-fill ph-star"></i> {displayRating}
        </div>
      </div>
      <h3 className="mt-4 text-sm font-bold text-white transition-colors group-hover:text-accent truncate">{displayTitle}</h3>
      <p className="text-[10px] font-medium uppercase tracking-tighter text-[#a0a0a0] mt-1">{displayYear} • {props.vote_average ? "Trending" : "Movie"}</p>
    </Link>
  );
};

export default MovieCard;

