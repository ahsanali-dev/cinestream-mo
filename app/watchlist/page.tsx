"use client";
import React from 'react';
import MovieCard from '@/components/MovieCard';
import Link from 'next/link';
import { useWatchlist } from '@/lib/watchlist';

export default function WatchlistPage() {
  const { watchlist, clear, mounted } = useWatchlist();

  if (!mounted) {
    return (
      <div className="min-h-screen p-8 md:p-16 bg-[#0a0a0b] flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 md:p-16 bg-[#0a0a0b] animate-fade-in">
      <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-2 bg-accent rounded-full shadow-lg shadow-accent/50"></div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
              My Watchlist
            </h1>
            <span className="bg-accent/20 border border-accent/40 text-accent px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
              {watchlist.length} {watchlist.length === 1 ? 'Title' : 'Titles'}
            </span>
          </div>
          <p className="text-[#a0a0a0] font-medium text-sm md:text-base">
            Your personal collection of saved movies and series stored locally on your device.
          </p>
        </div>

        {watchlist.length > 0 && (
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to clear your entire watchlist?")) {
                clear();
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-accent/20 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-black uppercase tracking-widest transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <i className="ph-bold ph-trash text-sm"></i> Clear All
          </button>
        )}
      </div>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 animate-fade-in">
          {watchlist.map((movie) => (
            <div key={movie.id} className="animate-fade-in">
              <MovieCard {...movie} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center py-20">
          <div className="relative mb-8 text-[#252529]">
            <div className="h-28 w-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <i className="ph-fill ph-heart text-5xl text-white/20"></i>
            </div>
          </div>
          <h2 className="mb-3 text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
            Your Watchlist is Empty
          </h2>
          <p className="mb-8 max-w-md text-sm md:text-base text-[#a0a0a0] leading-relaxed">
            Click the <strong className="text-white">Heart icon</strong> on any movie poster or watch page to save it here for later viewing.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/explore" 
              className="rounded-xl bg-accent px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-accent/20 transition-all hover:scale-105 active:scale-95"
            >
              Explore Movies
            </Link>
            <Link 
              href="/explore/language/hi" 
              className="rounded-xl bg-white/5 border border-white/10 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/10 hover:border-white/20"
            >
              Bollywood Hits
            </Link>
            <Link 
              href="/explore/language/pa" 
              className="rounded-xl bg-white/5 border border-white/10 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/10 hover:border-white/20"
            >
              Punjabi Cinema
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

