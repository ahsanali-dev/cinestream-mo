import { getMovieDetails } from "@/lib/tmdb";
import Link from "next/link";
import MovieCard from "@/components/MovieCard";
import PlayerContainer from "@/components/PlayerContainer";
import ScrollRow from "@/components/ScrollRow";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const { type = "movie" } = await searchParams;
    
    const movie = await getMovieDetails(id, type as "movie" | "tv");
    
    if (!movie) {
      return {
        title: "Content Not Found",
        description: "The requested movie or TV show could not be found.",
      };
    }

    const title = movie.title || movie.name;
    const releaseDate = movie.release_date || movie.first_air_date;
    const year = releaseDate ? ` (${releaseDate.split("-")[0]})` : "";
    const description = movie.overview 
      ? movie.overview.slice(0, 160) + (movie.overview.length > 160 ? "..." : "")
      : `Watch ${title} online in high definition on CineStream.`;
    const backdropUrl = movie.backdrop_path 
      ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` 
      : undefined;

    return {
      title: `${title}${year}`,
      description,
      openGraph: {
        title: `${title}${year} | CineStream`,
        description,
        type: type === "movie" ? "video.movie" : "video.tv_show",
        images: backdropUrl ? [{ url: backdropUrl, alt: title }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${title}${year} | CineStream`,
        description,
        images: backdropUrl ? [backdropUrl] : undefined,
      },
    };
  } catch (error) {
    return {
      title: "Watch",
      description: "Watch movies and TV series online in high definition.",
    };
  }
}

export default async function WatchPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { type = "movie" } = await searchParams;
  
  const movie = await getMovieDetails(id, type as "movie" | "tv");

  if (!movie) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-20 text-center">
        <div className="h-24 w-24 rounded-full bg-accent/20 flex items-center justify-center text-4xl text-accent mb-6 animate-pulse">
            <i className="ph-fill ph-warning"></i>
        </div>
        <h1 className="text-3xl font-black italic uppercase mb-4">Content Not Found</h1>
        <p className="text-[#a0a0a0] mb-8 max-w-md">The requested title could not be loaded. This might be due to a technical issue or the content being unavailable.</p>
        <Link href="/" className="px-10 py-4 bg-white text-black font-black italic uppercase rounded-2xl hover:scale-105 transition-all">
            Return to Home
        </Link>
      </div>
    );
  }

  const title = movie.title || movie.name;
  const releaseDate = movie.release_date || movie.first_air_date;
  const year = releaseDate ? releaseDate.split("-")[0] : "N/A";
  const rating = movie.vote_average?.toFixed(1);

  return (
    <main className="min-h-screen bg-[#0a0a0b] pb-20">
      <PlayerContainer 
        id={id} 
        type={type as "movie" | "tv"} 
        seasons={movie.seasons} 
        backdropPath={movie.backdrop_path} 
      />

      {/* Content Info */}
      <div className="px-6 md:px-16 pt-12 md:pt-16 watch-details">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Info */}
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="bg-accent px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest italic shadow-lg shadow-accent/20">Now Playing</span>
                    <span className="text-white/40 font-bold text-sm tracking-widest uppercase">{type}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white leading-tight">
                    {title}
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-sm md:text-base font-bold text-white/60">
                    <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20">
                        <i className="ph-fill ph-star"></i>
                        <span>{rating}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                        <i className="ph-bold ph-calendar"></i>
                        <span>{year}</span>
                    </div>
                    {movie.runtime && (
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                            <i className="ph-bold ph-clock"></i>
                            <span>{movie.runtime}m</span>
                        </div>
                    )}
                    {movie.status && (
                        <div className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[10px] uppercase tracking-widest">
                            {movie.status}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1 bg-accent rounded-full"></div>
                    <h3 className="text-lg font-black italic uppercase tracking-widest">Overview</h3>
                </div>
                <p className="text-lg text-[#a0a0a0] leading-relaxed max-w-4xl font-medium antialiased">
                    {movie.overview}
                </p>
            </div>

            {/* Genres */}
            {movie.genres && (
                <div className="flex flex-wrap gap-3">
                    {movie.genres.map((genre: any) => (
                        <Link 
                            key={genre.id} 
                            href={`/explore/genre/${genre.name}`}
                            className="px-5 py-2.5 bg-white/5 hover:bg-accent/20 hover:border-accent/40 border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            {genre.name}
                        </Link>
                    ))}
                </div>
            )}
          </div>

          {/* Sidebar / Extra Info */}
          <div className="lg:w-96 space-y-10">
            {/* Cast / Credits Snippet */}
            {movie.credits?.cast && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-1 bg-accent rounded-full"></div>
                        <h3 className="text-lg font-black italic uppercase tracking-widest">Top Cast</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {movie.credits.cast.slice(0, 4).map((person: any) => (
                            <div key={person.id} className="flex items-center gap-4 group">
                                <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-white/5 group-hover:border-accent/40 transition-all shrink-0">
                                    <img 
                                        src={person.profile_path ? `https://image.tmdb.org/t/p/w200${person.profile_path}` : "https://via.placeholder.com/200x200"} 
                                        alt={person.name}
                                        className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                                    />
                                </div>
                                <div>
                                    <p className="font-black italic uppercase text-sm tracking-tight">{person.name}</p>
                                    <p className="text-xs text-[#a0a0a0] font-bold">{person.character}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendations or Related (if available from lib/tmdb) */}
            <div className="pt-6 border-t border-white/5">
                <Link 
                    href="/explore"
                    className="flex items-center justify-between p-6 bg-gradient-to-br from-accent/20 to-transparent border border-accent/20 rounded-[32px] group hover:scale-[1.02] transition-all"
                >
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Discover More</p>
                        <h4 className="text-xl font-black italic uppercase leading-none">Explore Similar</h4>
                    </div>
                    <div className="h-12 w-12 bg-accent rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
                        <i className="ph-bold ph-magnifying-glass"></i>
                    </div>
                </Link>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        {movie.recommendations?.results?.length > 0 && (
            <section className="mt-24">
                <div className="mb-10 space-y-1">
                    <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight text-white">Recommended For You</h2>
                    <div className="h-1.5 w-24 bg-accent rounded-full"></div>
                </div>
                <ScrollRow>
                    {movie.recommendations.results.slice(0, 10).map((item: any) => (
                        <div key={item.id} className="w-44 md:w-60 shrink-0">
                            <MovieCard {...item} />
                        </div>
                    ))}
                </ScrollRow>
            </section>
        )}
      </div>

    </main>
  );
}
