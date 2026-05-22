import Hero from "@/components/Hero";
import MovieCard from "@/components/MovieCard";
import AdBanner from "@/components/AdBanner";
import Link from 'next/link';
import ScrollRow from "@/components/ScrollRow";
import { getTrendingMovies, getPopularTVSeries, getByGenre, GENRE_IDS } from "@/lib/tmdb";
import { Suspense } from "react";
import SkeletonCard from "@/components/SkeletonCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home | Watch Movies & TV Series Online",
  description: "Stream the latest trending movies and popular TV shows in high definition on CineStream. Explore action, horror, comedy, and animation collections.",
};

export default async function Home() {
  const trendingMovies = await getTrendingMovies();
  const popularTV = await getPopularTVSeries();
  const actionMovies = await getByGenre(GENRE_IDS.Action);
  const horrorMovies = await getByGenre(GENRE_IDS.Horror);

  return (
    <main className="min-h-screen pb-24 bg-[#0a0a0b] -mt-20">
      <Hero />
      {/* <AdBanner /> */}

      <MovieRow title="Trending Movies" data={trendingMovies} link="/explore/trending" />
      <MovieRow title="Latest Series" data={popularTV} link="/explore/tv" />
      
      {/* Category Icons */}
      <section className="px-8 md:px-16 pt-24 grid grid-cols-2 md:grid-cols-4 gap-6">
          <CategoryIconCard title="Action" icon="ph-fill ph-sword" color="bg-red-500/20 text-red-500" link="/explore/genre/Action" />
          <CategoryIconCard title="Comedy" icon="ph-fill ph-mask-happy" color="bg-yellow-500/20 text-yellow-500" link="/explore/genre/Comedy" />
          <CategoryIconCard title="Horror" icon="ph-fill ph-skull" color="bg-purple-500/20 text-purple-500" link="/explore/genre/Horror" />
          <CategoryIconCard title="Animation" icon="ph-fill ph-paint-brush" color="bg-blue-500/20 text-blue-500" link="/explore/genre/Animation" />
      </section>

      <MovieRow title="Action Blockbusters" data={actionMovies} link="/explore/genre/Action" />
      <MovieRow title="Horror Nights" data={horrorMovies} link="/explore/genre/Horror" />
    </main>
  );
}

const MovieRow = ({ title, data, link }: { title: string, data: any[], link: string }) => (
    <section className="px-8 md:px-16 pt-20">
        <div className="mb-10 flex items-center justify-between">
            <div className="space-y-1">
                <h2 className="text-2xl font-black md:text-3xl tracking-tight text-white uppercase">{title}</h2>
                <div className="h-1.5 w-20 bg-accent rounded-full shadow-lg shadow-accent/20"></div>
            </div>
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

const CategoryIconCard = ({ title, icon, color, link }: { title: string, icon: string, color: string, link: string }) => (
    <Link href={link} className="group flex flex-col items-center justify-center gap-4 p-8 rounded-[32px] bg-white/5 border border-white/5 hover:border-accent/40 hover:bg-white/10 transition-all">
        <div className={`h-16 w-16 rounded-2xl ${color} flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-xl`}>
            <i className={icon}></i>
        </div>
        <span className="font-black uppercase tracking-widest text-xs">{title}</span>
    </Link>
);
