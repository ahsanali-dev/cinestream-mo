"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { searchMovies } from "@/lib/tmdb";

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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deviceOS, setDeviceOS] = useState<"ios" | "android" | "desktop">("desktop");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  // Listen for PWA installation prompt and check installed status
  useEffect(() => {
    const checkInstalledStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstalledStatus();

    // Detect OS for custom instructions
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceOS("ios");
    } else if (/android/.test(userAgent)) {
      setDeviceOS("android");
    } else {
      setDeviceOS("desktop");
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallModal(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt" as any, handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt" as any, handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA Installation Prompt Choice: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
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
        className="fixed top-0 left-0 md:left-20 right-0 z-50 flex h-20 items-center justify-between px-8 md:px-16 transition-all duration-500 bg-transparent border-b border-transparent"
      >
        <Link href="/" className="md:hidden flex items-center gap-2 cursor-pointer transition-transform duration-300 active:scale-95">
          <span className="text-2xl font-black text-accent tracking-tighter italic">CineStream</span>
        </Link>
        <div className="hidden md:block" />
        <div className="flex items-center gap-4"></div>
      </header>
    );
  }

  return (
    <header
      className={`fixed top-0 left-0 md:left-20 right-0 z-50 flex h-20 items-center justify-between px-8 md:px-16 transition-all duration-500 ${
        isScrolled
          ? "bg-black/60 backdrop-blur-md border-b border-white/5 shadow-lg"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Brand logo (visible only on mobile because sidebar handles desktop) */}
      <Link href="/" className="md:hidden flex items-center gap-2 cursor-pointer transition-transform duration-300 active:scale-95">
        <span className="text-2xl font-black text-accent tracking-tighter italic">CineStream</span>
      </Link>

      {/* Spacing element to push search to the right on desktop */}
      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
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
                  placeholder="Search CineStream..."
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
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#a0a0a0] hover:text-white active:scale-95 transition-all cursor-pointer animate-fade-in"
            aria-label="Search"
          >
            <i className="ph-bold ph-magnifying-glass text-lg"></i>
          </button>
        )}

        {!isInstalled && (
          <div className="group relative">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-accent/30 to-accent/10 hover:from-accent/40 hover:to-accent/20 border border-accent/30 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(231,76,60,0.15)] active:scale-95 cursor-pointer animate-fade-in"
              aria-label="Install CineStream App"
            >
              <i className="ph-bold ph-arrow-line-down text-xs text-accent"></i>
              <span className="hidden sm:inline">Install App</span>
              <span className="inline sm:hidden">Install</span>
            </button>
            
            {/* Tooltip / Suggestion on Hover */}
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/10 bg-[#0f0f12]/95 backdrop-blur-xl p-3 text-[10px] font-bold text-white/70 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none z-[250] text-center leading-relaxed">
              Install <span className="text-accent font-black">CineStream</span> as a mobile or desktop app for a premium, full-screen experience.
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

      {/* Install App Instruction Dialog */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          {/* Modal Card */}
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0f0f12]/95 p-6 shadow-2xl animate-scale-in text-left">
            {/* Close Button */}
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full border border-white/5 bg-white/5 text-[#a0a0a0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <i className="ph-bold ph-x"></i>
            </button>

            {/* App Branding Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent to-[#b03a2e] flex items-center justify-center shadow-lg border border-accent/40 shrink-0">
                <i className="ph-fill ph-play text-white text-2xl animate-pulse"></i>
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase tracking-wider text-white">CineStream App</h3>
                <p className="text-xs font-bold text-accent uppercase tracking-widest">Premium Streaming Experience</p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed mb-6">
              CineStream ko apney mobile ya desktop par install karein taake aapko full-screen, fast load times aur offline functions k sath premium cinema experience mil sakey.
            </p>

            {/* OS Selection Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 rounded-xl border border-white/5 mb-6">
              {(["android", "ios", "desktop"] as const).map((os) => (
                <button
                  key={os}
                  onClick={() => setDeviceOS(os)}
                  className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                    deviceOS === os
                      ? "bg-accent text-white shadow-md font-black"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {os === "ios" ? "iOS" : os === "android" ? "Android" : "Desktop"}
                </button>
              ))}
            </div>

            {/* Instructions based on OS */}
            <div className="space-y-4">
              {deviceOS === "ios" && (
                <div className="flex flex-col gap-4 text-xs text-white/80">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-accent font-black">1</div>
                    <p className="leading-normal">
                      Safari browser k nichey menu bar me <strong>Share</strong> button <i className="ph-bold ph-export text-accent ml-0.5 align-middle"></i> par tap karein.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-accent font-black">2</div>
                    <p className="leading-normal">
                      Share menu ko nichey scroll karein aur <strong>"Add to Home Screen"</strong> <i className="ph-bold ph-plus-square text-accent ml-0.5 align-middle"></i> select karein.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-accent font-black">3</div>
                    <p className="leading-normal">
                      Top-right corner me <strong>"Add"</strong> button par tap karein install mukammal karne k liye.
                    </p>
                  </div>
                </div>
              )}

              {deviceOS === "android" && (
                <div className="flex flex-col gap-4 text-xs text-white/80">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-accent font-black">1</div>
                    <p className="leading-normal">
                      Browser k top-right corner me <strong>Menu</strong> button <i className="ph-bold ph-dots-three-vertical text-accent ml-0.5 align-middle"></i> (three dots) par tap karein.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-accent font-black">2</div>
                    <p className="leading-normal">
                      List me se <strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> select karein.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-accent font-black">3</div>
                    <p className="leading-normal">
                      Screen par aane wali prompt ko confirm karein.
                    </p>
                  </div>
                </div>
              )}

              {deviceOS === "desktop" && (
                <div className="flex flex-col gap-4 text-xs text-white/80">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-accent font-black">1</div>
                    <p className="leading-normal">
                      Apney desktop browser (Chrome/Edge/Brave) k URL bar ko dekhein.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-accent font-black">2</div>
                    <p className="leading-normal">
                      URL k sath majood <strong>Install</strong> icon <i className="ph-bold ph-download-simple text-accent ml-0.5 align-middle"></i> (downward arrow) par click karein.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-accent font-black">3</div>
                    <p className="leading-normal">
                      Ya phir browser menu open karein aur <strong>"Install CineStream"</strong> select karein.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Note */}
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">PWA Technology</span>
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-4 py-2 bg-accent/20 hover:bg-accent/30 text-white border border-accent/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer font-black"
              >
                Samajh Agaya
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
