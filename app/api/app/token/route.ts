import { NextRequest, NextResponse } from "next/server";
import { getOrRefreshHealthyToken } from "@/lib/moviebox-token-server";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Public Mobile App Token Auto-Resolver:
 * Mobile apps cannot read MovieBox's custom "x-user" header directly due to mobile CORS/header stripping.
 * This server endpoint extracts the fresh live token from MovieBox server-side and serves it to mobile apps automatically.
 * Supports ?force=true to explicitly force minting a brand new token if the client detected expiration.
 */
export async function GET(request: NextRequest) {
  try {
    const forceRefresh =
      request.nextUrl.searchParams.get("force") === "true" ||
      request.nextUrl.searchParams.get("force") === "1";

    const { token, source, message } = await getOrRefreshHealthyToken(forceRefresh);

    const responseHeaders = {
      ...CORS_HEADERS,
      "Cache-Control": forceRefresh
        ? "no-store, no-cache, must-revalidate"
        : "public, s-maxage=1800, stale-while-revalidate=3600",
    };

    if (token) {
      return NextResponse.json(
        {
          success: true,
          token,
          source,
          forced: forceRefresh,
          message,
        },
        { headers: responseHeaders }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: message || "Failed to extract active MovieBox token",
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
