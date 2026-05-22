import React from 'react';
import MovieCard from '@/components/MovieCard';
import { getTrendingMovies } from '@/lib/tmdb';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Feature Films | Watch Movies Online",
  description: "Explore the latest cinematic masterpieces on CineStream. From high-octane action to heart-wrenching dramas, find your next favorite movie here.",
};

export default async function MoviesPage() {
  const movies = await getTrendingMovies();

  return (
    <div className="min-h-screen p-8 md:p-16 animate-fade-in bg-[#0a0a0b]">
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
                
                {movies && movies.length > 0 ? (
                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
                        {movies.map((movie: any) => (
                            <div key={movie.id} className="transition-transform hover:z-10">
                                <MovieCard {...movie} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 bg-white/5 rounded-[40px] border border-white/5">
                        <i className="ph-fill ph-film-slate text-8xl text-white/5 mb-6"></i>
                        <p className="text-xl font-bold text-[#a0a0a0]">No movies available at the moment</p>
                    </div>
                )}
            </section>
        </div>
    </div>
  );
}
