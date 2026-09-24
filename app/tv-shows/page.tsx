import React from 'react';
import ExploreGrid from '@/components/ExploreGrid';
import { getPopularTVSeries, enrichWithPlatform } from '@/lib/tmdb';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Watch TV Shows & Netflix Series Online Free in HD | MoviesZone",
  description: "Dive into binge-worthy television on MoviesZone. Stream top trending Netflix originals, Amazon Prime Video series, HBO dramas, and Hindi Dubbed web shows in 1080p Full HD for free.",
  keywords: [
    "Watch TV shows online free",
    "Watch Netflix series free",
    "Prime video shows free stream",
    "Hindi dubbed web series",
    "NetMirror TV shows",
    "TheMovieBox series",
    "MovieBox PRO TV series",
    "KatmovieHD web series",
    "Binge watch TV shows 1080p",
    "Korean drama in Hindi",
    "Free web series online"
  ],
  alternates: {
    canonical: "/tv-shows",
  },
  openGraph: {
    title: "Watch Popular TV Shows & Netflix Series Online Free | MoviesZone",
    description: "Stream the best and trending TV series online in high definition on MoviesZone with zero subscription fees.",
    url: "https://movieszonestream.vercel.app/tv-shows",
    siteName: "MoviesZone",
    type: "website",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "MoviesZone TV Shows",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Watch TV Series & Netflix Shows Free | MoviesZone",
    description: "Stream popular TV series and web shows in HD for free on MoviesZone. MovieBox and NetMirror alternative.",
    images: ["/icon-512x512.png"],
  },
};

export default async function TVShowsPage() {
  const shows = await getPopularTVSeries().then(enrichWithPlatform);

  // Schema.org ItemList for Google Carousel
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Popular TV Series on MoviesZone",
    "itemListElement": (shows || []).slice(0, 20).map((show: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": show.name,
      "url": `https://movieszonestream.vercel.app/watch/${show.id}?type=tv`,
      "image": show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : undefined,
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
                <div className="h-14 w-3 bg-primary rounded-full shadow-[0_0_20px_rgba(142,68,173,0.6)]"></div>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">TV Series</h1>
            </div>
            <p className="text-[#a0a0a0] max-w-2xl text-lg font-medium leading-relaxed">
                Dive into the world of binge-worthy television. From epic fantasies to intense crime thrillers, discover the best of small-screen entertainment.
            </p>
        </div>

        <div className="space-y-20">
            <section>
                <div className="mb-12 flex items-center justify-between">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-white/40">Trending Series</h2>
                    <div className="flex-1 h-[1px] bg-white/5 ml-8"></div>
                </div>
                
                <ExploreGrid initialMovies={shows} type="tv" />
            </section>
        </div>
    </div>
  );
}
