"use client";
import { useState, useEffect } from "react";

export interface WatchlistItem {
  id: string | number;
  title?: string;
  name?: string;
  poster_path?: string;
  image?: string;
  vote_average?: number;
  rating?: string | number;
  release_date?: string;
  first_air_date?: string;
  year?: string | number;
  media_type?: "movie" | "tv";
  overview?: string;
}

const STORAGE_KEY = "cinestream_watchlist";
const EVENT_KEY = "cinestream_watchlist_updated";

export const getWatchlist = (): WatchlistItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("watchlist");
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading watchlist from localStorage:", err);
    return [];
  }
};

const notifyWatchlistChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT_KEY));
  }
};

export const isInWatchlist = (id: string | number): boolean => {
  const current = getWatchlist();
  const stringId = String(id);
  return current.some((item) => String(item.id) === stringId);
};

export const addToWatchlist = (item: WatchlistItem): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const current = getWatchlist();
    const stringId = String(item.id);
    if (!current.some((m) => String(m.id) === stringId)) {
      const updated = [item, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem("watchlist", JSON.stringify(updated)); // legacy fallback
      notifyWatchlistChange();
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error saving to watchlist:", err);
    return false;
  }
};

export const removeFromWatchlist = (id: string | number): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const current = getWatchlist();
    const stringId = String(id);
    const updated = current.filter((m) => String(m.id) !== stringId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem("watchlist", JSON.stringify(updated));
    notifyWatchlistChange();
    return true;
  } catch (err) {
    console.error("Error removing from watchlist:", err);
    return false;
  }
};

export const toggleWatchlist = (item: WatchlistItem): boolean => {
  const isSaved = isInWatchlist(item.id);
  if (isSaved) {
    removeFromWatchlist(item.id);
    return false;
  } else {
    addToWatchlist(item);
    return true;
  }
};

export const clearWatchlist = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("watchlist");
    notifyWatchlistChange();
  } catch (err) {
    console.error("Error clearing watchlist:", err);
  }
};

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setWatchlist(getWatchlist());

    const handleChange = () => {
      setWatchlist(getWatchlist());
    };

    window.addEventListener(EVENT_KEY, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(EVENT_KEY, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  return {
    watchlist,
    isSaved: (id: string | number) => (mounted ? isInWatchlist(id) : false),
    toggle: (item: WatchlistItem) => toggleWatchlist(item),
    remove: (id: string | number) => removeFromWatchlist(id),
    clear: () => clearWatchlist(),
    mounted,
  };
}
