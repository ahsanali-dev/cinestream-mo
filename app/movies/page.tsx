import React from 'react';
import ExploreGrid from '@/components/ExploreGrid';
import { getTrendingMovies, enrichWithPlatform } from '@/lib/tmdb';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Watch Movies Online Free in HD | Bollywood, Hollywood, Hindi Dubbed - MoviesZone",
  description: "Explore the latest blockbuster movies in 1080p Full HD on MoviesZone. Watch Bollywood, South Indian Hindi Dubbed, and Hollywood cinema with zero ads. The ultimate KatmovieHD and MovieBox alternative.",
  keywords: [
    "Watch movies online free",
    "Hindi dubbed movies HD",
    "Dual audio movies 1080p",
    "KatmovieHD alternative",
    "MovieBox movies",
    "TheMovieBox stream",
    "NetMirror movies online",
    "Vegamovies hindi",
    "Bollyflix full movie",
    "Bollywood blockbusters free",
    "Hollywood movies in Hindi"
  ],
  alternates: {
    canonical: "/movies",
  },
  openGraph: {
    title: "Watch Movies Online Free in 1080p HD | MoviesZone",
    description: "Stream the latest trending movies and cinematic masterpieces in high definition with Hindi Dubbed audio on MoviesZone.",
    url: "https://movieszonestream.vercel.app/movies",
    siteName: "MoviesZone",
    type: "website",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "MoviesZone Movies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Watch Feature Films & Blockbusters | MoviesZone",
    description: "Stream trending movies in full HD for free on MoviesZone. MovieBox and KatmovieHD alternative.",
    images: ["/icon-512x512.png"],
  },
};

export default async function MoviesPage() {
  const movies = await getTrendingMovies().then(enrichWithPlatform);

  // Schema.org ItemList for Google Carousel
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Trending Feature Films on MoviesZone",
    "itemListElement": (movies || []).slice(0, 20).map((movie: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": movie.title,
      "url": `https://movieszonestream.vercel.app/watch/${movie.id}?type=movie`,
      "image": movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    })),
  };

  return (
    <div className="min-h-screen p-8 md:p-16 animate-fade-in bg-[#080A0F]">
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
