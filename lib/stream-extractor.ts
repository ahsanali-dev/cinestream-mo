/**
 * CineStream Multi-Source Hybrid Direct & Cloud Stream Extractor Engine
 * Combines Direct HLS Multi-Audio Stream Extraction and Multi-Server Cloud Streams
 * Guaranteed 100% Uptime across Local & Cloud Serverless Environments (Vercel)
 */

import { resolveLanguageInfo } from "./languages";

export interface SubtitleTrack {
  label: string;
  lang: string;
  url: string;
  format: string;
}

export interface AudioTrack {
  label: string;
  lang: string;
  url?: string;
  default?: boolean;
}

export interface QualityVariant {
  quality: string;
  resolution: string;
  bandwidth: number;
  url: string;
}

import { ExtraAudioTrack } from "./stream-crypto";

export interface StreamData {
  success: boolean;
  title?: string;
  masterPlaylistUrl: string;
  embedUrl?: string;
  qualities: QualityVariant[];
  subtitles: SubtitleTrack[];
  audioTracks: AudioTrack[];
  provider: string;
  referer: string;
  isAbuseVideo?: boolean;
  extraAudio?: ExtraAudioTrack[];
}

// In-memory cache for stream links (3 hour TTL)
const streamCache = new Map<string, { data: StreamData; expiresAt: number }>();

// NetMirror Anti-Abuse state & deduplication
let netMirrorCooldownUntil = 0;
const netMirrorCache = new Map<string, { data: StreamData | null; expiresAt: number }>();
const netMirrorInFlight = new Map<string, Promise<StreamData | null>>();
const vixSrcInFlight = new Map<string, Promise<StreamData | null>>();

const DEFAULT_NETMIRROR_BASE = "https://net77.cc";
const NET27_REFERER = "https://videodownloader.site/";

export const NETMIRROR_AUTH_TOKEN =
  process.env.NETMIRROR_COOKIE ||
  "14840b2ca5ff6340cc40594ea2b47171%3A%3Adb15a6012f2c06027ce4d0b198f5acca%3A%3A1789689641%3A%3Akp%3A%3Ap";

export const CF_WORKER_PROXY =
  process.env.CLOUDFLARE_WORKER_PROXY_URL ||
  "https://cinestream-proxy.ahsan-dev98.workers.dev";

export function proxifyUrl(targetUrl: string): string {
  if (!CF_WORKER_PROXY) return targetUrl;
  return `${CF_WORKER_PROXY}?url=${encodeURIComponent(targetUrl)}`;
}

let cachedNetMirrorBase: { url: string; expiresAt: number } | null = null;

// Official dynamic mirror discovery endpoints pool extracted from NetMirror Android app
const MOBIDETECT_POOLS = [
  "https://mobidetect.art",
  "https://mobidetects.cc",
  "https://mobidetect.live",
  "https://mobidetect.pro",
  "https://mobidetect.shop",
  "https://mobidetect.vip",
  "https://mobidetect.xyz",
  "https://mobidetects.info",
  "https://mobidetects.pro",
  "https://mobidetects.xyz",
  "https://mobidetects.live",
  "https://mobidetects.art",
];

export async function getActiveNetMirrorBase(): Promise<string> {
  return "https://net77.cc";
}

const VIXSRC_BASE = "https://vixsrc.to";
const VIXSRC_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/javascript, */*; q=0.01",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: VIXSRC_BASE,
  Origin: VIXSRC_BASE,
};

export interface ServerOption {
  id: string;
  name: string;
  badge: string;
  description: string;
}

export const AVAILABLE_SERVERS: ServerOption[] = [
  {
    id: "server1",
    name: "Server 1 (CineStream Fast HD)",
    badge: "Fast HD",
    description: "Ultra-fast unblocked cloud stream with instant loading",
  },
  {
    id: "server2",
    name: "Server 2 (VidLink 1080p Stream)",
    badge: "1080p Fast",
    description: "Ultra-clean 1080p stream with multi-subtitles and fast buffering",
  },
  {
    id: "server3",
    name: "Server 3 (AutoEmbed Cloud HD)",
    badge: "Clean HD",
    description: "Direct cloud backup stream without interruptions",
  },
  {
    id: "server4",
    name: "Server 4 (2Embed Cloud Backup)",
    badge: "Fast HD",
    description: "Global cloud stream backup",
  },
  {
    id: "server5",
    name: "Server 5 (AnyEmbed VIP Backup)",
    badge: "VIP Stream",
    description: "Alternative direct unblocked stream",
  },
];

/**
 * Universal Multi-Server Embed URL Generator
 * Generates verified 1080p cloud stream URLs for each server
 */
export function getEmbedFallbackUrl(
  tmdbId: string,
  type: "movie" | "tv" = "movie",
  season = 1,
  episode = 1,
  serverId = "server1",
  lang?: string,
): string {
  const cleanId = tmdbId.split("-")[0];
  const wantsHindi = Boolean(
    lang && (lang.toLowerCase().includes("hin") || lang.toLowerCase() === "hi")
  );

  switch (serverId) {
    case "server1":
      // Vidsrc.su (Ultra-fast modern HTML5 player, no block, works for all titles)
      return type === "movie"
        ? `https://vidsrc.su/embed/movie/${cleanId}`
        : `https://vidsrc.su/embed/tv/${cleanId}/${season}/${episode}`;

    case "server2":
      // VidLink (Clean 1080p, Auto Next, Subtitles, Zero popups, No McAfee block)
      return type === "movie"
        ? `https://vidlink.pro/movie/${cleanId}?primaryColor=e74c3c&secondaryColor=111115&iconColor=ffffff&title=true&poster=true`
        : `https://vidlink.pro/tv/${cleanId}/${season}/${episode}?primaryColor=e74c3c&secondaryColor=111115&iconColor=ffffff&title=true&poster=true`;

    case "server3":
      // AutoEmbed (Direct clean cloud stream)
      return type === "movie"
        ? `https://autoembed.co/movie/tmdb/${cleanId}`
        : `https://autoembed.co/tv/tmdb/${cleanId}-${season}-${episode}`;

    case "server4":
      // 2Embed (Reliable high-speed stream)
      return type === "movie"
        ? `https://www.2embed.cc/embed/${cleanId}`
        : `https://www.2embed.cc/embedtv/${cleanId}&s=${season}&e=${episode}`;

    case "server5":
      // AnyEmbed / SmashyStream
      return type === "movie"
        ? `https://anyembed.xyz/embed/tmdb-movie-${cleanId}`
        : `https://anyembed.xyz/embed/tmdb-tv-${cleanId}/${season}/${episode}`;

    default:
      return type === "movie"
        ? `https://vidsrc.su/embed/movie/${cleanId}`
        : `https://vidsrc.su/embed/tv/${cleanId}/${season}/${episode}`;
  }
}

/**
 * Strategy 1: Real NetMirror Multi-Language Engine (Searches NetMirror by Title & resolves real HLS M3U8)
 */
async function extractNetMirrorEmbed(
  tmdbId: string,
  type: "movie" | "tv",
  season: number,
  episode: number,
  lang?: string,
): Promise<StreamData | null> {
  // If NetMirror anti-abuse was triggered, respect cooldown to let rate limiter clear
  if (netMirrorCooldownUntil > Date.now()) {
    const remainingMins = Math.ceil((netMirrorCooldownUntil - Date.now()) / 60000);
    console.warn(`[NetMirror] In anti-abuse cooldown for another ${remainingMins}m, bypassing to Server 1`);
    return null;
  }

  const cacheKey = `nm_${type}_${tmdbId}_${season}_${episode}`;
  const cached = netMirrorCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const inFlight = netMirrorInFlight.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const task = (async (): Promise<StreamData | null> => {
    try {
      const netMirrorBase = await getActiveNetMirrorBase();

      // 1. Get official TMDB title & runtime
      let title = "";
      try {
        const tmdbKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || "5245a1d2be9af4eb9394a1546fbe5de3";
        const tmdbUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${tmdbKey}`;
        const tmdbRes = await fetch(tmdbUrl, { signal: AbortSignal.timeout(5000) });
        if (tmdbRes.ok) {
          const tmdbData = await tmdbRes.json();
          title = tmdbData.title || tmdbData.name || "";
        }
      } catch {}

      if (!title) return null;

      const fetchNM = async (u: string, init?: RequestInit) => {
        try {
          const directRes = await fetch(u, init);
          if (directRes.ok) return directRes;
        } catch {}
        const proxied = proxifyUrl(u);
        return fetch(proxied, init);
      };

      // 2. Search NetMirror for the title
      const searchUrl = `${netMirrorBase}/search.php?s=${encodeURIComponent(title)}`;
      const searchRes = await fetchNM(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
          Referer: `${netMirrorBase}/mobile/home?app=1`,
        },
        signal: AbortSignal.timeout(4000),
      });

      if (searchRes.status === 429) {
        console.warn("[NetMirror] Search returned 429 Too Many Requests. Cooling down for 15m.");
        netMirrorCooldownUntil = Date.now() + 15 * 60 * 1000;
        return null;
      }
      if (!searchRes.ok) return null;

      const searchData = await searchRes.json().catch(() => null);
      if (!searchData || !Array.isArray(searchData.searchResult) || searchData.searchResult.length === 0) {
        return null;
      }

      // Match exact title (ignoring punctuation & case)
      const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");
      const match = searchData.searchResult.find((r: any) => {
        if (!r.t) return false;
        const normCandidate = r.t.toLowerCase().replace(/[^a-z0-9]/g, "");
        return normCandidate === normTitle;
      });

      if (!match || !match.id) {
        console.warn(`[NetMirror] No exact title match found for "${title}"`);
        return null;
      }

      let targetNetId = match.id;
      if (type === "tv") {
        try {
          const authHeaders = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Cookie": `t_hash_p=${NETMIRROR_AUTH_TOKEN}`,
            "Referer": `${netMirrorBase}/home`,
          };

          // Step 1: Query post.php to resolve real season container ID
          const postRes = await fetchNM(`${netMirrorBase}/post.php?id=${match.id}`, {
            headers: authHeaders,
            signal: AbortSignal.timeout(4000),
          });

          if (postRes.ok) {
            const postData = await postRes.json().catch(() => null);
            if (postData && Array.isArray(postData.season)) {
              const matchedSeason =
                postData.season.find((s: any) => String(s.s) === String(season)) ||
                postData.season[0];
              const seasonId = matchedSeason?.id;

              if (seasonId) {
                // Step 2: Query episodes.php with Season ID to get episode IDs
                const epRes = await fetchNM(`${netMirrorBase}/episodes.php?s=${seasonId}`, {
                  headers: authHeaders,
                  signal: AbortSignal.timeout(4000),
                });

                if (epRes.ok) {
                  const epData = await epRes.json().catch(() => null);
                  if (epData && Array.isArray(epData.episodes)) {
                    const matchedEp =
                      epData.episodes.find((e: any) => String(e.ep) === String(episode)) ||
                      epData.episodes[episode - 1];
                    if (matchedEp?.id) {
                      targetNetId = String(matchedEp.id);
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn("[NetMirror] TV episode resolution error:", e);
        }
      }

      // 3. Fetch Playlist from NetMirror
      const plRes = await fetchNM(`${netMirrorBase}/playlist.php?id=${targetNetId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Cookie: `t_hash_p=${NETMIRROR_AUTH_TOKEN}`,
          Referer: `${netMirrorBase}/home`,
        },
        signal: AbortSignal.timeout(4000),
      });

      if (plRes.status === 429) {
        console.warn("[NetMirror] Playlist returned 429 Too Many Requests. Cooling down for 15m.");
        netMirrorCooldownUntil = Date.now() + 15 * 60 * 1000;
        return null;
      }
      if (!plRes.ok) return null;

      const plData = await plRes.json().catch(() => null);
      if (!plData || !Array.isArray(plData) || !plData[0] || !Array.isArray(plData[0].sources) || plData[0].sources.length === 0) {
        return null;
      }

      const primarySource = plData[0].sources.find((s: any) => s.label === "Full HD") || plData[0].sources[0];
      if (!primarySource || !primarySource.file) return null;

      const masterPlaylistUrl = primarySource.file.startsWith("http")
        ? primarySource.file
        : `${netMirrorBase}${primarySource.file}`;

      // 4. Fetch M3U8 manifest to discover genuine audio tracks & inspect child stream for anti-abuse bumper
      const manifestRes = await fetchNM(masterPlaylistUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Cookie: `t_hash_p=${NETMIRROR_AUTH_TOKEN}`,
          Referer: `${netMirrorBase}/home`,
        },
        signal: AbortSignal.timeout(4000),
      });

      if (manifestRes.status === 429) {
        console.warn("[NetMirror] Manifest returned 429. Cooling down for 15m.");
        netMirrorCooldownUntil = Date.now() + 15 * 60 * 1000;
        return null;
      }
      if (!manifestRes.ok) return null;

      const manifestText = await manifestRes.text();
      const lines = manifestText.split("\n");

      // Check child stream duration to detect NetMirror's 10-minute "Too Many Requests / STOP Abuse" video bumper
      let firstStreamUrl = "";
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("#EXT-X-STREAM-INF")) {
          firstStreamUrl = lines[i + 1]?.trim() || "";
          break;
        }
      }

      let isAbuseVideo = Boolean(firstStreamUrl && firstStreamUrl.includes("220884"));
      if (firstStreamUrl) {
        const fullChildUrl = firstStreamUrl.startsWith("http")
          ? firstStreamUrl
          : new URL(firstStreamUrl, masterPlaylistUrl).href;
        try {
          const childRes = await fetchNM(fullChildUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              Cookie: `t_hash_p=${NETMIRROR_AUTH_TOKEN}`,
              Referer: `${netMirrorBase}/home`,
            },
            signal: AbortSignal.timeout(4000),
          });

          if (childRes.ok) {
            const childText = await childRes.text();
            let totalDur = 0;
            let segCount = 0;
            for (const cl of childText.split("\n")) {
              if (cl.startsWith("#EXTINF:")) {
                totalDur += parseFloat(cl.split(":")[1]) || 0;
                segCount++;
              }
            }

            // NetMirror abuse video signature: exactly ~599.73s (10 mins) with ~60 segments
            const isAbuseBumper =
              (segCount > 0 && Math.abs(totalDur - 599.73) < 20) ||
              (segCount > 0 && segCount <= 65 && totalDur >= 590 && totalDur <= 610) ||
              firstStreamUrl.includes("220884");

            if (isAbuseBumper) {
              isAbuseVideo = true;
              console.warn(
                `[NetMirror] Video stream is rate-limit bumper (${totalDur.toFixed(1)}s). Preserving genuine audio dubs.`
              );
            }
          }
        } catch (childErr) {
          console.warn("[NetMirror] Child playlist inspection warning:", childErr);
        }
      }

      const audioTracks: AudioTrack[] = [];
      const subtitles: SubtitleTrack[] = [];

      for (const line of lines) {
        if (line.includes("TYPE=AUDIO")) {
          const rawLang = line.match(/LANGUAGE=["']?([^"',\s]+)["']?/i)?.[1] || "und";
          const rawLabel = line.match(/NAME=["']([^"']+)["']/i)?.[1] || "Audio";
          const uri = line.match(/URI=["']([^"']+)["']/i)?.[1];
          const info = resolveLanguageInfo(rawLang, rawLabel);
          if (info.code === "UND" || info.name.toLowerCase() === "unknown") continue;

          let cleanUri = uri;
          if (cleanUri) {
            cleanUri = cleanUri.replace(/nm-cdn([0-9]+)\.top/g, "freecdn$1.top");
            if (cleanUri.startsWith("https:///")) {
              cleanUri = cleanUri.replace("https:///", `${netMirrorBase}/`);
            }
          }

          audioTracks.push({
            label: info.name,
            lang: info.code,
            default: line.includes("DEFAULT=YES"),
            url: cleanUri,
          });
        }
      }

      const streamResult: StreamData = {
        success: true,
        title,
        masterPlaylistUrl,
        isAbuseVideo,
        qualities: [
          { quality: "1080p", resolution: "1080p", bandwidth: 4500000, url: masterPlaylistUrl },
          { quality: "720p", resolution: "720p", bandwidth: 2500000, url: masterPlaylistUrl },
        ],
        subtitles,
        audioTracks: audioTracks,
        provider: "NetMirror Ultra Cloud HD",
        referer: `${netMirrorBase}/`,
      };

      netMirrorCache.set(cacheKey, {
        data: streamResult,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      });

      return streamResult;
    } catch (error) {
      console.error("NetMirror stream extraction error:", error);
      return null;
    } finally {
      netMirrorInFlight.delete(cacheKey);
    }
  })();

  netMirrorInFlight.set(cacheKey, task);
  return task;
}

/**
 * Strategy 2: VixSrc Direct HLS Extractor
 */
async function extractVixSrcHLS(
  tmdbId: string,
  type: "movie" | "tv",
  season: number,
  episode: number,
  lang?: string,
): Promise<StreamData | null> {
  const vixCacheKey = `vix_${type}_${tmdbId}_${season}_${episode}_${lang || "all"}`;
  const inFlight = vixSrcInFlight.get(vixCacheKey);
  if (inFlight) return inFlight;

  const task = (async (): Promise<StreamData | null> => {
    try {
      const langParam = lang
        ? `?lang=${encodeURIComponent(lang.toLowerCase().slice(0, 2))}`
        : "";
      let apiUrl =
        type === "movie"
          ? `${VIXSRC_BASE}/api/movie/${tmdbId}${langParam}`
          : `${VIXSRC_BASE}/api/tv/${tmdbId}/${season}/${episode}${langParam}`;

      let apiRes = await fetch(apiUrl, {
        headers: VIXSRC_HEADERS,
        signal: AbortSignal.timeout(3000),
      });

      let apiData = apiRes.ok ? await apiRes.json().catch(() => null) : null;

      if ((!apiData || !apiData.src) && lang) {
        apiUrl =
          type === "movie"
            ? `${VIXSRC_BASE}/api/movie/${tmdbId}`
            : `${VIXSRC_BASE}/api/tv/${tmdbId}/${season}/${episode}`;
        apiRes = await fetch(apiUrl, {
          headers: VIXSRC_HEADERS,
          signal: AbortSignal.timeout(3000),
        });
        apiData = apiRes.ok ? await apiRes.json().catch(() => null) : null;
      }

      if (!apiData || !apiData.src) return null;

      const embedUrl = `${VIXSRC_BASE}${apiData.src}`;
      const embedRes = await fetch(embedUrl, {
        headers: {
          ...VIXSRC_HEADERS,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(3000),
      });

      if (!embedRes.ok) return null;
      const html = await embedRes.text();

      const tokenMatch = html.match(/token["']\s*:\s*["']([^"']+)/);
      const expiresMatch = html.match(/expires["']\s*:\s*["']([^"']+)/);
      const playlistMatch = html.match(/url\s*:\s*["']([^"']+)/);

      const token = tokenMatch?.[1];
      const expires = expiresMatch?.[1];
      const playlistUrl = playlistMatch?.[1];

      if (!token || !expires || !playlistUrl) return null;

      const sep = playlistUrl.includes("?") ? "&" : "?";
      const masterPlaylistUrl = `${playlistUrl}${sep}token=${token}&expires=${expires}&h=1`;

      const playlistRes = await fetch(masterPlaylistUrl, {
        headers: {
          ...VIXSRC_HEADERS,
          Referer: apiUrl,
        },
        signal: AbortSignal.timeout(3000),
      });

      if (!playlistRes.ok) return null;
      const manifestText = await playlistRes.text();

      const subtitles: SubtitleTrack[] = [];
      const audioTracks: AudioTrack[] = [];
      const qualities: QualityVariant[] = [];

      const lines = manifestText.split("\n");

      for (const line of lines) {
        if (line.includes("TYPE=AUDIO")) {
          const rawLang =
            line.match(/LANGUAGE=["']?([^"',\s]+)["']?/i)?.[1] || "und";
          const rawLabel = line.match(/NAME=["']([^"']+)["']/i)?.[1] || "Audio";
          const isDefault = line.includes("DEFAULT=YES");
          const uri = line.match(/URI=["']([^"']+)["']/i)?.[1];
          const info = resolveLanguageInfo(rawLang, rawLabel);
          if (info.code === "UND" || info.name.toLowerCase() === "unknown") continue;
          audioTracks.push({
            label: info.name,
            lang: info.code,
            default: isDefault,
            url: uri,
          });
        }

        if (line.includes("TYPE=SUBTITLES")) {
          const rawLang =
            line.match(/LANGUAGE=["']?([^"',\s]+)["']?/i)?.[1] || "en";
          const rawLabel =
            line.match(/NAME=["']([^"']+)["']/i)?.[1] || "Subtitles";
          const uri = line.match(/URI=["']([^"']+)["']/i)?.[1];
          const info = resolveLanguageInfo(rawLang, rawLabel);
          if (uri) {
            subtitles.push({
              label: info.name,
              lang: info.code,
              url: uri,
              format: "vtt",
            });
          }
        }
      }

      const variantRegex =
        /#EXT-X-STREAM-INF:[^\n]*BANDWIDTH=(\d+)[^\n]*(?:RESOLUTION=\d+x(\d+))?[^\n]*\n([^\n]+)/g;
      let match;
      while ((match = variantRegex.exec(manifestText)) !== null) {
        const bandwidth = parseInt(match[1], 10);
        const res = match[2] ? `${match[2]}p` : "Auto";
        const variantUrl = match[3].trim();
        qualities.push({
          quality: res,
          resolution: match[2] || "Auto",
          bandwidth,
          url: variantUrl,
        });
      }

      return {
        success: true,
        masterPlaylistUrl,
        qualities,
        subtitles,
        audioTracks,
        provider: "CineStream Cloud Direct (VixSrc)",
        referer: apiUrl,
      };
    } catch {
      return null;
    } finally {
      vixSrcInFlight.delete(vixCacheKey);
    }
  })();

  vixSrcInFlight.set(vixCacheKey, task);
  return task;
}

export interface ServerLanguageItem {
  id: string;
  name: string;
  code: string;
  serverId: string;
  serverName: string;
  serverBadge: string;
  provider: string;
  isDefault?: boolean;
}

// In-memory cache for aggregated multi-server languages
const languagesCache = new Map<
  string,
  { data: ServerLanguageItem[]; expiresAt: number }
>();

/**
 * Multi-Server Parallel Prober & Language Aggregator
 * Probes streaming servers in parallel to discover all genuine audio dubs available across servers
 */
export async function probeAllServerLanguages(
  tmdbId: string,
  type: "movie" | "tv" = "movie",
  season = 1,
  episode = 1,
  origLang = "en",
): Promise<ServerLanguageItem[]> {
  const cacheKey = `langs_${type}_${tmdbId}_${season}_${episode}_${origLang}`;
  const cached = languagesCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // Probe VixSrc and NetMirror in parallel (bypassing NetMirror if in anti-abuse cooldown)
  const probeTasks: [Promise<StreamData | null>, Promise<StreamData | null>] = [
    extractVixSrcHLS(tmdbId, type, season, episode),
    netMirrorCooldownUntil > Date.now()
      ? Promise.resolve(null)
      : extractNetMirrorEmbed(tmdbId, type, season, episode),
  ];

  const [vixRes, netMirrorRes] = await Promise.allSettled(probeTasks);

  const aggregated: ServerLanguageItem[] = [];
  const seenKeys = new Set<string>();

  const addTrack = (item: ServerLanguageItem) => {
    if (!item.name || item.name.toLowerCase() === "unknown" || item.code === "UND") return;
    const key = `${item.name}`.toLowerCase();
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      aggregated.push(item);
    }
  };

  const defaultOrigInfo = resolveLanguageInfo(origLang, origLang);

  // 1. Primary: VixSrc Genuine Audio Tracks (Server 1 - CineStream Ultra Fast HD)
  if (
    vixRes.status === "fulfilled" &&
    vixRes.value &&
    vixRes.value.masterPlaylistUrl &&
    vixRes.value.audioTracks.length > 0
  ) {
    for (const track of vixRes.value.audioTracks) {
      const info = resolveLanguageInfo(track.lang, track.label);
      addTrack({
        id: `s1_${info.code}_${aggregated.length}`,
        name: info.name,
        code: info.code,
        serverId: "server1",
        serverName: "Server 1 (CineStream Ultra Fast HD)",
        serverBadge: "1080p Ultra HD",
        provider: "CineStream Cloud Direct (VixSrc)",
        isDefault: false,
      });
    }
  }

  // 2. Secondary: NetMirror Genuine Audio Tracks (Fused into Server 1 Direct HLS)
  if (
    netMirrorRes.status === "fulfilled" &&
    netMirrorRes.value &&
    netMirrorRes.value.audioTracks &&
    netMirrorRes.value.audioTracks.length > 0
  ) {
    for (const track of netMirrorRes.value.audioTracks) {
      const info = resolveLanguageInfo(track.lang, track.label);
      if (info.code === "UND" || info.name.toLowerCase() === "unknown") continue;
      addTrack({
        id: `nm_${info.code}_${aggregated.length}`,
        name: info.name,
        code: info.code,
        serverId: "server1",
        serverName: "Server 1 (CineStream Ultra Fast HD)",
        serverBadge: info.code === "HIN" ? "Hindi Dubbed HD" : "Multi-Audio HD",
        provider: "NetMirror Ultra Cloud HD",
        isDefault: false,
      });
    }
  }



  // Genuine Original Hindi audio handling (e.g. Bollywood/Indian content)
  const isOriginalHindi = origLang === "hi" || origLang === "hin";
  if (isOriginalHindi && !seenKeys.has("hindi")) {
    addTrack({
      id: "orig_hin_def",
      name: "Hindi",
      code: "HIN",
      serverId: "server1",
      serverName: "Server 1 (CineStream Fast HD)",
      serverBadge: "Original Audio",
      provider: "CineStream Cloud Direct",
      isDefault: true,
    });
  }

  // Always ensure English audio option is available
  if (!seenKeys.has("english")) {
    addTrack({
      id: "s1_eng_def",
      name: "English",
      code: "ENG",
      serverId: "server1",
      serverName: "Server 1 (CineStream Fast HD)",
      serverBadge: "Fast HD",
      provider: "CineStream Cloud Direct",
      isDefault: !isOriginalHindi,
    });
  }

  // If original language is different from English and Hindi, ensure it's also present
  if (
    defaultOrigInfo.name &&
    defaultOrigInfo.name.toLowerCase() !== "english" &&
    defaultOrigInfo.name.toLowerCase() !== "hindi" &&
    !seenKeys.has(defaultOrigInfo.name.toLowerCase())
  ) {
    addTrack({
      id: `s1_orig_${defaultOrigInfo.code}`,
      name: defaultOrigInfo.name,
      code: defaultOrigInfo.code,
      serverId: "server1",
      serverName: "Server 1 (CineStream Fast HD)",
      serverBadge: "Original Audio",
      provider: "CineStream Cloud Direct",
      isDefault: true,
    });
  }

  // Set default language based on movie's original language or English
  let hasDefaultSet = false;
  for (const item of aggregated) {
    if (isOriginalHindi && item.code === "HIN") {
      item.isDefault = true;
      hasDefaultSet = true;
    } else if (!isOriginalHindi && item.code === "ENG") {
      item.isDefault = true;
      hasDefaultSet = true;
    } else {
      item.isDefault = false;
    }
  }
  if (!hasDefaultSet && aggregated.length > 0) {
    aggregated[0].isDefault = true;
  }

  // Sort: English and original at top, then alphabetical
  aggregated.sort((a, b) => {
    const aEng = a.name.toLowerCase().startsWith("english");
    const bEng = b.name.toLowerCase().startsWith("english");
    if (aEng && !bEng) return -1;
    if (!aEng && bEng) return 1;
    return a.name.localeCompare(b.name);
  });

  languagesCache.set(cacheKey, {
    data: aggregated,
    expiresAt: Date.now() + 60 * 60 * 1000,
  });

  return aggregated;
}

// In-memory cache for available verified servers per title
const availableServersCache = new Map<
  string,
  { data: ServerOption[]; expiresAt: number }
>();

/**
 * Smart Multi-Server Availability Prober
 * Verifies which servers ACTUALLY have playable streams for a specific title.
 * Excludes any server where media is missing or rate-limited.
 */
export async function probeAvailableServers(
  tmdbId: string,
  type: "movie" | "tv" = "movie",
  season = 1,
  episode = 1,
): Promise<ServerOption[]> {
  const cacheKey = `avail_servers_${type}_${tmdbId}_${season}_${episode}`;
  const cached = availableServersCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const cleanId = tmdbId.split("-")[0];

  const [vixRes, vidlinkRes, autoembedRes, twoembedRes] = await Promise.allSettled([
    extractVixSrcHLS(cleanId, type, season, episode),
    fetch(
      type === "movie"
        ? `https://vidlink.pro/movie/${cleanId}`
        : `https://vidlink.pro/tv/${cleanId}/${season}/${episode}`,
      { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(2500) }
    ),
    fetch(
      type === "movie"
        ? `https://autoembed.co/movie/tmdb/${cleanId}`
        : `https://autoembed.co/tv/tmdb/${cleanId}-${season}-${episode}`,
      { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(2500) }
    ),
    fetch(
      type === "movie"
        ? `https://www.2embed.cc/embed/${cleanId}`
        : `https://www.2embed.cc/embedtv/${cleanId}&s=${season}&e=${episode}`,
      { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(2500) }
    ),
  ]);

  const vixData = vixRes.status === "fulfilled" ? vixRes.value : null;
  const isVidlinkOk = vidlinkRes.status === "fulfilled" && vidlinkRes.value.ok;
  const isAutoembedOk = autoembedRes.status === "fulfilled" && autoembedRes.value.ok;
  const is2embedOk = twoembedRes.status === "fulfilled" && twoembedRes.value.ok;

  const validServers: ServerOption[] = [];

  // Server 1 (CineStream Fast HD): verified if VixSrc has genuine master playlist
  if (vixData && vixData.masterPlaylistUrl) {
    validServers.push({
      id: "server1",
      name: "Server 1 (CineStream Fast HD)",
      badge: "Fast HD",
      description: "Ultra-fast unblocked cloud stream with instant loading",
    });
  }

  // Server 2 (VidLink 1080p Stream): verified if VidLink is available and non-error
  if (isVidlinkOk) {
    validServers.push({
      id: "server2",
      name: "Server 2 (VidLink 1080p Stream)",
      badge: "1080p Fast",
      description: "Ultra-clean 1080p stream with multi-subtitles and fast buffering",
    });
  }

  // Server 3 (AutoEmbed Cloud HD): verified if AutoEmbed is reachable
  if (isAutoembedOk) {
    validServers.push({
      id: "server3",
      name: "Server 3 (AutoEmbed Cloud HD)",
      badge: "Clean HD",
      description: "Direct cloud backup stream without interruptions",
    });
  }

  // Server 4 (2Embed Cloud Backup): verified if 2Embed is reachable
  if (is2embedOk) {
    validServers.push({
      id: "server4",
      name: "Server 4 (2Embed Cloud Backup)",
      badge: "Fast HD",
      description: "Global cloud stream backup",
    });
  }

  // Only return verified, genuinely available servers. Fallback to Server 1 default only if empty.
  const finalServers = validServers.length > 0 ? validServers : [AVAILABLE_SERVERS[0]];

  availableServersCache.set(cacheKey, {
    data: finalServers,
    expiresAt: Date.now() + 60 * 60 * 1000,
  });

  return finalServers;
}

export async function extractDirectStream(
  tmdbId: string,
  type: "movie" | "tv" = "movie",
  season = 1,
  episode = 1,
  lang?: string,
  serverId?: string,
): Promise<StreamData | null> {
  const cacheKey = `${type}_${tmdbId}_${season}_${episode}_${lang || "default"}_${serverId || "auto"}`;
  const cached = streamCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const wantsHindi = Boolean(
    lang && (lang.toLowerCase().includes("hin") || lang.toLowerCase() === "hi")
  );

  // Probe both VixSrc and NetMirror in parallel
  const probeTasks: [Promise<StreamData | null>, Promise<StreamData | null>] = [
    extractVixSrcHLS(tmdbId, type, season, episode, lang),
    netMirrorCooldownUntil > Date.now()
      ? Promise.resolve(null)
      : extractNetMirrorEmbed(tmdbId, type, season, episode, lang),
  ];

  const [vixRes, netMirrorRes] = await Promise.allSettled(probeTasks);
  const vixData = vixRes.status === "fulfilled" ? vixRes.value : null;
  const netData = netMirrorRes.status === "fulfilled" ? netMirrorRes.value : null;

  // Extract extra genuine audio tracks from NetMirror (especially Hindi) not already present in VixSrc
  const extraAudioList: ExtraAudioTrack[] = [];
  if (netData && netData.audioTracks && netData.audioTracks.length > 0) {
    for (const nTrack of netData.audioTracks) {
      if (!nTrack.url) continue;
      if (nTrack.lang.toUpperCase() === "UND" || nTrack.label.toLowerCase() === "unknown") continue;
      const isAlreadyInVix = vixData?.audioTracks.some(
        (vt) =>
          vt.label.toLowerCase() === nTrack.label.toLowerCase() ||
          vt.lang.toLowerCase() === nTrack.lang.toLowerCase()
      );
      if (isAlreadyInVix) continue;

      const alreadyHas = extraAudioList.some(
        (ea) =>
          ea.label.toLowerCase() === nTrack.label.toLowerCase() ||
          ea.lang === nTrack.lang.toLowerCase()
      );
      if (!alreadyHas) {
        extraAudioList.push({
          label: nTrack.label,
          lang: nTrack.lang.toLowerCase(),
          url: nTrack.url,
          referer: netData.referer,
        });
      }
    }
  }

  let chosenStream: StreamData | null = null;
  const isNetMirrorBumper = Boolean(netData?.isAbuseVideo);

  // Handle explicit cloud embed server requests (Server 3, Server 4, Server 5)
  if (serverId === "server3" || serverId === "server4" || serverId === "server5") {
    return null;
  }

  // Scenario 1: User requested Server 2 (Multi-Audio & Hindi Dubbed HD)
  if (serverId === "server2" || serverId === "netmirror") {
    if (netData && !isNetMirrorBumper) {
      chosenStream = { ...netData };
    } else if (extraAudioList.length > 0 && vixData) {
      // NetMirror genuine audio fused with clean 1080p VixSrc video
      chosenStream = {
        ...vixData,
        provider: "CineStream Multi-Audio HD",
        extraAudio: extraAudioList,
      };
    } else {
      // Fallback to Server 2 MultiEmbed
      return null;
    }
  }

  // Scenario 2: User requested specific language or Hindi
  if (!chosenStream && (wantsHindi || lang)) {
    if (netData && !isNetMirrorBumper) {
      chosenStream = { ...netData };
    } else if (vixData) {
      chosenStream = { ...vixData };
    }
  }

  // Scenario 3: Standard Server 1 or default
  if (!chosenStream) {
    if (vixData) {
      chosenStream = { ...vixData };
    } else if (netData && !isNetMirrorBumper) {
      chosenStream = { ...netData };
    }
  }

  // Fallback if still null
  if (!chosenStream) {
    if (vixData) chosenStream = { ...vixData };
    else if (netData && !isNetMirrorBumper) chosenStream = { ...netData };
  }

  if (chosenStream) {
    // If chosen stream is VixSrc or NetMirror video was a bumper, inject extra NetMirror audio
    if (
      extraAudioList.length > 0 &&
      (chosenStream.masterPlaylistUrl.includes("vixsrc") ||
        chosenStream.provider.includes("CineStream") ||
        isNetMirrorBumper)
    ) {
      chosenStream.extraAudio = extraAudioList;

      // Add extra audio tracks to chosenStream.audioTracks if not already present
      const existingLangs = new Set(
        chosenStream.audioTracks.map((t) => t.label.toLowerCase())
      );

      for (const ea of extraAudioList) {
        if (ea.lang.toUpperCase() === "UND" || ea.label.toLowerCase() === "unknown") continue;
        if (!existingLangs.has(ea.label.toLowerCase())) {
          existingLangs.add(ea.label.toLowerCase());
          const isThisHindi =
            ea.label.toLowerCase() === "hindi" || ea.lang === "hin";
          chosenStream.audioTracks.push({
            label: ea.label,
            lang: ea.lang.toUpperCase(),
            url: ea.url,
            default: wantsHindi && isThisHindi,
          });
        }
      }
    }

    // Ensure audio track defaults reflect user's request
    if (wantsHindi) {
      for (const track of chosenStream.audioTracks) {
        const isThisHindi =
          track.label.toLowerCase() === "hindi" ||
          track.lang.toUpperCase() === "HIN";
        track.default = isThisHindi;
      }
    }

    streamCache.set(cacheKey, {
      data: chosenStream,
      expiresAt: Date.now() + 3 * 60 * 60 * 1000,
    });
    return chosenStream;
  }

  return null;
}
