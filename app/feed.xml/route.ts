import { getTrendingMovies, getPopularTVSeries } from "@/lib/tmdb";

export const revalidate = 3600; // 1 hour cache

export async function GET() {
  const baseUrl = "https://cinestream-mo.vercel.app";

  let movies: any[] = [];
  let tvShows: any[] = [];

  try {
    const [m1, m2, m3, t1, t2, t3] = await Promise.allSettled([
      getTrendingMovies(1),
      getTrendingMovies(2),
      getTrendingMovies(3),
      getPopularTVSeries(1),
      getPopularTVSeries(2),
      getPopularTVSeries(3),
    ]);

    if (m1.status === "fulfilled" && Array.isArray(m1.value)) movies.push(...m1.value);
    if (m2.status === "fulfilled" && Array.isArray(m2.value)) movies.push(...m2.value);
    if (m3.status === "fulfilled" && Array.isArray(m3.value)) movies.push(...m3.value);

    if (t1.status === "fulfilled" && Array.isArray(t1.value)) tvShows.push(...t1.value);
    if (t2.status === "fulfilled" && Array.isArray(t2.value)) tvShows.push(...t2.value);
    if (t3.status === "fulfilled" && Array.isArray(t3.value)) tvShows.push(...t3.value);
  } catch (err) {
    console.error("Error building RSS feed:", err);
  }

  const items = [
    ...movies.map((m: any) => {
      const cleanSlug = (m.title || "movie").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return {
        title: `Watch ${m.title || "Movie"} (${m.release_date ? m.release_date.split("-")[0] : "2024"}) in Hindi Dubbed & HD`,
        link: `${baseUrl}/watch/${m.id}-${cleanSlug}?type=movie`,
        description: m.overview ? m.overview.replace(/[<&>]/g, "") : "Stream in HD on CineStream with Hindi Dubbed audio.",
        pubDate: m.release_date ? new Date(m.release_date).toUTCString() : new Date().toUTCString(),
        image: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : undefined,
      };
    }),
    ...tvShows.map((t: any) => {
      const cleanSlug = (t.name || "tv-show").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return {
        title: `Watch ${t.name || "TV Series"} (${t.first_air_date ? t.first_air_date.split("-")[0] : "2024"}) Full Episodes HD`,
        link: `${baseUrl}/watch/${t.id}-${cleanSlug}?type=tv`,
        description: t.overview ? t.overview.replace(/[<&>]/g, "") : "Watch latest episodes on CineStream.",
        pubDate: t.first_air_date ? new Date(t.first_air_date).toUTCString() : new Date().toUTCString(),
        image: t.backdrop_path ? `https://image.tmdb.org/t/p/w1280${t.backdrop_path}` : undefined,
      };
    }),
  ];

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CineStream - Latest Movies &amp; TV Series in HD</title>
    <link>${baseUrl}</link>
    <description>Stream trending movies and popular TV series online in high definition with Hindi Dubbed audio and multi-language subtitles on CineStream.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items
      .map(
        (item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      ${item.image ? `<enclosure url="${item.image}" type="image/jpeg" length="0" />` : ""}
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(rssXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
