import { MetadataRoute } from "next";
import { getTrendingMovies, getPopularTVSeries } from "@/lib/tmdb";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://cinestream-mo.vercel.app";

  // Static routes
  const staticRoutes = [
    "",
    "/explore",
    "/movies",
    "/tv-shows",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Dynamic movie routes from trending movies
  let movieRoutes: any[] = [];
  try {
    const movies = await getTrendingMovies();
    movieRoutes = (movies || []).map((movie: any) => ({
      url: `${baseUrl}/watch/${movie.id}?type=movie`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Error generating movie sitemap:", error);
  }

  // Dynamic tv routes from popular tv series
  let tvRoutes: any[] = [];
  try {
    const tvShows = await getPopularTVSeries();
    tvRoutes = (tvShows || []).map((show: any) => ({
      url: `${baseUrl}/watch/${show.id}?type=tv`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Error generating tv sitemap:", error);
  }

  return [...staticRoutes, ...movieRoutes, ...tvRoutes];
}
