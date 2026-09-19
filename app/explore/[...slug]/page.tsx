import React from 'react';
import ExploreGrid from '@/components/ExploreGrid';
import { getTrendingMovies, getPopularTVSeries, getByGenre, getByLanguage, enrichWithPlatform, GENRE_IDS, LANGUAGE_CODES } from '@/lib/tmdb';
import { Metadata } from 'next';

interface ExplorePageProps {
  params: Promise<{
    slug: string[];
  }>;
}

const resolveLanguageInfo = (val: string) => {
  const normalized = val.toLowerCase();
  for (const [name, info] of Object.entries(LANGUAGE_CODES)) {
    if (name.toLowerCase() === normalized || info.code.toLowerCase() === normalized) {
      return { code: info.code, label: info.label, name };
    }
  }
  return { code: val, label: `${val.toUpperCase()} Cinema`, name: val };
};

export async function generateMetadata({ params }: ExplorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const type = slug[0];
  const subType = slug[1];

  let title = "Explore";
  let description = "Discover our handpicked selection of movies and TV shows.";

  if (type === 'trending') {
    title = "Trending Movies";
    description = "Stream the most popular and trending movies right now in HD on CineStream.";
  } else if (type === 'tv') {
    title = "Popular TV Shows";
    description = "Discover and watch trending and popular TV series online in HD on CineStream.";
  } else if (type === 'genre' && subType) {
    title = `${subType} Movies Collection`;
    description = `Explore our handpicked collection of ${subType} movies and series in full HD on CineStream.`;
  } else if ((type === 'language' || type === 'lang') && subType) {
    const lang = resolveLanguageInfo(subType);
    title = `${lang.label} Movies`;
    description = `Stream the best ${lang.label} movies and blockbusters in HD on CineStream.`;
  }

  const path = `/explore/${slug.join("/")}`;
  const fullUrl = `https://cinestream-mo.vercel.app${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: `${title} | CineStream`,
      description,
      url: fullUrl,
      siteName: "CineStream",
      type: "website",
      images: [
        {
          url: "/icon-512x512.png",
          width: 512,
          height: 512,
          alt: "CineStream",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | CineStream`,
      description,
      images: ["/icon-512x512.png"],
    },
  };
}

export default async function ViewAllPage({ params }: ExplorePageProps) {
  const { slug } = await params;
  const type = slug[0]; // 'trending', 'tv', 'genre', or 'language'
  const subType = slug[1]; // Genre Name or Language Code

  let movies: any[] = [];
  let title = "Explore";
  let subtitle = "Discover our handpicked selection of titles. Stream the latest hits in high quality.";

  if (type === 'trending') {
    movies = await getTrendingMovies().then(enrichWithPlatform);
    title = "Trending Movies";
  } else if (type === 'tv') {
    movies = await getPopularTVSeries().then(enrichWithPlatform);
    title = "Popular TV Shows";
  } else if (type === 'genre' && subType) {
    const genreId = GENRE_IDS[subType as keyof typeof GENRE_IDS];
    movies = genreId ? await getByGenre(genreId).then(enrichWithPlatform) : [];
    title = `${subType} Collection`;
  } else if ((type === 'language' || type === 'lang') && subType) {
    const lang = resolveLanguageInfo(subType);
    movies = await getByLanguage(lang.code).then(enrichWithPlatform);
    title = `${lang.label}`;
    subtitle = `Enjoy top-rated ${lang.label} cinema and latest releases in high definition.`;
  }

  // Schema.org ItemList Structured Data for Google Search Carousel
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": movies.slice(0, 20).map((movie: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": movie.title || movie.name,
      "url": `https://cinestream-mo.vercel.app/watch/${movie.id}?type=${movie.name ? "tv" : "movie"}`,
      "image": movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    })),
  };

  return (
    <div className="min-h-screen p-8 md:p-16 animate-fade-in bg-[#0a0a0b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-2 bg-accent rounded-full shadow-lg shadow-accent/50"></div>
            <h1 className="text-4xl font-black md:text-5xl uppercase tracking-tighter text-white">{title}</h1>
        </div>
        <p className="text-[#a0a0a0] max-w-2xl font-medium">{subtitle}</p>
      </div>

      <ExploreGrid initialMovies={movies} type={type} subType={subType} />
    </div>
  );
}
