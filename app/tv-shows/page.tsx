import React from 'react';
import ExploreGrid from '@/components/ExploreGrid';
import { getPopularTVSeries, enrichWithPlatform } from '@/lib/tmdb';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "TV Series | Watch Popular TV Shows Online in HD",
  description: "Dive into binge-worthy television on CineStream. From epic fantasies to intense crime thrillers, stream popular TV series in high definition with zero ads.",
  alternates: {
    canonical: "/tv-shows",
  },
  openGraph: {
    title: "Popular TV Series & Binge-Worthy Shows | CineStream",
    description: "Stream the best and trending TV series online in high definition on CineStream.",
    url: "https://cinestream-mo.vercel.app/tv-shows",
    siteName: "CineStream",
    type: "website",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "CineStream TV Shows",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Popular TV Series & Shows | CineStream",
    description: "Stream popular TV series in HD for free on CineStream.",
    images: ["/icon-512x512.png"],
  },
};

export default async function TVShowsPage() {
  const shows = await getPopularTVSeries().then(enrichWithPlatform);

  // Schema.org ItemList for Google Carousel
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Popular TV Series on CineStream",
    "itemListElement": (shows || []).slice(0, 20).map((show: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": show.name,
      "url": `https://cinestream-mo.vercel.app/watch/${show.id}?type=tv`,
      "image": show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : undefined,
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
