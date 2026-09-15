"use client";
import React from 'react';
import { useWatchlist, WatchlistItem } from '@/lib/watchlist';

export default function WatchlistButton({ item }: { item: WatchlistItem }) {
  const { isSaved, toggle } = useWatchlist();
  const inWatchlist = isSaved(item.id);

  return (
    <button
      onClick={() => toggle(item)}
      className={`flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-xs md:text-sm font-black uppercase tracking-wider backdrop-blur-md transition-all duration-300 cursor-pointer ${
        inWatchlist
          ? "bg-accent text-white border border-accent shadow-lg shadow-accent/30 scale-105"
          : "bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:border-white/20"
      }`}
    >
      <i className={`text-lg ${inWatchlist ? "ph-fill ph-heart text-white" : "ph-bold ph-plus text-white"}`}></i>
      <span>{inWatchlist ? "In Watchlist" : "Add to Watchlist"}</span>
    </button>
  );
}
