const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL || "https://api.themoviedb.org/3";

export const GENRE_IDS = {
  Action: 28,
  Comedy: 35,
  Horror: 27,
  Animation: 16,
  Documentary: 99,
  Romance: 10749,
  SciFi: 878,
  Thriller: 53,
  Drama: 18,
  Crime: 80,
  Adventure: 12
};

export const LANGUAGE_CODES: Record<string, { code: string; label: string }> = {
  Hindi: { code: "hi", label: "Bollywood (Hindi)" },
  Punjabi: { code: "pa", label: "Pollywood (Punjabi)" },
  Tamil: { code: "ta", label: "Kollywood (Tamil)" },
  Telugu: { code: "te", label: "Tollywood (Telugu)" },
  Korean: { code: "ko", label: "K-Drama (Korean)" },
  Japanese: { code: "ja", label: "Anime & Japanese" }
};

export const fetchTMDB = async (endpoint: string, params: string = "") => {
  if (!API_KEY || !BASE_URL) {
    return null;
  }

  try {
    const separator = endpoint.includes("?") ? "&" : "?";
    const url = `${BASE_URL}${endpoint}${separator}api_key=${API_KEY}${params ? `&${params}` : ""}`;
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const getTrendingMovies = async (page = 1) => {
  const data = await fetchTMDB("/trending/movie/day", `page=${page}`);
  return data?.results || [];
};

export const getPopularTVSeries = async (page = 1) => {
  const data = await fetchTMDB("/tv/popular", `page=${page}`);
  return data?.results || [];
};

export const getByGenre = async (genreId: number, page = 1) => {
  const data = await fetchTMDB("/discover/movie", `with_genres=${genreId}&page=${page}&sort_by=popularity.desc`);
  return data?.results || [];
};

export const getByLanguage = async (languageCode: string, page = 1, type: "movie" | "tv" = "movie") => {
  const endpoint = type === "tv" ? "/discover/tv" : "/discover/movie";
  const data = await fetchTMDB(endpoint, `with_original_language=${languageCode}&sort_by=popularity.desc&page=${page}`);
  return data?.results || [];
};

export const getHindiMovies = async (page = 1) => getByLanguage("hi", page, "movie");
export const getPunjabiMovies = async (page = 1) => getByLanguage("pa", page, "movie");
export const getTamilMovies = async (page = 1) => getByLanguage("ta", page, "movie");
export const getTeluguMovies = async (page = 1) => getByLanguage("te", page, "movie");
export const getKoreanShows = async (page = 1) => getByLanguage("ko", page, "tv");


const movieDetailsCache = new Map<string, any>();

export const getMovieDetails = async (idOrSlug: string, type: "movie" | "tv") => {
  if (!idOrSlug) return null;
  const cacheKey = `${type}_${idOrSlug.toLowerCase().trim()}`;
  if (movieDetailsCache.has(cacheKey)) {
    return movieDetailsCache.get(cacheKey);
  }

  // 1. Check if input is a numeric TMDB ID (e.g. "674" or "674-harry-potter")
  const numericPart = idOrSlug.split("-")[0];
  if (/^\d+$/.test(numericPart)) {
    const data = await fetchTMDB(
      `/${type}/${numericPart}`,
      "append_to_response=videos,credits,recommendations,keywords,release_dates,content_ratings,watch/providers"
    );
    if (data) movieDetailsCache.set(cacheKey, data);
    return data;
  }

  // 2. Pure title slug resolution (e.g. "harry-potter-and-the-goblet-of-fire")
  const cleanQuery = idOrSlug.replace(/[-_]+/g, " ").trim();
  const searchData = await fetchTMDB(
    `/search/${type}`,
    `query=${encodeURIComponent(cleanQuery)}`
  );

  const topResult = searchData?.results?.[0];
  if (topResult?.id) {
    const data = await fetchTMDB(
      `/${type}/${topResult.id}`,
      "append_to_response=videos,credits,recommendations,keywords,release_dates,content_ratings,watch/providers"
    );
    if (data) {
      movieDetailsCache.set(cacheKey, data);
      // Also cache under numeric ID
      movieDetailsCache.set(`${type}_${topResult.id}`, data);
    }
    return data;
  }

  return null;
};

export interface MediaSource {
  name: string;
  logo?: string | null;
  id?: number | string;
  type?: "network" | "provider" | "company";
}

/**
 * Extracts the authentic streaming platform, TV network, or major production studio from TMDB details.
 */
export const extractMediaSource = (data: any): MediaSource | null => {
  if (!data) return null;

  // 1. Check TV networks first (e.g. Netflix, HBO, Disney+, Apple TV+, Prime Video, AMC)
  if (data.networks && Array.isArray(data.networks) && data.networks.length > 0) {
    const majorNetworks = [
      "Netflix",
      "HBO",
      "Disney+",
      "Apple TV+",
      "Amazon",
      "Prime Video",
      "Hulu",
      "Paramount+",
      "AMC",
      "Showtime",
      "Peacock",
      "BBC",
      "CW",
    ];
    const preferred =
      data.networks.find((n: any) =>
        majorNetworks.some((m) => n.name.toLowerCase().includes(m.toLowerCase()))
      ) || data.networks[0];

    return {
      name: preferred.name,
      logo: preferred.logo_path ? `https://image.tmdb.org/t/p/w200${preferred.logo_path}` : null,
      id: preferred.id,
      type: "network",
    };
  }

  // 2. Check Watch Providers (streaming flatrate services: Netflix, Disney+, Max, etc.)
  const providers = data["watch/providers"]?.results;
  const flatrate =
    providers?.US?.flatrate ||
    providers?.IN?.flatrate ||
    providers?.GB?.flatrate ||
    providers?.CA?.flatrate;
  if (flatrate && Array.isArray(flatrate) && flatrate.length > 0) {
    const p = flatrate[0];
    return {
      name: p.provider_name,
      logo: p.logo_path ? `https://image.tmdb.org/t/p/w200${p.logo_path}` : null,
      id: p.provider_id,
      type: "provider",
    };
  }

  // 3. Check Major Production Companies / Studios
  if (data.production_companies && Array.isArray(data.production_companies) && data.production_companies.length > 0) {
    const majorCompanies = [
      "Netflix",
      "Marvel Studios",
      "Walt Disney Pictures",
      "Warner Bros",
      "Universal Pictures",
      "Paramount",
      "A24",
      "Sony Pictures",
      "Columbia Pictures",
      "20th Century Studios",
      "Lionsgate",
      "HBO",
      "Apple Studios",
      "Amazon Studios",
      "MGM",
      "DreamWorks",
      "Pixar",
    ];
    const found =
      data.production_companies.find((c: any) =>
        majorCompanies.some((m) => c.name.toLowerCase().includes(m.toLowerCase()))
      ) || data.production_companies[0];

    if (found) {
      return {
        name: found.name,
        logo: found.logo_path ? `https://image.tmdb.org/t/p/w200${found.logo_path}` : null,
        id: found.id,
        type: "company",
      };
    }
  }

  return null;
};

/**
 * Returns tailored colors, styles, and badge formatting for streaming sources.
 */
export const getSourceBadgeStyle = (sourceName?: string | null) => {
  if (!sourceName) {
    return {
      bg: "bg-black/80 backdrop-blur-md",
      border: "border-white/15",
      text: "text-white/90",
      glow: "shadow-md",
      badgeText: "ORIGINAL",
      isNetflix: false,
    };
  }

  const s = sourceName.toLowerCase();
  if (s.includes("netflix")) {
    return {
      bg: "bg-[#e50914]",
      border: "border-red-600/40",
      text: "text-white",
      glow: "shadow-[0_2px_10px_rgba(229,9,20,0.5)]",
      badgeText: "NETFLIX",
      isNetflix: true,
    };
  }
  if (s.includes("hbo") || s.includes("max")) {
    return {
      bg: "bg-[#5822b4]",
      border: "border-purple-500/40",
      text: "text-white",
      glow: "shadow-[0_2px_10px_rgba(88,34,180,0.4)]",
      badgeText: "MAX",
      isNetflix: false,
    };
  }
  if (s.includes("disney")) {
    return {
      bg: "bg-[#113ccf]",
      border: "border-blue-500/40",
      text: "text-white",
      glow: "shadow-[0_2px_10px_rgba(17,60,207,0.4)]",
      badgeText: "DISNEY+",
      isNetflix: false,
    };
  }
  if (s.includes("apple")) {
    return {
      bg: "bg-black/90",
      border: "border-white/30",
      text: "text-white",
      glow: "shadow-[0_2px_10px_rgba(255,255,255,0.2)]",
      badgeText: "APPLE TV+",
      isNetflix: false,
    };
  }
  if (s.includes("prime") || s.includes("amazon")) {
    return {
      bg: "bg-[#00a8e1]",
      border: "border-cyan-400/40",
      text: "text-black font-black",
      glow: "shadow-[0_2px_10px_rgba(0,168,225,0.4)]",
      badgeText: "PRIME",
      isNetflix: false,
    };
  }
  if (s.includes("hulu")) {
    return {
      bg: "bg-[#1ce783]",
      border: "border-emerald-400/40",
      text: "text-black font-black",
      glow: "shadow-[0_2px_10px_rgba(28,231,131,0.4)]",
      badgeText: "HULU",
      isNetflix: false,
    };
  }
  if (s.includes("paramount")) {
    return {
      bg: "bg-[#0064ff]",
      border: "border-blue-500/40",
      text: "text-white",
      glow: "shadow-[0_2px_10px_rgba(0,100,255,0.4)]",
      badgeText: "PARAMOUNT+",
      isNetflix: false,
    };
  }
  if (s.includes("marvel")) {
    return {
      bg: "bg-[#e62429]",
      border: "border-red-600/40",
      text: "text-white font-black",
      glow: "shadow-[0_2px_10px_rgba(230,36,41,0.4)]",
      badgeText: "MARVEL",
      isNetflix: false,
    };
  }
  if (s.includes("peacock")) {
    return {
      bg: "bg-[#00a3e0]",
      border: "border-cyan-400/40",
      text: "text-white font-black",
      glow: "shadow-md",
      badgeText: "PEACOCK",
      isNetflix: false,
    };
  }
  if (s.includes("warner")) {
    return {
      bg: "bg-[#002f6c]",
      border: "border-blue-400/40",
      text: "text-white font-black",
      glow: "shadow-md",
      badgeText: "WARNER BROS",
      isNetflix: false,
    };
  }
  if (s.includes("sony") || s.includes("columbia")) {
    return {
      bg: "bg-black/90",
      border: "border-white/30",
      text: "text-white font-black",
      glow: "shadow-md",
      badgeText: "SONY",
      isNetflix: false,
    };
  }
  if (s.includes("universal")) {
    return {
      bg: "bg-[#1a237e]",
      border: "border-blue-500/40",
      text: "text-white font-black",
      glow: "shadow-md",
      badgeText: "UNIVERSAL",
      isNetflix: false,
    };
  }
  if (s.includes("mubi")) {
    return {
      bg: "bg-[#00b0b9]",
      border: "border-teal-400/40",
      text: "text-black font-black",
      glow: "shadow-md",
      badgeText: "MUBI",
      isNetflix: false,
    };
  }
  if (s.includes("nbc")) {
    return {
      bg: "bg-[#1a1a2e]",
      border: "border-indigo-400/40",
      text: "text-white font-black",
      glow: "shadow-md",
      badgeText: "NBC",
      isNetflix: false,
    };
  }
  if (s.includes("cbs")) {
    return {
      bg: "bg-[#003366]",
      border: "border-blue-400/40",
      text: "text-white font-black",
      glow: "shadow-md",
      badgeText: "CBS",
      isNetflix: false,
    };
  }
  if (s.includes("bravo")) {
    return {
      bg: "bg-[#0072ce]",
      border: "border-sky-400/40",
      text: "text-white font-black",
      glow: "shadow-md",
      badgeText: "BRAVO",
      isNetflix: false,
    };
  }
  if (s.includes("tvb")) {
    return {
      bg: "bg-[#00a862]",
      border: "border-emerald-400/40",
      text: "text-white font-black",
      glow: "shadow-md",
      badgeText: "TVB JADE",
      isNetflix: false,
    };
  }
  if (s.includes("a24")) {
    return {
      bg: "bg-black/90",
      border: "border-white/40",
      text: "text-white font-black",
      glow: "shadow-md",
      badgeText: "A24",
      isNetflix: false,
    };
  }
  if (s.includes("constantin")) {
    return {
      bg: "bg-[#2b2b2b]",
      border: "border-white/30",
      text: "text-white font-black",
      glow: "shadow-md",
      badgeText: "CONSTANTIN",
      isNetflix: false,
    };
  }
  if (s.includes("rsvp")) {
    return {
      bg: "bg-[#c0392b]",
      border: "border-red-500/40",
      text: "text-white font-black",
      glow: "shadow-md",
      badgeText: "RSVP",
      isNetflix: false,
    };
  }

  // Generic studio or network fallback
  const cleanBadge = sourceName.length > 14 ? sourceName.slice(0, 14).toUpperCase() : sourceName.toUpperCase();
  return {
    bg: "bg-black/75 backdrop-blur-md",
    border: "border-white/20",
    text: "text-white/90",
    glow: "shadow-md",
    badgeText: cleanBadge,
    isNetflix: false,
  };
};

// Cached platform mapping for fast home & explore badge resolution
let cachedPlatformMap: Map<string, MediaSource> | null = null;
let lastPlatformMapFetch = 0;

export const getPlatformSourceMap = async (): Promise<Map<string, MediaSource>> => {
  const now = Date.now();
  if (cachedPlatformMap && now - lastPlatformMapFetch < 3600000) {
    return cachedPlatformMap;
  }

  const map = new Map<string, MediaSource>();

  try {
    const queries: { name: string; url: string; type: "network" | "provider" }[] = [
      { name: "Netflix", type: "network", url: "/discover/tv?with_networks=213&sort_by=popularity.desc" },
      { name: "Netflix", type: "provider", url: "/discover/movie?with_watch_providers=8&watch_region=US&sort_by=popularity.desc" },
      { name: "HBO", type: "network", url: "/discover/tv?with_networks=49|3186&sort_by=popularity.desc" },
      { name: "Max", type: "provider", url: "/discover/movie?with_watch_providers=1899|384&watch_region=US&sort_by=popularity.desc" },
      { name: "Disney+", type: "network", url: "/discover/tv?with_networks=2739&sort_by=popularity.desc" },
      { name: "Disney+", type: "provider", url: "/discover/movie?with_watch_providers=337&watch_region=US&sort_by=popularity.desc" },
      { name: "Apple TV+", type: "network", url: "/discover/tv?with_networks=2552&sort_by=popularity.desc" },
      { name: "Apple TV+", type: "provider", url: "/discover/movie?with_watch_providers=350&watch_region=US&sort_by=popularity.desc" },
      { name: "Prime Video", type: "network", url: "/discover/tv?with_networks=1024&sort_by=popularity.desc" },
      { name: "Prime Video", type: "provider", url: "/discover/movie?with_watch_providers=9|119&watch_region=US&sort_by=popularity.desc" },
      { name: "Paramount+", type: "network", url: "/discover/tv?with_networks=4330&sort_by=popularity.desc" },
      { name: "Hulu", type: "network", url: "/discover/tv?with_networks=453&sort_by=popularity.desc" },
    ];

    const results = await Promise.all(
      queries.map((q) =>
        fetchTMDB(q.url).then((d) => ({
          q,
          items: (d?.results || []) as any[],
        }))
      )
    );

    results.forEach(({ q, items }) => {
      items.forEach((item) => {
        const key = `${item.id}`;
        if (!map.has(key)) {
          map.set(key, { name: q.name, type: q.type });
        }
      });
    });

    cachedPlatformMap = map;
    lastPlatformMapFetch = now;
  } catch (err) {
    console.error("Failed to build platform source map:", err);
  }

  return map;
};

/**
 * Enriches an array of movie or TV items with their detected platform source (Network, Streaming, or Studio).
 */
export const enrichWithPlatform = async (items: any[], type?: "movie" | "tv"): Promise<any[]> => {
  if (!items || items.length === 0) return items;
  const platformMap = await getPlatformSourceMap();

  return await Promise.all(
    items.map(async (item) => {
      if (item.source) return item;
      const key = `${item.id}`;
      const match = platformMap.get(key);
      if (match) {
        return { ...item, source: match };
      }

      // If not in quick platform map, query TMDB details in parallel to resolve studio/network
      try {
        const mediaType = item.media_type || type || (item.first_air_date || item.name ? "tv" : "movie");
        const details = await fetchTMDB(`/${mediaType}/${item.id}`, "append_to_response=watch/providers");
        if (details) {
          const src = extractMediaSource(details);
          if (src) {
            platformMap.set(key, src);
            return { ...item, source: src };
          }
        }
      } catch (e) {
        // Fallback
      }

      return item;
    })
  );
};

/**
 * Fetches top popular titles from Netflix (TV Originals + Movies).
 */
export const getPopularNetflixTitles = async (page = 1) => {
  const [tvData, movieData] = await Promise.all([
    fetchTMDB("/discover/tv", `with_networks=213&sort_by=popularity.desc&page=${page}`),
    fetchTMDB("/discover/movie", `with_watch_providers=8&watch_region=US&sort_by=popularity.desc&page=${page}`),
  ]);

  const tvItems = (tvData?.results || []).map((item: any) => ({
    ...item,
    media_type: "tv",
    source: { name: "Netflix" },
  }));

  const movieItems = (movieData?.results || []).map((item: any) => ({
    ...item,
    media_type: "movie",
    source: { name: "Netflix" },
  }));

  // Interleave TV and movies
  const combined: any[] = [];
  const maxLen = Math.max(tvItems.length, movieItems.length);
  for (let i = 0; i < maxLen; i++) {
    if (tvItems[i]) combined.push(tvItems[i]);
    if (movieItems[i]) combined.push(movieItems[i]);
  }

  return combined;
};

export const getTVShowEpisodes = async (id: string, season: number) => {
  return await fetchTMDB(`/tv/${id}/season/${season}`);
};

export const searchMovies = async (query: string, page = 1) => {
  const data = await fetchTMDB("/search/multi", `query=${encodeURIComponent(query)}&page=${page}`);
  return data?.results || [];
};

export const getImageUrl = (path?: string | null) => {
  return path ? `https://image.tmdb.org/t/p/original${path}` : "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2000";
};


