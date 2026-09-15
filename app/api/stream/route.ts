import { NextRequest, NextResponse } from "next/server";
import {
  extractDirectStream,
  probeAllServerLanguages,
  AVAILABLE_SERVERS,
} from "@/lib/stream-extractor";
import { encryptStreamUrl } from "@/lib/stream-crypto";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Range, X-Requested-With",
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
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Clean ID if slug format was passed (e.g. "550-fight-club")
  const numericId = id.split("-")[0];

  try {
    // Run stream extraction for requested server & probe all server languages in parallel
    const [streamData, availableLanguages] = await Promise.all([
      extractDirectStream(numericId, type, season, episode, lang, server),
      probeAllServerLanguages(numericId, type, season, episode, origLang),
    ]);

    if (!streamData || !streamData.masterPlaylistUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Direct HLS stream currently unavailable for this title on selected server",
          availableServers: AVAILABLE_SERVERS,
          availableLanguages,
        },
        { headers: CORS_HEADERS }
      );
    }

    const encryptedMasterToken = encryptStreamUrl(
      streamData.masterPlaylistUrl,
      streamData.referer
    );
    const proxiedMasterUrl = `/api/stream/proxy?d=${encryptedMasterToken}`;

    const proxiedSubtitles = streamData.subtitles.map((sub) => ({
      ...sub,
      url: `/api/stream/proxy?d=${encryptStreamUrl(sub.url, streamData.referer)}`,
    }));

    const proxiedAudioTracks = streamData.audioTracks.map((audio) => ({
      ...audio,
      url: audio.url
        ? `/api/stream/proxy?d=${encryptStreamUrl(audio.url, streamData.referer)}`
        : undefined,
    }));

    const isMp4 = Boolean(
      streamData.masterPlaylistUrl.includes(".mp4") ||
      streamData.provider?.toLowerCase().includes("netmirror")
    );

    return NextResponse.json(
      {
        success: true,
        streamUrl: proxiedMasterUrl,
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
        availableServers: AVAILABLE_SERVERS,
        availableLanguages,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=1800, s-maxage=3600",
          ...CORS_HEADERS,
        },
      }
    );
  } catch (error) {
    console.error("Stream API route error:", error);
    return NextResponse.json(
      { success: false, error: "Internal stream resolution error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

