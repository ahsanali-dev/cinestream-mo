"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { searchMovies } from "@/lib/tmdb";
import { useInstallModal } from "@/context/InstallModalContext";

interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  media_type: "movie" | "tv";
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TMDBItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { isInstalled, openInstallModal } = useInstallModal();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Handle transparent to dark scrolling layout
  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleInstallClick = () => {
    openInstallModal("android");
  };

  // Handle clearing suggestions inside input handler to prevent synchronous setState inside useEffect
  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      setShowSuggestions(false);
    }
  };

  // Sync suggestion fetching with debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }

    setShowSuggestions(true);
    const delayDebounceFn = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const results = await searchMovies(query.trim());
        const filtered = (results || []).filter(
          (item: TMDBItem) => item.media_type === "movie" || item.media_type === "tv"
        );
        setSuggestions(filtered.slice(0, 5));
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Reset active keypress index when suggestion list changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions, query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleIconClick = () => {
    setIsExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleBlur = () => {
    // Keep it expanded if there is text in the input
    if (!query) {
      setIsExpanded(false);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setIsExpanded(false);
      setShowSuggestions(false);
    }
  };

  // Keyboard navigation for suggestion dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        const selectedItem = suggestions[activeIndex];
        router.push(`/watch/${selectedItem.id}?type=${selectedItem.media_type}`);
        setShowSuggestions(false);
        setIsExpanded(false);
        setQuery("");
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const isExplorePage = pathname === "/explore";

  if (!mounted) {
    return (
      <header
        className="fixed top-0 left-0 md:left-20 right-0 z-50 flex h-16 md:h-20 items-center justify-between px-4 sm:px-8 md:px-16 transition-all duration-500 bg-transparent border-b border-transparent"
      >
        <Link href="/" className="md:hidden flex items-center gap-2 shrink-0 cursor-pointer transition-transform duration-300 active:scale-95 outline-none focus:outline-none select-none">
          <img src="/logo.png" alt="MoviesZone" className="w-8 h-8 object-contain" />
          <span className="text-xl sm:text-2xl font-black text-accent tracking-tighter italic">MoviesZone</span>
        </Link>
        <div className="hidden md:block" />
        <div className="flex items-center gap-2 sm:gap-4 shrink-0"></div>
      </header>
    );
  }

  return (
    <header
      className={`fixed top-0 left-0 md:left-20 right-0 z-50 flex h-16 md:h-20 items-center justify-between px-4 sm:px-8 md:px-16 transition-all duration-500 ${
        isScrolled
          ? "bg-black/60 backdrop-blur-md border-b border-white/5 shadow-lg"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Brand logo (visible only on mobile because sidebar handles desktop) */}
      <Link href="/" className="md:hidden flex items-center gap-2 shrink-0 cursor-pointer transition-transform duration-300 active:scale-95">
        <img src="/logo.png" alt="MoviesZone" className="w-8 h-8 object-contain" />
        <span className="text-xl sm:text-2xl font-black text-accent tracking-tighter italic">MoviesZone</span>
      </Link>

      {/* Spacing element to push search to the right on desktop */}
      <div className="hidden md:block" />

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Desktop Search */}
        {mounted && !isExplorePage && (
          <div ref={containerRef} className="hidden md:block relative">
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <div
                className={`relative flex items-center h-10 transition-all duration-300 rounded-full border border-white/10 ${
                  isExpanded
                    ? "w-64 bg-black/60 px-4 border-accent/40 shadow-inner"
                    : "w-10 bg-transparent border-transparent justify-center"
                }`}
              >
                <button
                  type={isExpanded ? "submit" : "button"}
                  onClick={isExpanded ? undefined : handleIconClick}
                  className={`text-xl cursor-pointer transition-colors duration-300 ${
                    isExpanded ? "text-accent" : "text-[#a0a0a0] hover:text-white"
                  }`}
                  aria-label="Search"
                >
                  <i className="ph-bold ph-magnifying-glass"></i>
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search MoviesZone..."
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
                  onClick={() => query.trim().length >= 2 && setShowSuggestions(true)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  className={`bg-transparent text-sm text-white outline-none placeholder:text-white/30 transition-all duration-300 ${
                    isExpanded
                      ? "w-full ml-2 opacity-100"
                      : "w-0 opacity-0 pointer-events-none"
                  }`}
                />
              </div>
            </form>

            {/* Suggestions Dropdown (Desktop) */}
            {showSuggestions && (suggestions.length > 0 || loadingSuggestions || query.trim().length >= 2) && (
              <div className="absolute right-0 mt-2 w-96 rounded-2xl border border-white/10 bg-[#0f0f12]/95 backdrop-blur-xl p-3 shadow-2xl z-[150] animate-fade-in">
                {loadingSuggestions && (
                  <div className="flex items-center justify-center py-6 text-white/40">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
                    <span className="ml-3 text-xs font-bold uppercase tracking-widest">Searching...</span>
                  </div>
                )}

                {!loadingSuggestions && suggestions.length > 0 && (
                  <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto no-scrollbar">
                    {suggestions.map((item, index) => {
                      const title = item.title || item.name;
                      const releaseDate = item.release_date || item.first_air_date;
                      const year = releaseDate ? releaseDate.split("-")[0] : "";
                      const rating = item.vote_average?.toFixed(1);
                      const isMovie = item.media_type === "movie";

                      return (
                        <Link
                          key={item.id}
                          href={`/watch/${item.id}?type=${item.media_type}`}
                          onClick={() => {
                            setShowSuggestions(false);
                            setIsExpanded(false);
                            setQuery("");
                          }}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={`flex items-center gap-3 p-2 rounded-xl transition-all group cursor-pointer ${
                            activeIndex === index ? "bg-white/10" : "hover:bg-white/5"
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="h-14 w-10 rounded-lg overflow-hidden border border-white/5 bg-white/5 shrink-0 group-hover:border-accent/40 transition-colors">
                            <img
                              src={
                                item.poster_path
                                  ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                                  : "https://via.placeholder.com/200x300?text=No+Cover"
                              }
                              alt={title}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black italic uppercase tracking-tight text-white truncate group-hover:text-accent transition-colors">
                              {title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                                  isMovie
                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                    : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                }`}
                              >
                                {item.media_type}
                              </span>
                              {year && <span>{year}</span>}
                              {item.vote_average && item.vote_average > 0 && (
                                <span className="flex items-center gap-0.5 text-yellow-500">
                                  <i className="ph-fill ph-star"></i> {rating}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {!loadingSuggestions && suggestions.length === 0 && query.trim().length >= 2 && (
                  <div className="py-6 text-center text-white/30 text-xs font-bold uppercase tracking-widest">
                    No match discovered
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Search Icon Button */}
        {mounted && !isExplorePage && (
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#a0a0a0] hover:text-white active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label="Search"
          >
            <i className="ph-bold ph-magnifying-glass text-base"></i>
          </button>
        )}

        {!isInstalled && (
          <div className="group relative shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-gradient-to-r from-accent/30 to-accent/10 hover:from-accent/40 hover:to-accent/20 border border-accent/30 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(255,106,0,0.15)] active:scale-95 cursor-pointer shrink-0"
              aria-label="Install MoviesZone App"
            >
              <i className="ph-bold ph-arrow-line-down text-xs text-accent"></i>
              <span className="hidden sm:inline">Install App</span>
              <span className="inline sm:hidden">Install</span>
            </button>
            
            {/* Tooltip / Suggestion on Hover */}
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/10 bg-[#0f0f12]/95 backdrop-blur-xl p-3 text-[10px] font-bold text-white/70 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none z-[250] text-center leading-relaxed">
              Install <span className="text-accent font-black">MoviesZone</span> as a mobile or desktop app for a premium, full-screen experience.
              {/* Little triangle arrow at top */}
              <div className="absolute -top-1.5 right-10 h-3 w-3 rotate-45 border-t border-l border-white/10 bg-[#0f0f12]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Search Modal */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[200] bg-[#0a0a0b] flex flex-col p-4 animate-fade-in md:hidden">
          {/* Header row in Modal */}
          <div className="flex items-center gap-3 h-16 border-b border-white/10 pb-3">
            <button
              onClick={() => {
                setIsMobileSearchOpen(false);
                setQuery("");
                setSuggestions([]);
              }}
              className="h-10 w-10 flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#a0a0a0] hover:text-white transition-colors cursor-pointer"
              aria-label="Close search"
            >
              <i className="ph-bold ph-arrow-left text-lg"></i>
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (query.trim()) {
                  router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
                  setIsMobileSearchOpen(false);
                  setQuery("");
                  setSuggestions([]);
                }
              }}
              className="flex-1 relative flex items-center h-11 bg-white/5 border border-white/10 rounded-full px-4 focus-within:border-accent/40 transition-colors"
            >
              <i className="ph-bold ph-magnifying-glass text-[#a0a0a0] text-lg mr-2"></i>
              <input
                autoFocus
                type="text"
                placeholder="Search movies, tv shows..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => handleQueryChange("")}
                  className="text-white/50 hover:text-white px-1"
                >
                  <i className="ph-bold ph-x text-sm"></i>
                </button>
              )}
            </form>
          </div>

          {/* Suggestions Area */}
          <div className="flex-1 overflow-y-auto mt-4 no-scrollbar">
            {loadingSuggestions && (
              <div className="flex items-center justify-center py-10 text-white/40">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
                <span className="ml-3 text-xs font-bold uppercase tracking-widest">Searching...</span>
              </div>
            )}

            {!loadingSuggestions && suggestions.length > 0 && (
              <div className="flex flex-col gap-2">
                {suggestions.map((item) => {
                  const title = item.title || item.name;
                  const releaseDate = item.release_date || item.first_air_date;
                  const year = releaseDate ? releaseDate.split("-")[0] : "";
                  const rating = item.vote_average?.toFixed(1);
                  const isMovie = item.media_type === "movie";

                  return (
                    <Link
                      key={item.id}
                      href={`/watch/${item.id}?type=${item.media_type}`}
                      onClick={() => {
                        setIsMobileSearchOpen(false);
                        setQuery("");
                        setSuggestions([]);
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-2xl border border-white/5 bg-white/5 active:bg-white/10 transition-all cursor-pointer"
                    >
                      {/* Thumbnail */}
                      <div className="h-16 w-11 rounded-xl overflow-hidden border border-white/5 bg-white/5 shrink-0">
                        <img
                          src={
                            item.poster_path
                              ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                              : "https://via.placeholder.com/200x300?text=No+Cover"
                          }
                          alt={title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black italic uppercase tracking-tight text-white truncate">
                          {title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                              isMovie
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            }`}
                          >
                            {item.media_type}
                          </span>
                          {year && <span>{year}</span>}
                          {item.vote_average && item.vote_average > 0 && (
                            <span className="flex items-center gap-0.5 text-yellow-500">
                              <i className="ph-fill ph-star"></i> {rating}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {!loadingSuggestions && suggestions.length === 0 && query.trim().length >= 2 && (
              <div className="py-10 text-center text-white/30 text-xs font-bold uppercase tracking-widest">
                No match discovered
              </div>
            )}

            {/* Quick links / trending placeholder or blank space when no query */}
            {!query && (
              <div className="py-20 text-center text-white/20 text-xs font-bold uppercase tracking-wider">
                Type above to search
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
