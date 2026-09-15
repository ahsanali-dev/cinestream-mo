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


export const getMovieDetails = async (id: string, type: "movie" | "tv") => {
  return await fetchTMDB(`/${type}/${id}`, "append_to_response=videos,credits,recommendations,keywords,release_dates,content_ratings");
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


