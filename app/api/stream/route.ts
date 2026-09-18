import { NextRequest, NextResponse } from "next/server";
import {
  extractDirectStream,
  probeAllServerLanguages,
  probeAvailableServers,
  getEmbedFallbackUrl,
  AVAILABLE_SERVERS,
} from "@/lib/stream-extractor";
import { encryptStreamUrl } from "@/lib/stream-crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Range, X-Requested-With",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = (searchParams.get("type") || "movie") as "movie" | "tv";
  const season = parseInt(searchParams.get("season") || "1", 10);
  const episode = parseInt(searchParams.get("episode") || "1", 10);
  const lang = searchParams.get("lang") || undefined;
  const server = searchParams.get("server") || "server1";
  const origLang = searchParams.get("origLang") || "en";

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing id parameter" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // Clean ID if slug format was passed (e.g. "550-fight-club")
  const numericId = id.split("-")[0];
  const fallbackEmbedUrl = getEmbedFallbackUrl(
    numericId,
    type,
    season,
    episode,
    server,
    lang,
  );

  try {
    // Run stream extraction for requested server & probe all server languages and verified servers in parallel
    const [streamData, availableLanguages, availableServers] = await Promise.all([
      extractDirectStream(numericId, type, season, episode, lang, server),
      probeAllServerLanguages(numericId, type, season, episode, origLang),
      probeAvailableServers(numericId, type, season, episode),
    ]);

    if (!streamData || !streamData.masterPlaylistUrl) {
      return NextResponse.json(
        {
          success: true,
          error: null,
          streamUrl: null,
          embedUrl: fallbackEmbedUrl,
          format: "embed",
          qualities: [],
          subtitles: [],
          audioTracks: [],
          currentServer: server,
          provider: "CineStream Ultra Cloud Stream",
          availableServers:
            availableServers && availableServers.length > 0
              ? availableServers
              : AVAILABLE_SERVERS,
          availableLanguages:
            availableLanguages && availableLanguages.length > 0
              ? availableLanguages
              : [],
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
            ...CORS_HEADERS,
          },
        },
      );
    }

    const isMp4 = Boolean(
      streamData.masterPlaylistUrl.includes(".mp4") &&
        !streamData.masterPlaylistUrl.includes(".m3u8")
    );


    const encryptedMasterToken = encryptStreamUrl(
      streamData.masterPlaylistUrl,
      streamData.referer,
      streamData.extraAudio,
    );
    const langSuffix = lang ? `&lang=${encodeURIComponent(lang)}` : "";
    const finalStreamUrl = `/api/stream/proxy?d=${encryptedMasterToken}${langSuffix}`;

    // All streams route through proxy to inject correct upstream Referer headers
    const proxiedSubtitles = streamData.subtitles.map((sub) => ({
      ...sub,
      url: `/api/stream/proxy?d=${encryptStreamUrl(sub.url, streamData.referer)}`,
    }));

    const proxiedAudioTracks = streamData.audioTracks.map((audio) => {
      const matchingExtra = streamData.extraAudio?.find(
        (ea) =>
          ea.url === audio.url ||
          ea.label.toLowerCase() === audio.label.toLowerCase() ||
          ea.lang === audio.lang.toLowerCase(),
      );
      const trackReferer = matchingExtra?.referer || streamData.referer;
      return {
        ...audio,
        url: audio.url
          ? `/api/stream/proxy?d=${encryptStreamUrl(audio.url, trackReferer)}`
          : undefined,
      };
    });

    return NextResponse.json(
      {
        success: true,
        streamUrl: finalStreamUrl,
        embedUrl: fallbackEmbedUrl,
        format: isMp4 ? "mp4" : "hls",
        qualities: streamData.qualities.map((q) => ({
          quality: q.quality,
          resolution: q.resolution,
          bandwidth: q.bandwidth,
        })),
        subtitles: proxiedSubtitles,
        audioTracks: proxiedAudioTracks,
        provider: streamData.provider || "CineStream Ultra Cloud",
        currentServer: server,
        availableServers:
          availableServers && availableServers.length > 0
            ? availableServers
            : [
                {
                  id: server,
                  name: streamData.provider || "Server 1",
                  badge: "1080p Ultra HD",
                  description: "Direct stream",
                },
              ],
        availableLanguages,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          ...CORS_HEADERS,
        },
      },
    );
  } catch (error) {
    console.error("Stream API route error:", error);
    return NextResponse.json(
      {
        success: true,
        error: null,
        streamUrl: null,
        embedUrl: fallbackEmbedUrl,
        format: "embed",
        qualities: [],
        subtitles: [],
        audioTracks: [],
        provider: "CineStream Cloud Stream",
        currentServer: server,
        availableServers: AVAILABLE_SERVERS,
        availableLanguages: [],
      },
      { status: 200, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
