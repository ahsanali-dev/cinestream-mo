import React from 'react';
import Link from 'next/link';

interface MovieCardProps {
  id: string | number;
  title?: string;
  name?: string; // TMDB uses name for TV shows
  poster_path?: string;
  image?: string;
  vote_average?: number;
  rating?: string | number;
  release_date?: string;
  first_air_date?: string;
  year?: string | number;
  media_type?: 'movie' | 'tv';
}

const MovieCard = (props: MovieCardProps) => {
  const { id, title, name, poster_path, image, vote_average, rating, release_date, first_air_date, year, media_type } = props;
  
  const displayTitle = title || name || "Unknown Title";
  const displayImage = poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : (image || "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2000");
  const displayRating = vote_average ? vote_average.toFixed(1) : (rating || "N/A");
  const displayYear = release_date ? release_date.split('-')[0] : (first_air_date ? first_air_date.split('-')[0] : (year || "N/A"));

  const type = media_type || (name || first_air_date ? 'tv' : 'movie');

  return (
    <Link 
      href={`/watch/${id}?type=${type}`}
      className="group block cursor-pointer"
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-500 ease-out group-hover:-translate-y-3 group-hover:scale-[1.03] group-hover:border-accent/40 group-hover:shadow-[0_20px_40px_rgba(231,76,60,0.2)]">
        <img 
          src={displayImage} 
          alt={displayTitle}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
           <div className="flex items-center gap-2 mb-2">
              <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-black uppercase text-white">4K UHD</span>
              <span className="text-[10px] font-bold text-white/60">{displayYear}</span>
           </div>
           <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2 text-xs font-black text-black">
              <i className="ph-fill ph-play"></i> PLAY NOW
           </div>
        </div>

        {/* Rating Badge */}
        <div className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-black text-yellow-500 backdrop-blur-md border border-white/10">
           <i className="ph-fill ph-star"></i> {displayRating}
        </div>
      </div>
      <h3 className="mt-4 text-sm font-bold text-white transition-colors group-hover:text-accent truncate">{displayTitle}</h3>
      <p className="text-[10px] font-medium uppercase tracking-tighter text-[#a0a0a0] mt-1">{displayYear} • {props.vote_average ? "Trending" : "Movie"}</p>
    </Link>
  );
};

export default MovieCard;
