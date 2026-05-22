"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTVShowEpisodes } from "@/lib/tmdb";

interface Season {
  season_number: number;
  episode_count: number;
  name?: string;
}

interface PlayerContainerProps {
  id: string;
  type: "movie" | "tv";
  seasons?: Season[];
  backdropPath?: string;
}

interface Server {
  id: string;
  name: string;
  getUrl: (id: string, type: "movie" | "tv", season: number, episode: number) => string;
}

const SERVERS: Server[] = [
  {
    id: "vidsrc_to",
    name: "Server 1 (VidSrc To)",
    getUrl: (id, type, season, episode) =>
      type === "movie"
        ? `https://vidsrc.to/embed/movie/${id}`
        : `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`,
  },
  {
    id: "vidsrc_cc",
    name: "Server 2 (VidSrc CC)",
    getUrl: (id, type, season, episode) =>
      type === "movie"
        ? `https://vidsrc.cc/v2/embed/movie/${id}`
        : `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`,
  },
  {
    id: "two_embed",
    name: "Server 4 (2Embed)",
    getUrl: (id, type, season, episode) =>
      type === "movie"
        ? `https://www.2embed.cc/embed/${id}`
        : `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`,
  },
  {
    id: "vidsrc_me",
    name: "Server 3 (VidSrc Me)",
    getUrl: (id, type, season, episode) =>
      type === "movie"
        ? `https://vidsrc.me/embed/movie?tmdb=${id}`
        : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`,
  },
  {
    id: "embed_su",
    name: "Server 5 (Embed.su - Region Blocked)",
    getUrl: (id, type, season, episode) =>
      type === "movie"
        ? `https://embed.su/embed/movie/${id}`
        : `https://embed.su/embed/tv/${id}/${season}/${episode}`,
  },
  {
    id: "autoembed",
    name: "Server 6 (AutoEmbed - Region Blocked)",
    getUrl: (id, type, season, episode) =>
      type === "movie"
        ? `https://player.autoembed.cc/embed/movie/${id}`
        : `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`,
  },
];

export default function PlayerContainer({ id, type, seasons = [], backdropPath }: PlayerContainerProps) {
  const router = useRouter();
  const [selectedServer, setSelectedServer] = useState<string>("vidsrc_to");
  const [theaterMode, setTheaterMode] = useState<boolean>(false);

  // Sync theater mode class on body
  useEffect(() => {
    if (theaterMode) {
      document.body.classList.add("theater-mode");
    } else {
      document.body.classList.remove("theater-mode");
    }
    return () => {
      document.body.classList.remove("theater-mode");
    };
  }, [theaterMode]);

  // Intercept and prevent automatic redirects from third-party iframe ads
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Trigger browser prompt to prevent automatic redirect
      e.preventDefault();
      // Cast to any to bypass TypeScript deprecation warning ts(6385)
      (e as any).returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Filter seasons: usually we want to skip specials (season_number = 0) unless it's the only season
  const activeSeasons = seasons.filter(
    (s) => s.season_number > 0 || (seasons.length === 1 && s.season_number === 0)
  );

  const [selectedSeason, setSelectedSeason] = useState<number>(
    activeSeasons.length > 0 ? activeSeasons[0].season_number : 1
  );
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [episodesList, setEpisodesList] = useState<any[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(false);

  // Fetch season episodes from TMDB
  useEffect(() => {
    if (type !== "tv") return;

    let isMounted = true;
    const fetchEpisodes = async () => {
      setIsLoadingEpisodes(true);
      try {
        const data = await getTVShowEpisodes(id, selectedSeason);
        if (isMounted) {
          if (data && data.episodes) {
            setEpisodesList(data.episodes);
          } else {
            setEpisodesList([]);
          }
        }
      } catch (error) {
        console.error("Error fetching episodes:", error);
        if (isMounted) setEpisodesList([]);
      } finally {
        if (isMounted) setIsLoadingEpisodes(false);
      }
    };

    fetchEpisodes();

    return () => {
      isMounted = false;
    };
  }, [id, selectedSeason, type]);

  // Find active season info to get the fallback episode count
  const currentSeasonInfo = activeSeasons.find(
    (s) => s.season_number === selectedSeason
  ) || activeSeasons[0];

  const episodeCount = currentSeasonInfo ? currentSeasonInfo.episode_count : 10;

  // Generate current server URL
  const currentServer = SERVERS.find((s) => s.id === selectedServer) || SERVERS[0];
  const playerUrl = currentServer.getUrl(id, type, selectedSeason, selectedEpisode);

  // Generate fallback list of episodes if API doesn't return full details
  const fallbackEpisodesArray = Array.from({ length: episodeCount }, (_, i) => i + 1);

  // Reset selected episode to 1 when changing season
  const handleSeasonChange = (seasonNum: number) => {
    setSelectedSeason(seasonNum);
    setSelectedEpisode(1);
  };

  const handleEpisodeSelect = (episodeNum: number) => {
    setSelectedEpisode(episodeNum);
    // Smooth scroll back to player
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Player Section */}
      <div className="relative">
        {/* Ambient Halo Glow */}
        {backdropPath && (
          <div
            className="absolute -inset-4 md:-inset-10 -z-10 bg-cover bg-center opacity-40 blur-[80px] md:blur-[120px] rounded-3xl scale-95 pointer-events-none transition-all duration-1000"
            style={{ backgroundImage: `url('https://image.tmdb.org/t/p/w500${backdropPath}')` }}
          />
        )}
        <section className="relative w-full aspect-video md:h-[80vh] bg-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 rounded-2xl overflow-hidden border border-white/5">
          <iframe
            key={playerUrl}
            src={playerUrl}
            className="h-full w-full"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
            frameBorder="0"
          ></iframe>

          {/* Mobile Info Overlay (Short title) */}
          <div className="absolute top-4 left-4 md:hidden z-20">
            <button
              onClick={() => router.back()}
              className="h-10 w-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 cursor-pointer"
            >
              <i className="ph-bold ph-arrow-left"></i>
            </button>
          </div>
        </section>
      </div>

      {/* Server & Episode Controls */}
      <div className="px-6 md:px-16 space-y-8">
        {/* Server Selection Row */}
        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 bg-accent rounded-full"></div>
              <h4 className="text-sm font-black italic uppercase tracking-wider text-white">
                Select Server (Try another if not working)
              </h4>
            </div>
            {/* Theater Mode Toggle */}
            <button
              onClick={() => setTheaterMode(!theaterMode)}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${theaterMode
                  ? "bg-accent/20 border-accent text-accent shadow-[0_0_15px_rgba(231,76,60,0.3)] scale-[1.02]"
                  : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-white/80"
                }`}
            >
              <i className={`ph-bold ${theaterMode ? "ph-eye-closed" : "ph-eye"} text-sm`}></i>
              {theaterMode ? "Exit Theater Mode" : "Theater Mode"}
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {SERVERS.map((server) => (
              <button
                key={server.id}
                onClick={() => setSelectedServer(server.id)}
                className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer border ${selectedServer === server.id
                  ? "bg-accent border-accent text-white shadow-lg shadow-accent/20 scale-[1.02]"
                  : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-white/70"
                  }`}
              >
                <i className="ph-fill ph-hard-drive mr-2"></i>
                {server.name}
              </button>
            ))}
          </div>
        </div>

        {/* TV Show Specific Controls (Seasons & Episodes) */}
        {type === "tv" && activeSeasons.length > 0 && (
          <div className="space-y-8">
            {/* Season Selector */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-5 w-1.5 bg-accent rounded-full"></div>
                <h4 className="text-sm font-black italic uppercase tracking-wider text-white">
                  Seasons
                </h4>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {activeSeasons.map((season) => (
                  <button
                    key={season.season_number}
                    onClick={() => handleSeasonChange(season.season_number)}
                    className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer border ${selectedSeason === season.season_number
                      ? "bg-white text-black border-white shadow-lg scale-[1.02]"
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-white/60"
                      }`}
                  >
                    {season.name || `Season ${season.season_number}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Episode Cards Grid */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-5 w-1.5 bg-accent rounded-full"></div>
                <h4 className="text-sm font-black italic uppercase tracking-wider text-white">
                  Episodes (Season {selectedSeason})
                </h4>
              </div>

              {isLoadingEpisodes ? (
                /* Skeleton Loading Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: Math.min(episodeCount, 8) }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden aspect-video relative animate-pulse flex flex-col justify-end p-4 h-[240px]"
                    >
                      <div className="absolute inset-0 bg-white/5 animate-shimmer" />
                      <div className="space-y-3 z-10 w-full">
                        <div className="h-4 bg-white/10 rounded w-2/3" />
                        <div className="h-3 bg-white/10 rounded w-full" />
                        <div className="h-3 bg-white/10 rounded w-4/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Rich Episode Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {(episodesList.length > 0
                    ? episodesList
                    : fallbackEpisodesArray.map((epNum) => ({
                      episode_number: epNum,
                      name: `Episode ${epNum}`,
                      overview: "No description available for this episode.",
                      still_path: null,
                      runtime: null,
                      air_date: null,
                    }))
                  ).map((episode) => (
                    <div
                      key={episode.episode_number}
                      onClick={() => handleEpisodeSelect(episode.episode_number)}
                      className={`group relative flex flex-col bg-white/5 border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${selectedEpisode === episode.episode_number
                          ? "border-accent ring-1 ring-accent/30 bg-accent/5 shadow-[0_0_25px_rgba(231,76,60,0.15)]"
                          : "border-white/5 hover:border-white/20 hover:bg-white/10 hover:scale-[1.02]"
                        }`}
                    >
                      {/* Card Image Wrapper */}
                      <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                        <img
                          src={
                            episode.still_path
                              ? `https://image.tmdb.org/t/p/w500${episode.still_path}`
                              : "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600"
                          }
                          alt={episode.name || `Episode ${episode.episode_number}`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Dark Overlay on hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="h-12 w-12 rounded-full bg-accent text-white flex items-center justify-center text-xl shadow-lg shadow-accent/40 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                            <i className="ph-fill ph-play"></i>
                          </div>
                        </div>

                        {/* Episode Number Badge */}
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/75 backdrop-blur-md rounded-lg text-[10px] font-black tracking-widest text-white uppercase border border-white/10">
                          Ep {episode.episode_number}
                        </div>

                        {/* Selected/Now Playing Badge */}
                        {selectedEpisode === episode.episode_number && (
                          <div className="absolute bottom-3 right-3 px-2 py-1 bg-accent rounded-lg text-[9px] font-black tracking-widest text-white uppercase shadow-lg shadow-accent/30 animate-pulse flex items-center gap-1">
                            <i className="ph-fill ph-youtube-logo"></i>
                            <span>Playing</span>
                          </div>
                        )}
                      </div>

                      {/* Card Info */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-black italic uppercase text-sm tracking-tight text-white line-clamp-1 group-hover:text-accent transition-colors duration-300">
                              {episode.episode_number}. {episode.name || `Episode ${episode.episode_number}`}
                            </h5>
                            {episode.runtime && (
                              <span className="text-[10px] font-bold text-white/45 shrink-0 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                                {episode.runtime}m
                              </span>
                            )}
                          </div>
                          {episode.overview && (
                            <p className="mt-1.5 text-xs text-white/50 line-clamp-3 font-medium leading-relaxed">
                              {episode.overview}
                            </p>
                          )}
                        </div>

                        {/* Air Date */}
                        {episode.air_date && (
                          <div className="pt-2 text-[10px] font-bold text-white/30 flex items-center gap-1.5">
                            <i className="ph ph-calendar"></i>
                            <span>
                              {new Date(episode.air_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
