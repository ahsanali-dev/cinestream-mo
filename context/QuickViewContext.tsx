"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface QuickViewItem {
  id: string | number;
  title?: string;
  name?: string;
  type?: "movie" | "tv";
  media_type?: "movie" | "tv";
  poster_path?: string;
  backdrop_path?: string;
  image?: string;
  overview?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  year?: string | number;
}

interface QuickViewContextType {
  isOpen: boolean;
  activeItem: QuickViewItem | null;
  openQuickView: (item: QuickViewItem) => void;
  closeQuickView: () => void;
  dismissModal: () => void;
}

const QuickViewContext = createContext<QuickViewContextType | undefined>(undefined);

export function QuickViewProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<QuickViewItem | null>(null);
  const [prevUrl, setPrevUrl] = useState<string>("");

  const openQuickView = useCallback((item: QuickViewItem) => {
    setActiveItem(item);
    setIsOpen(true);
    if (typeof window !== "undefined") {
      setPrevUrl(window.location.pathname + window.location.search);

      const title = item.title || item.name || "title";
      const cleanSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const type = item.type || item.media_type || (item.name || item.first_air_date ? "tv" : "movie");

      // Silently update address bar to clean slug (NO NUMERIC ID!)
      const newUrl = `/watch/${cleanSlug}?type=${type}`;
      window.history.pushState({ quickViewModal: true, prev: window.location.pathname }, "", newUrl);
    }
  }, []);

  // Closes modal and reverts URL back via history.back()
  const closeQuickView = useCallback(() => {
    setIsOpen(false);
    setActiveItem(null);

    if (typeof window !== "undefined") {
      if (window.history.state?.quickViewModal) {
        window.history.back();
      } else if (prevUrl) {
        window.history.pushState(null, "", prevUrl);
      }
    }
  }, [prevUrl]);

  // Closes modal WITHOUT triggering history.back() - used when navigating forward to watch page
  const dismissModal = useCallback(() => {
    setIsOpen(false);
    setActiveItem(null);
  }, []);

  // Handle browser Back button to dismiss modal naturally
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isOpen && !e.state?.quickViewModal) {
        setIsOpen(false);
        setActiveItem(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <QuickViewContext.Provider value={{ isOpen, activeItem, openQuickView, closeQuickView, dismissModal }}>
      {children}
    </QuickViewContext.Provider>
  );
}

export function useQuickView() {
  const ctx = useContext(QuickViewContext);
  if (!ctx) {
    throw new Error("useQuickView must be used within QuickViewProvider");
  }
  return ctx;
}
