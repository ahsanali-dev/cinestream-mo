import { NextResponse } from "next/server";
import { mintFreshMovieBoxToken, testMovieBoxToken, addVerifiedTokenToPool } from "@/lib/moviebox-token-server";
import { inMemoryStore } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Public Mobile App Token Auto-Resolver:
 * Mobile apps cannot read MovieBox's custom "x-user" header directly due to mobile CORS/header stripping.
 * This server endpoint extracts the fresh live token from MovieBox server-side and serves it to mobile apps automatically.
 */
export async function GET() {
  try {
    const apiBase = inMemoryStore.config.moviebox?.api_base || "https://h5-api.aoneroom.com";
    const webBase = inMemoryStore.config.moviebox?.web_base || "https://moviebox.ac";

    // 1. Check if we have an existing verified token in pool
    const existingTokens: string[] = inMemoryStore.config.moviebox?.auth_tokens || [];
    if (existingTokens.length > 0) {
      // Pick first token
      const topToken = existingTokens[0];
      return NextResponse.json(
        {
          success: true,
          token: topToken,
          source: "pool",
        },
        { headers: CORS_HEADERS }
      );
    }

    // 2. Otherwise auto-mint fresh token from MovieBox gateway
    const freshToken = await mintFreshMovieBoxToken(apiBase);
    if (freshToken) {
      const test = await testMovieBoxToken(freshToken, apiBase, webBase);
      if (test.ok) {
        await addVerifiedTokenToPool(freshToken);
      }

      return NextResponse.json(
        {
          success: true,
          token: freshToken,
          source: "minted_live",
          savedToDatabase: test.ok,
        },
        { headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to extract MovieBox token",
      },
      { status: 502, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
