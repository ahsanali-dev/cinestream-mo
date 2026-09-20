import { NextRequest, NextResponse } from "next/server";
import { getMovieDetails, extractMediaSource } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = (searchParams.get("type") || "movie") as "movie" | "tv";

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing id parameter" },
      { status: 400 }
    );
  }

  try {
    const movie = await getMovieDetails(id, type);
    if (!movie) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    const title = movie.title || movie.name;
    const releaseDate = movie.release_date || movie.first_air_date;
    const releaseYear = releaseDate ? releaseDate.split("-")[0] : "2024";
    const rawRuntime = movie.runtime || (movie.episode_run_time && movie.episode_run_time[0]) || 108;

    const inCert = movie.release_dates?.results?.find((r: any) => r.iso_3166_1 === "IN")?.release_dates?.[0]?.certification;
    const usCert = movie.release_dates?.results?.find((r: any) => r.iso_3166_1 === "US")?.release_dates?.find((x: any) => x.certification)?.certification;
    const tvCert = movie.content_ratings?.results?.find((r: any) => r.iso_3166_1 === "IN" || r.iso_3166_1 === "US")?.rating;
    const certification = inCert || usCert || tvCert || (type === "tv" ? "TV-14" : "U/A 13+");

    const advisoryMap: Record<string, string> = {
      "R": "violence, mature themes, coarse language",
      "A": "violence, mature themes, strong language",
      "U/A 16+": "violence, threat, mature themes, coarse language",
      "U/A 13+": "violence, threat, mature themes, tobacco use",
      "PG-13": "violence, threat, mature themes, tobacco use",
      "TV-MA": "violence, coarse language, mature themes",
      "TV-14": "violence, threat, mature themes",
      "PG": "mild themes, brief action",
      "U": "suitable for general audiences",
    };
    const contentAdvisory = advisoryMap[certification] || "violence, threat, mature themes, tobacco use";

    const cast = movie.credits?.cast?.slice(0, 10).map((c: any) => ({
      name: c.name,
      character: c.character,
      profile_path: c.profile_path,
    })) || [];

    const director = movie.credits?.crew?.find((c: any) => c.job === "Director")?.name || (type === "tv" ? movie.created_by?.[0]?.name : undefined);

    const recommendations = (movie.recommendations?.results || []).slice(0, 8).map((r: any) => ({
      id: r.id,
      title: r.title || r.name,
      name: r.name || r.title,
      poster_path: r.poster_path,
      backdrop_path: r.backdrop_path,
      vote_average: r.vote_average,
      release_date: r.release_date || r.first_air_date,
      media_type: r.media_type || type,
    }));

    const trailer = movie.videos?.results?.find(
      (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
    ) || movie.videos?.results?.find((v: any) => v.site === "YouTube");
    const trailerKey = trailer?.key || null;

    return NextResponse.json({
      success: true,
      data: {
        id: movie.id,
        title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        vote_average: movie.vote_average,
        release_date: releaseDate,
        releaseYear,
        runtime: rawRuntime,
        certification,
        contentAdvisory,
        genres: movie.genres || [],
        cast,
        director,
        seasons: movie.seasons || [],
        spoken_languages: movie.spoken_languages || [],
        original_language: movie.original_language,
        recommendations,
        type,
        trailerKey,
        source: extractMediaSource(movie),
      },
    });
  } catch (error: any) {
    console.error("API details error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch details" },
      { status: 500 }
    );
  }
}
