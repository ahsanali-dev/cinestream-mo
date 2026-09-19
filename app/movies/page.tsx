import React from 'react';
import ExploreGrid from '@/components/ExploreGrid';
import { getTrendingMovies, enrichWithPlatform } from '@/lib/tmdb';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Feature Films | Watch Movies Online in HD",
  description: "Explore the latest cinematic masterpieces on CineStream. From high-octane action to heart-wrenching dramas, stream trending movies in full HD for free.",
  alternates: {
    canonical: "/movies",
  },
  openGraph: {
    title: "Feature Films & Blockbusters | CineStream",
    description: "Stream the latest trending movies and cinematic masterpieces in high definition on CineStream.",
    url: "https://cinestream-mo.vercel.app/movies",
    siteName: "CineStream",
    type: "website",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "CineStream Movies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Feature Films & Blockbusters | CineStream",
    description: "Stream trending movies in full HD for free on CineStream.",
    images: ["/icon-512x512.png"],
  },
};

export default async function MoviesPage() {
  const movies = await getTrendingMovies().then(enrichWithPlatform);

  // Schema.org ItemList for Google Carousel
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Trending Feature Films on CineStream",
    "itemListElement": (movies || []).slice(0, 20).map((movie: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": movie.title,
      "url": `https://cinestream-mo.vercel.app/watch/${movie.id}?type=movie`,
      "image": movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    })),
  };

  return (
    <div className="min-h-screen p-8 md:p-16 animate-fade-in bg-[#0a0a0b]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
        {/* Cinematic Header */}
        <div className="mb-20">
            <div className="flex items-center gap-6 mb-4">
                <div className="h-14 w-3 bg-accent rounded-full shadow-[0_0_20px_rgba(231,76,60,0.6)]"></div>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">Feature Films</h1>
            </div>
            <p className="text-[#a0a0a0] max-w-2xl text-lg font-medium leading-relaxed">
                Explore the latest cinematic masterpieces. From high-octane action to heart-wrenching dramas, find your next favorite movie here.
            </p>
        </div>

        <div className="space-y-20">
            <section>
                <div className="mb-12 flex items-center justify-between">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-white/40">Latest Discoveries</h2>
                    <div className="flex-1 h-[1px] bg-white/5 ml-8"></div>
                </div>
                
                <ExploreGrid initialMovies={movies} type="trending" />
            </section>
        </div>
    </div>
  );
}
