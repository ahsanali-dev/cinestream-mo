"use client";
import React, { useState, useEffect, Suspense } from 'react';
import MovieCard from '@/components/MovieCard';
import { searchMovies, GENRE_IDS, getByGenre } from '@/lib/tmdb';
import SkeletonCard from '@/components/SkeletonCard';
import { useSearchParams, useRouter } from 'next/navigation';

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(q);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ type: 'genre' | 'lang' | 'trending'; value: string; label: string }>({ type: 'trending', value: 'trending', label: 'Trending' });

  const categories = [
    { type: 'trending' as const, value: 'trending', label: '🔥 Trending' },
    { type: 'lang' as const, value: 'hi', label: '🇮🇳 Bollywood (Hindi)' },
    { type: 'lang' as const, value: 'pa', label: '🌾 Punjabi Hits' },
    { type: 'lang' as const, value: 'ta', label: '⚡ Tamil Cinema' },
    { type: 'lang' as const, value: 'te', label: '💥 Telugu Cinema' },
    { type: 'genre' as const, value: 'Action', label: 'Action' },
    { type: 'genre' as const, value: 'Comedy', label: 'Comedy' },
    { type: 'genre' as const, value: 'Horror', label: 'Horror' },
    { type: 'genre' as const, value: 'Animation', label: 'Animation' },
    { type: 'genre' as const, value: 'SciFi', label: 'Sci-Fi' },
    { type: 'genre' as const, value: 'Thriller', label: 'Thriller' }
  ];

  // Sync state if URL search query changes
  useEffect(() => {
    setSearchQuery(q);
  }, [q]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      if (searchQuery.trim() === '') {
        if (selectedCategory.type === 'lang') {
          const data = await import('@/lib/tmdb').then(m => m.getByLanguage(selectedCategory.value));
          setResults(data || []);
        } else if (selectedCategory.type === 'genre') {
          const genreId = GENRE_IDS[selectedCategory.value as keyof typeof GENRE_IDS];
          const data = genreId ? await getByGenre(genreId) : [];
          setResults(data || []);
        } else {
          const data = await searchMovies("popular");
          setResults(data || []);
        }
      } else {
        const data = await searchMovies(searchQuery);
        // Filter out people and unknown media types
        const filtered = data?.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv' || !item.media_type) || [];
        setResults(filtered);
      }
      setLoading(false);
    };

    const timeoutId = setTimeout(fetchResults, 400); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const params = new URLSearchParams(window.location.search);
    if (val) {
      params.set('q', val);
    } else {
      params.delete('q');
    }
    router.replace(`/explore?${params.toString()}`);
  };

  return (
    <div className="min-h-screen p-8 md:p-16 bg-[#0a0a0b] animate-fade-in">
      <div className="mb-16 max-w-3xl">
        <h1 className="mb-8 text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">Explore</h1>
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search movies, regional cinema, actors..." 
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-[32px] border border-white/15 bg-white/5 py-6 pl-[72px] pr-14 text-lg text-white placeholder:text-white/40 outline-none focus:border-accent/50 focus:bg-white/10 transition-all shadow-2xl backdrop-blur-xl relative z-0"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center pointer-events-none text-accent shadow-lg shadow-accent/20 transition-transform group-focus-within:scale-105">
            <svg 
              className="w-5 h-5 text-accent" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-20 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all cursor-pointer"
              aria-label="Clear search"
            >
              <i className="ph-bold ph-x text-lg"></i>
            </button>
          )}
        </div>
      </div>

      <div className="mb-16">
        <div className="flex items-center gap-4 mb-8">
            <div className="h-6 w-1.5 bg-accent rounded-full"></div>
            <h2 className="text-xl font-black uppercase tracking-widest text-white/40">Languages, Moods & Genres</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button 
              key={cat.value} 
              onClick={() => { setSelectedCategory(cat); handleSearchChange(''); }}
              className={`rounded-2xl border px-6 py-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory.value === cat.value && !searchQuery
                ? 'bg-accent border-accent text-white shadow-xl shadow-accent/20 scale-105' 
                : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
                {searchQuery ? `Search Results for "${searchQuery}"` : `${selectedCategory.label} Collection`}
            </h2>
            {!loading && <span className="text-xs font-bold text-white/30 uppercase tracking-widest">{results.length} Titles Found</span>}
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
              {[1,2,3,4,5,6,7].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            {results.map((movie: any) => (
              <div key={movie.id} className="animate-fade-in">
                <MovieCard {...movie} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center">
             <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10">
                <i className="ph-bold ph-magnifying-glass text-4xl text-white/60"></i>
             </div>
             <p className="text-2xl font-black text-white/40 uppercase tracking-widest">No match discovered</p>
             <p className="text-sm text-white/20 mt-4 max-w-xs font-medium">We couldn't find anything for "{searchQuery}". Try exploring our top categories instead.</p>
          </div>
        )}
      </div>
    </div>

  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-8 md:p-16 bg-[#0a0a0b] flex items-center justify-center">
        <p className="text-xl font-bold uppercase tracking-widest text-white/40">Loading Explore...</p>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
