import { getMovieDetails, extractMediaSource } from "@/lib/tmdb";
import Link from "next/link";
import PlayerContainer from "@/components/PlayerContainer";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; t?: string; s?: string; e?: string; play?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  try {
    const { id: rawId } = await params;
    const { type = "movie" } = await searchParams;
    
    const movie = await getMovieDetails(rawId, type as "movie" | "tv");
    
    if (!movie) {
      return {
        title: "Content Not Found | CineStream",
        description: "The requested movie or TV show could not be found.",
      };
    }

    const title = movie.title || movie.name;
    const releaseDate = movie.release_date || movie.first_air_date;
    const rawYear = releaseDate ? releaseDate.split("-")[0] : "2024";
    const year = rawYear ? ` (${rawYear})` : "";
    const description = movie.overview 
      ? `Watch ${title}${year} in 1080p Full HD with Hindi Dubbed audio and multi-language subtitles. ${movie.overview.slice(0, 130)}...`
      : `Stream ${title}${year} online in full HD with Hindi Dubbed & English audio for free on CineStream.`;

    const primaryImage = movie.backdrop_path 
      ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` 
      : movie.poster_path 
      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
      : "https://cinestream-mo.vercel.app/icon-512x512.png";

    const cleanSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const canonicalPath = `/watch/${cleanSlug}?type=${type}`;
    const watchUrl = `https://cinestream-mo.vercel.app${canonicalPath}`;
    const ogImageUrl = `https://cinestream-mo.vercel.app/api/og?title=${encodeURIComponent(title)}&year=${encodeURIComponent(rawYear)}&rating=${encodeURIComponent(movie.vote_average ? movie.vote_average.toFixed(1) : "8.5")}&type=${type}&image=${encodeURIComponent(primaryImage)}`;

    return {
      title: `Watch ${title}${year} Hindi Dubbed & English Subtitles | 1080p Full HD Free`,
      description,
      keywords: [
        `Watch ${title} online free`,
        `${title} Hindi dubbed`,
        `${title} full movie HD`,
        `${title} stream 1080p`,
        `${title} dual audio`,
        `${title} English subtitles`,
        "CineStream free streaming",
        "Watch movies online",
      ],
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        title: `Watch ${title}${year} Hindi Dubbed & English | CineStream`,
        description,
        url: watchUrl,
        siteName: "CineStream",
        locale: "en_US",
        type: type === "movie" ? "video.movie" : "video.tv_show",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `Watch ${title} on CineStream`,
            type: "image/png",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `Watch ${title}${year} Hindi Dubbed & English | CineStream`,
        description,
        images: [ogImageUrl],
        creator: "@cinestream",
      },
    };
  } catch (error) {
    return {
      title: "Watch Movies & TV Shows in HD | CineStream",
      description: "Stream movies and TV series online in high definition with Hindi Dubbed audio on CineStream.",
    };
  }
}

export default async function WatchPage({ params, searchParams }: PageProps) {
  const { id: rawId } = await params;
  const { type = "movie", t, s, e, play } = await searchParams;
  const initialTime = t ? parseFloat(t) : undefined;
  const initialSeason = s ? parseInt(s, 10) : undefined;
  const initialEpisode = e ? parseInt(e, 10) : undefined;
  const autoPlay = play === "1";
  
  const movie = await getMovieDetails(rawId, type as "movie" | "tv");

  if (!movie) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-20 text-center">
        <div className="h-24 w-24 rounded-full bg-accent/20 flex items-center justify-center text-4xl text-accent mb-6 animate-pulse">
            <i className="ph-fill ph-warning"></i>
        </div>
        <h1 className="text-3xl font-black italic uppercase mb-4">Content Not Found</h1>
        <p className="text-[#a0a0a0] mb-8 max-w-md">The requested title could not be loaded. This might be due to a technical issue or the content being unavailable.</p>
        <Link href="/" className="px-10 py-4 bg-white text-black font-black italic uppercase rounded-2xl hover:scale-105 transition-all">
            Return to Home
        </Link>
      </div>
    );
  }

  const id = String(movie.id);



  const title = movie.title || movie.name;
  const releaseDate = movie.release_date || movie.first_air_date;
  const year = releaseDate ? releaseDate.split("-")[0] : "N/A";
  const rating = movie.vote_average?.toFixed(1);
  const cleanSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const canonicalUrl = `https://cinestream-mo.vercel.app/watch/${cleanSlug}?type=${type}`;

  // Schema.org JSON-LD Structured Data for Google Rich Snippets
  const mediaSchema = {
    "@context": "https://schema.org",
    "@type": type === "movie" ? "Movie" : "TVSeries",
    "name": title,
    "description": movie.overview,
    "image": [
      movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
      movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : null,
    ].filter(Boolean),
    "datePublished": releaseDate,
    "inLanguage": "en",
    "genre": movie.genres?.map((g: any) => g.name) || [],
    ...(movie.vote_count ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": movie.vote_average?.toFixed(1),
        "bestRating": "10",
        "worstRating": "1",
        "ratingCount": movie.vote_count,
      }
    } : {}),
    "actor": movie.credits?.cast?.slice(0, 5).map((c: any) => ({
      "@type": "Person",
      "name": c.name,
    })) || [],
    "director": movie.credits?.crew?.filter((c: any) => c.job === "Director").map((c: any) => ({
      "@type": "Person",
      "name": c.name,
    })) || [],
  };

  // VideoObject Schema for Google Videos Tab
  const videoObjectSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": `Watch ${title} Full Movie Online Free in HD`,
    "description": movie.overview || `Watch ${title} online in high definition on CineStream.`,
    "thumbnailUrl": [
      movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
      movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : null,
    ].filter(Boolean),
    "uploadDate": releaseDate || "2024-01-01",
    ...(movie.runtime ? { "duration": `PT${movie.runtime}M` } : {}),
    "embedUrl": canonicalUrl,
    "contentUrl": canonicalUrl,
  };

  // FAQPage Schema for Google Search Expandable Accordions
  const genresList = movie.genres?.map((g: any) => g.name).join(", ") || "Action & Drama";
  const castList = movie.credits?.cast?.slice(0, 3).map((c: any) => c.name).join(", ") || "Ensemble Cast";
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Where can I watch ${title} online for free?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `You can stream ${title} online in high definition on CineStream with fast servers and zero popups.`,
        },
      },
      {
        "@type": "Question",
        "name": `What is the release year and genre of ${title}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${title} was released in ${year !== "N/A" ? year : "recent years"} and belongs to ${genresList}.`,
        },
      },
      {
        "@type": "Question",
        "name": `Who stars in ${title}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${title} features stellar performances by ${castList}.`,
        },
      },
      {
        "@type": "Question",
        "name": `Is ${title} available in HD with subtitles?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes, CineStream players support 1080p full HD streaming with multi-language subtitle tracks.`,
        },
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://cinestream-mo.vercel.app",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": type === "movie" ? "Movies" : "TV Shows",
        "item": `https://cinestream-mo.vercel.app/${type === "movie" ? "movies" : "tv-shows"}`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": canonicalUrl,
      },
    ],
  };

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

  const castNames = movie.credits?.cast?.slice(0, 6).map((c: any) => c.name) || [];
  const genreNames = movie.genres?.map((g: any) => g.name) || [];

  const rawKeywords = (type === "movie" ? movie.keywords?.keywords : movie.keywords?.results) || [];
  const moodKeywords = rawKeywords.slice(0, 8).map((k: any) => 
    k.name.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  );
  const finalKeywords = moodKeywords.length > 0 
    ? moodKeywords 
    : ["Witty", "Exciting", "Suspenseful", "Adventure", "Family", "Twists & Turns"];

  const trailer = movie.videos?.results?.find(
    (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  ) || movie.videos?.results?.find((v: any) => v.site === "YouTube");
  const trailerKey = trailer?.key || null;

  return (
    <main className="min-h-screen bg-[#0a0a0b] pb-32 md:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mediaSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoObjectSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <PlayerContainer 
        id={id} 
        type={type as "movie" | "tv"} 
        seasons={movie.seasons} 
        backdropPath={movie.backdrop_path} 
        posterPath={movie.poster_path}
        title={title}
        overview={movie.overview}
        voteAverage={movie.vote_average}
        releaseYear={releaseYear}
        runtime={rawRuntime}
        certification={certification}
        contentAdvisory={contentAdvisory}
        cast={castNames}
        genres={genreNames}
        keywords={finalKeywords}
        spokenLanguages={movie.spoken_languages}
        originalLanguage={movie.original_language}
        initialTime={initialTime}
        initialSeason={initialSeason}
        initialEpisode={initialEpisode}
        autoPlay={autoPlay}
        recommendations={movie.recommendations?.results || []}
        creditsCast={movie.credits?.cast || []}
        director={movie.credits?.crew?.find((c: any) => c.job === "Director")?.name || (type === "tv" ? movie.created_by?.[0]?.name : undefined)}
        releaseDate={releaseDate}
        status={movie.status}
        cleanSlug={cleanSlug}
        trailerKey={trailerKey}
        source={extractMediaSource(movie)}
      />
    </main>
  );
}
