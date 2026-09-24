import Hero from "@/components/Hero";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import MovieCard from "@/components/MovieCard";
import AdBanner from "@/components/AdBanner";
import Link from 'next/link';
import ScrollRow from "@/components/ScrollRow";
import { 
  getTrendingMovies, 
  getPopularTVSeries, 
  getPopularNetflixTitles,
  enrichWithPlatform,
  getByGenre, 
  getHindiMovies, 
  getPunjabiMovies, 
  getTamilMovies, 
  getTeluguMovies,
  GENRE_IDS 
} from "@/lib/tmdb";
import { Suspense } from "react";
import SkeletonCard from "@/components/SkeletonCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home | Watch Movies & TV Series Online",
  description: "Stream trending movies, Bollywood, Punjabi, Tamil, Telugu hits, and popular TV shows in high definition on MoviesZone.",
};

export default async function Home() {
  const [
    trendingMovies, 
    popularTV, 
    netflixTitles,
    hindiMovies, 
    punjabiMovies, 
    tamilMovies, 
    teluguMovies,
    actionMovies, 
    horrorMovies
  ] = await Promise.all([
    getTrendingMovies().then(enrichWithPlatform),
    getPopularTVSeries().then(enrichWithPlatform),
    getPopularNetflixTitles(),
    getHindiMovies().then(enrichWithPlatform),
    getPunjabiMovies().then(enrichWithPlatform),
    getTamilMovies().then(enrichWithPlatform),
    getTeluguMovies().then(enrichWithPlatform),
    getByGenre(GENRE_IDS.Action).then(enrichWithPlatform),
    getByGenre(GENRE_IDS.Horror).then(enrichWithPlatform)
  ]);

  return (
    <main className="min-h-screen pb-24 bg-[#080A0F] -mt-20">
      <Hero />
      {/* <AdBanner /> */}

      {/* Continue Watching for You */}
      <ContinueWatchingRow />

      {/* Global Trending & Popular Series */}
      <MovieRow title="Trending Movies" data={trendingMovies} link="/explore/trending" />
      <MovieRow title="Latest Series" data={popularTV} link="/explore/tv" />

      {/* Popular on Netflix */}
      {netflixTitles.length > 0 && (
        <MovieRow title="Popular on Netflix" data={netflixTitles} link="/explore/tv" />
      )}
      
      {/* Regional Cinema Spotlight Cards */}
      <section className="px-8 md:px-16 pt-24">
        <div className="mb-8 space-y-1">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
            Language & Regional Cinema
          </h2>
          <p className="text-xs md:text-sm font-medium text-[#a0a0a0]">
            Browse your favorite movies by language — Bollywood, Punjabi, Tamil, Telugu, and more.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <LanguageCard 
            title="Bollywood" 
            subtitle="Hindi Cinema" 
            icon="ph-fill ph-film-strip" 
            gradient="from-orange-500/20 via-amber-500/10 to-transparent" 
            accentColor="text-orange-400 border-orange-500/30" 
            link="/explore/language/hi" 
          />
          <LanguageCard 
            title="Pollywood" 
            subtitle="Punjabi Cinema" 
            icon="ph-fill ph-music-notes" 
            gradient="from-yellow-500/20 via-amber-500/10 to-transparent" 
            accentColor="text-yellow-400 border-yellow-500/30" 
            link="/explore/language/pa" 
          />
          <LanguageCard 
            title="Kollywood" 
            subtitle="Tamil Cinema" 
            icon="ph-fill ph-fire" 
            gradient="from-red-500/20 via-rose-500/10 to-transparent" 
            accentColor="text-red-400 border-red-500/30" 
            link="/explore/language/ta" 
          />
          <LanguageCard 
            title="Tollywood" 
            subtitle="Telugu Cinema" 
            icon="ph-fill ph-lightning" 
            gradient="from-emerald-500/20 via-teal-500/10 to-transparent" 
            accentColor="text-emerald-400 border-emerald-500/30" 
            link="/explore/language/te" 
          />
        </div>
      </section>

      {/* Regional Movies Rows */}
      {hindiMovies.length > 0 && (
        <MovieRow 
          title="Bollywood Blockbusters" 
          data={hindiMovies} 
          link="/explore/language/hi" 
        />
      )}

      {punjabiMovies.length > 0 && (
        <MovieRow 
          title="Punjabi Cinema Hits" 
          data={punjabiMovies} 
          link="/explore/language/pa" 
        />
      )}

      {tamilMovies.length > 0 && (
        <MovieRow 
          title="Tamil Mass & Drama" 
          data={tamilMovies} 
          link="/explore/language/ta" 
        />
      )}

      {teluguMovies.length > 0 && (
        <MovieRow 
          title="Telugu Superstars" 
          data={teluguMovies} 
          link="/explore/language/te" 
        />
      )}

      {/* Category Icons (Genres) */}
      <section className="px-8 md:px-16 pt-24">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
            Explore By Mood & Genre
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <CategoryIconCard title="Action" icon="ph-fill ph-sword" color="bg-orange-500/20 text-[#FF6A00]" link="/explore/genre/Action" />
          <CategoryIconCard title="Comedy" icon="ph-fill ph-mask-happy" color="bg-yellow-500/20 text-yellow-500" link="/explore/genre/Comedy" />
          <CategoryIconCard title="Horror" icon="ph-fill ph-skull" color="bg-purple-500/20 text-purple-500" link="/explore/genre/Horror" />
          <CategoryIconCard title="Animation" icon="ph-fill ph-paint-brush" color="bg-blue-500/20 text-blue-500" link="/explore/genre/Animation" />
        </div>
      </section>

      {/* Genre Rows */}
      <MovieRow title="Action Blockbusters" data={actionMovies} link="/explore/genre/Action" />
      <MovieRow title="Horror Nights" data={horrorMovies} link="/explore/genre/Horror" />
    </main>
  );
}

const MovieRow = ({ 
  title, 
  data, 
  link, 
}: { 
  title: string; 
  data: any[]; 
  link: string; 
  badge?: string; 
  badgeColor?: string; 
}) => {
  if (!data || data.length === 0) return null;

  return (
    <section className="px-8 md:px-16 pt-16">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-black md:text-3xl tracking-tight text-white uppercase">{title}</h2>
        <Link href={link} className="text-[10px] font-black tracking-widest text-[#a0a0a0] hover:text-accent transition-all uppercase border-b-2 border-transparent hover:border-accent pb-1">
          View All <i className="ph-bold ph-caret-right ml-1"></i>
        </Link>
      </div>
      <Suspense fallback={<div className="flex overflow-x-auto gap-8 pb-10 no-scrollbar scroll-smooth">{[1,2,3,4,5,6].map(i => <div key={i} className="w-44 md:w-56 shrink-0"><SkeletonCard /></div>)}</div>}>
        <ScrollRow>
          {data.map((item: any) => (
            <div key={item.id} className="w-44 md:w-56 shrink-0">
              <MovieCard {...item} />
            </div>
          ))}
        </ScrollRow>
      </Suspense>
    </section>
  );
};

const LanguageCard = ({
  title,
  subtitle,
  icon,
  gradient,
  accentColor,
  link
}: {
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  accentColor: string;
  link: string;
}) => (
  <Link 
    href={link} 
    className={`group relative flex flex-col justify-between p-6 rounded-[28px] bg-gradient-to-br ${gradient} border border-white/5 hover:border-accent/40 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.03] shadow-xl`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl ${accentColor} shadow-inner group-hover:scale-110 transition-transform`}>
        <i className={icon}></i>
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
        Explore <i className="ph-bold ph-arrow-up-right ml-0.5"></i>
      </span>
    </div>
    <div>
      <h3 className="font-black uppercase tracking-wider text-base text-white group-hover:text-accent transition-colors">{title}</h3>
      <p className="text-xs text-[#a0a0a0] font-medium mt-0.5">{subtitle}</p>
    </div>
  </Link>
);

const CategoryIconCard = ({ title, icon, color, link }: { title: string, icon: string, color: string, link: string }) => (
  <Link href={link} className="group flex flex-col items-center justify-center gap-4 p-8 rounded-[32px] bg-white/5 border border-white/5 hover:border-accent/40 hover:bg-white/10 transition-all">
    <div className={`h-16 w-16 rounded-2xl ${color} flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-xl`}>
      <i className={icon}></i>
    </div>
    <span className="font-black uppercase tracking-widest text-xs">{title}</span>
  </Link>
);

