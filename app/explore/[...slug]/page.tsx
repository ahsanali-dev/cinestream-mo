import React from 'react';
import MovieCard from '@/components/MovieCard';
import { getTrendingMovies, getPopularTVSeries, getByGenre, GENRE_IDS } from '@/lib/tmdb';
import { Metadata } from 'next';

interface ExplorePageProps {
  params: {
    slug: string[];
  };
}

export async function generateMetadata({ params }: ExplorePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const type = slug[0];
  const subType = slug[1];

  let title = "Explore";
  let description = "Discover our handpicked selection of movies and TV shows.";

  if (type === 'trending') {
    title = "Trending Movies";
    description = "Stream the most popular and trending movies right now on CineStream.";
  } else if (type === 'tv') {
    title = "Popular TV Shows";
    description = "Discover and watch trending and popular TV series on CineStream.";
  } else if (type === 'genre' && subType) {
    title = `${subType} Collection`;
    description = `Explore our handpicked collection of ${subType} movies and TV shows on CineStream.`;
  }

  return {
    title,
    description,
  };
}

export default async function ViewAllPage({ params }: ExplorePageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const type = slug[0]; // 'trending', 'tv', or 'genre'
  const subType = slug[1]; // Genre Name if type is 'genre'

  let movies = [];
  let title = "Explore";

  if (type === 'trending') {
    movies = await getTrendingMovies();
    title = "Trending Movies";
  } else if (type === 'tv') {
    movies = await getPopularTVSeries();
    title = "Popular TV Shows";
  } else if (type === 'genre' && subType) {
    const genreId = GENRE_IDS[subType as keyof typeof GENRE_IDS];
    movies = await getByGenre(genreId);
    title = `${subType} Collection`;
  }

  return (
    <div className="min-h-screen p-8 md:p-16 animate-fade-in">
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-2 bg-accent rounded-full shadow-lg shadow-accent/50"></div>
            <h1 className="text-4xl font-black md:text-5xl uppercase tracking-tighter">{title}</h1>
        </div>
        <p className="text-[#a0a0a0] max-w-2xl font-medium">Discover our handpicked selection of {title.toLowerCase()}. Stream the latest hits in high quality.</p>
      </div>

      {movies.length > 0 ? (
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {movies.map((movie: any) => (
            <div key={movie.id} className="animate-fade-in">
                <MovieCard {...movie} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40">
           <i className="ph-fill ph-monitor-play text-8xl text-white/5 mb-6"></i>
           <p className="text-xl font-bold text-[#a0a0a0]">No content found for this category</p>
        </div>
      )}
    </div>
  );
}
