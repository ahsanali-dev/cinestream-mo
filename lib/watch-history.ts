"use client";

import { useState, useEffect } from "react";

export interface WatchHistoryItem {
  id: string | number;
  type: "movie" | "tv";
  title: string;
  posterPath?: string;
  backdropPath?: string;
  season?: number;
  episode?: number;
  currentTime: number; // In seconds
  duration: number; // In seconds
  progressPercentage: number; // 0 to 100
  updatedAt: number; // Timestamp
}

const STORAGE_KEY = "cinestream_watch_history";
const EVENT_KEY = "cinestream_history_updated";

export const getWatchHistory = (): WatchHistoryItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading watch history from localStorage:", err);
    return [];
  }
};

const notifyHistoryChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT_KEY));
  }
};

export const getSavedProgress = (
  id: string | number,
  type: "movie" | "tv" = "movie",
  season?: number,
  episode?: number
): WatchHistoryItem | null => {
  const history = getWatchHistory();
  const stringId = String(id);
  return (
    history.find((item) => {
      if (String(item.id) !== stringId || item.type !== type) return false;
      if (type === "tv") {
        return item.season === (season || 1) && item.episode === (episode || 1);
      }
      return true;
    }) || null
  );
};

export const saveWatchProgress = (
  item: Omit<WatchHistoryItem, "updatedAt" | "progressPercentage">
): void => {
  if (typeof window === "undefined") return;
  try {
    // Only track if user has watched more than 5 seconds and duration is valid
    if (item.currentTime < 5 || item.duration <= 0) return;

    const current = getWatchHistory();
    const stringId = String(item.id);
    const progressPercentage = Math.min(
      100,
      Math.max(0, Math.round((item.currentTime / item.duration) * 100))
    );

    // If user finished more than 95% of the movie/episode, we mark it complete or reset
    const newEntry: WatchHistoryItem = {
      ...item,
      id: stringId,
      progressPercentage,
      updatedAt: Date.now(),
    };

    // Filter out existing entry for this specific movie/episode
    const filtered = current.filter((m) => {
      if (String(m.id) !== stringId || m.type !== item.type) return true;
      if (item.type === "tv") {
        return !(m.season === (item.season || 1) && m.episode === (item.episode || 1));
      }
      return false;
    });

    // Add to top of list (max 40 items)
    const updated = [newEntry, ...filtered].slice(0, 40);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyHistoryChange();
  } catch (err) {
    console.error("Error saving watch progress:", err);
  }
};

export const removeWatchHistory = (
  id: string | number,
  type: "movie" | "tv" = "movie",
  season?: number,
  episode?: number
): void => {
  if (typeof window === "undefined") return;
  try {
    const current = getWatchHistory();
    const stringId = String(id);
    const updated = current.filter((m) => {
      if (String(m.id) !== stringId || m.type !== type) return true;
      if (type === "tv" && season && episode) {
        return !(m.season === season && m.episode === episode);
      }
      return false;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyHistoryChange();
  } catch (err) {
    console.error("Error removing watch history:", err);
  }
};

export const clearWatchHistory = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    notifyHistoryChange();
  } catch (err) {
    console.error("Error clearing watch history:", err);
  }
};

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHistory(getWatchHistory());

    const handleChange = () => {
      setHistory(getWatchHistory());
    };

    window.addEventListener(EVENT_KEY, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(EVENT_KEY, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  return {
    history,
    remove: (id: string | number, type: "movie" | "tv" = "movie", season?: number, episode?: number) =>
      removeWatchHistory(id, type, season, episode),
    clear: () => clearWatchHistory(),
    mounted,
  };
}
