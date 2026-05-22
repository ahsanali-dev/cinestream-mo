import React from 'react';
import MovieCard from '@/components/MovieCard';
import { getPopularTVSeries } from '@/lib/tmdb';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "TV Series | Binge-Worthy TV Shows",
  description: "Dive into the world of binge-worthy television. From epic fantasies to intense crime thrillers, discover the best of small-screen entertainment.",
};

export default async function TVShowsPage() {
  const shows = await getPopularTVSeries();

  return (
    <div className="min-h-screen p-8 md:p-16 animate-fade-in bg-[#0a0a0b]">
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
                
                {shows && shows.length > 0 ? (
                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
                        {shows.map((show: any) => (
                            <div key={show.id} className="transition-transform hover:z-10">
                                <MovieCard {...show} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 bg-white/5 rounded-[40px] border border-white/5">
                        <i className="ph-fill ph-monitor-play text-8xl text-white/5 mb-6"></i>
                        <p className="text-xl font-bold text-[#a0a0a0]">No series available at the moment</p>
                    </div>
                )}
            </section>
        </div>
    </div>
  );
}
