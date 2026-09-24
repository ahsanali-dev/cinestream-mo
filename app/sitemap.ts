import { MetadataRoute } from "next";
import { getTrendingMovies, getPopularTVSeries, GENRE_IDS, LANGUAGE_CODES } from "@/lib/tmdb";

export const revalidate = 86400; // Cache sitemap for 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://movieszonestream.vercel.app";

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/app",
    "/explore",
    "/movies",
    "/tv-shows",
    "/watchlist",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : route === "/app" ? 0.95 : 0.9,
  }));

  // Genre landing pages
  const genreRoutes: MetadataRoute.Sitemap = Object.keys(GENRE_IDS).map((genre) => ({
    url: `${baseUrl}/explore/genre/${encodeURIComponent(genre)}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Regional cinema landing pages
  const regionalRoutes: MetadataRoute.Sitemap = Object.entries(LANGUAGE_CODES).map(([region, info]) => ({
    url: `${baseUrl}/explore/language/${encodeURIComponent(info.code)}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Dynamic movie routes from trending movies (Pages 1 to 5)
  let movieRoutes: MetadataRoute.Sitemap = [];
  try {
    const moviePages = await Promise.allSettled([
      getTrendingMovies(1),
      getTrendingMovies(2),
      getTrendingMovies(3),
      getTrendingMovies(4),
      getTrendingMovies(5),
    ]);

    const movies: any[] = [];
    for (const p of moviePages) {
      if (p.status === "fulfilled" && Array.isArray(p.value)) {
        movies.push(...p.value);
      }
    }

    const seenMovieIds = new Set<string>();
    for (const movie of movies) {
      if (!movie || !movie.id || seenMovieIds.has(movie.id.toString())) continue;
      seenMovieIds.add(movie.id.toString());

      const cleanSlug = (movie.title || movie.name || "movie")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      movieRoutes.push({
        url: `${baseUrl}/watch/${movie.id}-${cleanSlug}?type=movie`,
        lastModified: movie.release_date ? new Date(movie.release_date) : new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error("Error generating movie sitemap:", error);
  }

  // Dynamic TV routes from popular TV shows (Pages 1 to 5)
  let tvRoutes: MetadataRoute.Sitemap = [];
  try {
    const tvPages = await Promise.allSettled([
      getPopularTVSeries(1),
      getPopularTVSeries(2),
      getPopularTVSeries(3),
      getPopularTVSeries(4),
      getPopularTVSeries(5),
    ]);

    const tvShows: any[] = [];
    for (const p of tvPages) {
      if (p.status === "fulfilled" && Array.isArray(p.value)) {
        tvShows.push(...p.value);
      }
    }

    const seenTvIds = new Set<string>();
    for (const show of tvShows) {
      if (!show || !show.id || seenTvIds.has(show.id.toString())) continue;
      seenTvIds.add(show.id.toString());

      const cleanSlug = (show.name || show.title || "show")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      tvRoutes.push({
        url: `${baseUrl}/watch/${show.id}-${cleanSlug}?type=tv`,
        lastModified: show.first_air_date ? new Date(show.first_air_date) : new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error("Error generating TV sitemap:", error);
  }

  return [...staticRoutes, ...genreRoutes, ...regionalRoutes, ...movieRoutes, ...tvRoutes];
}
