import { NextRequest, NextResponse } from "next/server";
import {
  getTrendingMovies,
  getPopularTVSeries,
  getByGenre,
  getByLanguage,
  enrichWithPlatform,
  GENRE_IDS,
  LANGUAGE_CODES,
} from "@/lib/tmdb";

export const dynamic = "force-dynamic";

const resolveLanguageCode = (val: string): string => {
  const normalized = val.toLowerCase();
  for (const [name, info] of Object.entries(LANGUAGE_CODES)) {
    if (name.toLowerCase() === normalized || info.code.toLowerCase() === normalized) {
      return info.code;
    }
  }
  return val;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "trending";
    const subType = searchParams.get("subType") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    let results: any[] = [];

    if (type === "trending") {
      results = await getTrendingMovies(page);
    } else if (type === "tv") {
      results = await getPopularTVSeries(page);
    } else if (type === "genre" && subType) {
      const genreId = GENRE_IDS[subType as keyof typeof GENRE_IDS];
      if (genreId) {
        results = await getByGenre(genreId, page);
      }
    } else if ((type === "language" || type === "lang") && subType) {
      const langCode = resolveLanguageCode(subType);
      results = await getByLanguage(langCode, page);
    }

    if (results && results.length > 0) {
      results = await enrichWithPlatform(results, type === "tv" ? "tv" : "movie");
    }

    return NextResponse.json({
      success: true,
      page,
      results: results || [],
      hasMore: (results?.length || 0) > 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch explore content",
        results: [],
        hasMore: false,
      },
      { status: 500 }
    );
  }
}
