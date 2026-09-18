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
      "append_to_response=videos,credits,recommendations,keywords,release_dates,content_ratings"
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
      "append_to_response=videos,credits,recommendations,keywords,release_dates,content_ratings"
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

export const getTVShowEpisodes = async (id: string, season: number) => {
  return await fetchTMDB(`/tv/${id}/season/${season}`);
};

export const searchMovies = async (query: string) => {
  const data = await fetchTMDB("/search/multi", `query=${encodeURIComponent(query)}`);
  return data?.results || [];
};

export const getImageUrl = (path?: string | null) => {
  return path ? `https://image.tmdb.org/t/p/original${path}` : "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2000";
};


