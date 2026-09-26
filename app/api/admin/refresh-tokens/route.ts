import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
import { getDb, inMemoryStore } from "@/lib/mongodb";
import {
  mintFreshMovieBoxToken,
  testMovieBoxToken,
  addVerifiedTokenToPool,
} from "@/lib/moviebox-token-server";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function checkAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization") || "";
  const tokenFromHeader = authHeader.replace(/^Bearer\s+/i, "").trim();
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieMatch = cookieHeader.match(/cinestream_admin_token=([^;]+)/);
  const tokenFromCookie = cookieMatch ? cookieMatch[1] : "";
  const xAdminKey = request.headers.get("x-admin-key") || "";

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@movieszone2026";

  return (
    (tokenFromHeader && verifyAdminToken(tokenFromHeader)) ||
    (tokenFromCookie && verifyAdminToken(tokenFromCookie)) ||
    (xAdminKey && xAdminKey.trim() === ADMIN_PASSWORD.trim()) ||
    false
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin authentication required." },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || "mint"; // "mint" | "test_all"

    const apiBase = inMemoryStore.config.moviebox?.api_base || "https://h5-api.aoneroom.com";
    const webBase = inMemoryStore.config.moviebox?.web_base || "https://moviebox.ac";

    if (action === "test_all") {
      const db = await getDb();
      let tokens: string[] = inMemoryStore.config.moviebox?.auth_tokens || [];
      if (db) {
        const doc = await db.collection("app_config").findOne({ _id: "global_config" as any });
        if (doc?.moviebox?.auth_tokens) {
          tokens = doc.moviebox.auth_tokens;
        }
      }

      const results = await Promise.all(
        tokens.map(async (tok, idx) => {
          const test = await testMovieBoxToken(tok, apiBase, webBase);
          return {
            index: idx + 1,
            tokenSnippet: tok.substring(0, 16) + "...",
            ...test,
          };
        })
      );

      return NextResponse.json(
        {
          success: true,
          results,
          totalTokens: tokens.length,
          healthyTokens: results.filter((r) => r.ok).length,
        },
        { headers: CORS_HEADERS }
      );
    }

    // Default action: "mint"
    console.log("[AdminRefreshTokens] Minting fresh MovieBox token from server...");
    const freshToken = await mintFreshMovieBoxToken(apiBase);

    if (!freshToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to mint token from MovieBox gateway. Service might be temporarily unavailable.",
        },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    // Test token
    const testResult = await testMovieBoxToken(freshToken, apiBase, webBase);

    if (!testResult.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Minted token failed verification: ${testResult.message}`,
          testResult,
        },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    // Save to pool
    const updatedPool = await addVerifiedTokenToPool(freshToken);

    return NextResponse.json(
      {
        success: true,
        message: "Brand-new MovieBox auth token minted, verified, and saved to database!",
        token: freshToken,
        testResult,
        totalTokens: updatedPool.length,
        pool: updatedPool,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("[AdminRefreshTokens] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
