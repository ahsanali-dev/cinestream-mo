"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination, Navigation } from "swiper/modules";
import { getTrendingMovies, getImageUrl, getMovieDetails } from "@/lib/tmdb";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function Hero() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const swiperRef = useRef<any>(null);
  const hoverTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const fetchHeroData = async () => {
      setLoading(true);
      try {
        const data = await getTrendingMovies();
        const top5 = data.slice(0, 5) || [];
        const detailedMovies = await Promise.all(
          top5.map(async (movie: any) => {
            try {
              const details = await getMovieDetails(movie.id.toString(), "movie");
              return { ...movie, ...details };
            } catch (e) {
              return movie;
            }
          })
        );
        setMovies(detailedMovies);
      } catch (e) {
        setMovies([]);
      }
      setLoading(false);
    };
    fetchHeroData();
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="relative h-[80vh] w-full bg-[#0a0a0b] p-8 md:p-20 flex flex-col justify-center overflow-hidden">
        {/* Skeleton Shimmer Background */}
        <div className="absolute inset-0 bg-white/5 animate-shimmer"></div>
        
        {/* Skeleton Content */}
        <div className="relative z-10 w-full max-w-4xl space-y-8">
            <div className="flex gap-4">
                <div className="h-6 w-20 rounded bg-white/10 animate-shimmer"></div>
                <div className="h-6 w-16 rounded bg-white/10 animate-shimmer"></div>
            </div>
            <div className="h-20 w-3/4 rounded-2xl bg-white/10 animate-shimmer"></div>
            <div className="space-y-3">
                <div className="h-4 w-full rounded bg-white/5 animate-shimmer"></div>
                <div className="h-4 w-5/6 rounded bg-white/5 animate-shimmer"></div>
                <div className="h-4 w-4/6 rounded bg-white/5 animate-shimmer"></div>
            </div>
            <div className="flex gap-6 pt-4">
                <div className="h-16 w-48 rounded-2xl bg-white/10 animate-shimmer"></div>
                <div className="h-16 w-40 rounded-2xl bg-white/5 animate-shimmer"></div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <section 
      className="relative h-[80vh] w-full overflow-hidden bg-black"
      onMouseEnter={() => {
        if (swiperRef.current && swiperRef.current.autoplay) {
          swiperRef.current.autoplay.stop();
        }
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
          setShowTrailer(true);
        }, 2000);
      }}
      onMouseLeave={() => {
        if (swiperRef.current && swiperRef.current.autoplay) {
          swiperRef.current.autoplay.start();
        }
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setShowTrailer(false);
      }}
    >
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={(swiper) => {
          setActiveIndex(swiper.realIndex);
          setShowTrailer(false);
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
        }}
        modules={[Autoplay, EffectFade, Pagination, Navigation]}
        effect="fade"
        speed={1000}
        autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true, dynamicBullets: true }}
        navigation={true}
        loop={true}
        className="h-full w-full hero-swiper"
      >
        {movies.map((movie, idx) => {
          const isCurrent = idx === activeIndex;
          const trailerVideo = movie.videos?.results?.find(
            (v: any) => v.type === "Trailer" && v.site === "YouTube"
          ) || movie.videos?.results?.[0];
          const trailerKey = trailerVideo?.key;

          return (
            <SwiperSlide key={movie.id}>
              <div className="relative h-full w-full">
                {/* Cinematic Background with Gradient Overlays */}
                {showTrailer && isCurrent && trailerKey ? (
                  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-opacity duration-1000 opacity-100">
                    <iframe
                      src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&playsinline=1`}
                      className="absolute h-[150%] w-[150%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover aspect-video"
                      allow="autoplay; encrypted-media"
                      frameBorder="0"
                    />
                  </div>
                ) : (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[5s] scale-110 group-hover:scale-100"
                    style={{ 
                        backgroundImage: `linear-gradient(to right, #0a0a0b 0%, rgba(0,0,0,0) 60%), linear-gradient(to top, #0a0a0b 0%, transparent 40%), url('${getImageUrl(movie.backdrop_path)}')` 
                    }}
                  />
                )}

                {/* Additional gradient masks to blend everything nicely into dark theme */}
                <div className="absolute inset-0 z-1 bg-gradient-to-r from-[#0a0a0b] via-[#0a0a0b]/60 to-transparent pointer-events-none" />
                <div className="absolute inset-0 z-1 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/30 to-transparent pointer-events-none" />
              
              {/* Content Overlay */}
              <div className="relative z-10 flex h-full flex-col justify-center px-8 md:px-20 max-w-4xl py-20 translate-y-10 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                    <span className="bg-accent px-3 py-1 rounded text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg shadow-accent/20 italic">Featured</span>
                    <span className="text-white/60 font-bold text-sm">{movie.release_date?.split('-')[0]}</span>
                    <span className="flex items-center gap-1.5 text-yellow-500 font-bold text-sm"><i className="ph-fill ph-star"></i> {movie.vote_average?.toFixed(1)}</span>
                </div>
                
                <h1 className="text-4xl md:text-7xl font-black text-white italic mb-6 leading-[1.1] drop-shadow-2xl uppercase tracking-tighter">
                  {movie.title}
                </h1>
                
                <p className="mb-10 max-w-2xl text-base md:text-xl text-[#a0a0a0] leading-relaxed line-clamp-3 md:line-clamp-none font-medium">
                  {movie.overview}
                </p>
                
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={`/watch/${movie.id}?type=movie`}
                    className="flex items-center gap-3 rounded-xl bg-white px-10 py-4 text-sm md:text-base font-black text-black transition-all hover:scale-105 active:scale-95 shadow-2xl"
                  >
                    <i className="ph-fill ph-play text-xl md:text-2xl"></i> WATCH NOW
                  </Link>
                  <button className="flex items-center gap-2 rounded-xl bg-white/10 px-8 py-4 text-sm md:text-base font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 border border-white/10">
                    <i className="ph-bold ph-plus text-xl"></i> WISHLIST
                  </button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        );
      })}
      </Swiper>

      <style jsx global>{`
        .hero-swiper .swiper-pagination-bullet {
            background: white !important;
            opacity: 0.3;
        }
        .hero-swiper .swiper-pagination-bullet-active {
            background: #e74c3c !important;
            opacity: 1;
            width: 24px;
            border-radius: 4px;
        }
        .hero-swiper .swiper-button-next, .hero-swiper .swiper-button-prev {
            color: white !important;
            transform: scale(0.6);
            padding: 40px;
            opacity: 0;
            transition: all 0.3s;
        }
        .hero-swiper:hover .swiper-button-next, .hero-swiper:hover .swiper-button-prev {
            opacity: 0.5;
        }
      `}</style>
    </section>
  );
}
