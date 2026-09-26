import { NextRequest, NextResponse } from "next/server";
import { getDb, inMemoryStore, isMongoConfigured } from "@/lib/mongodb";
import { verifyAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  try {
    const db = await getDb();
    if (db) {
      const configDoc = await db.collection("app_config").findOne({ _id: "global_config" as any });
      if (configDoc) {
        const mergedConfig = {
          ...inMemoryStore.config,
          ...configDoc,
          netmirror: {
            ...inMemoryStore.config.netmirror,
            ...(configDoc.netmirror || {}),
          },
          moviebox: {
            ...inMemoryStore.config.moviebox,
            ...(configDoc.moviebox || {}),
            auth_tokens:
              Array.isArray(configDoc.moviebox?.auth_tokens) && configDoc.moviebox.auth_tokens.length > 0
                ? configDoc.moviebox.auth_tokens
                : inMemoryStore.config.moviebox.auth_tokens,
            web_base:
              configDoc.moviebox?.web_base ||
              inMemoryStore.config.moviebox?.web_base ||
              "https://moviebox.ac",
          },
          shorts_enabled: configDoc.shorts_enabled !== false,
          family_filter_enabled: configDoc.family_filter_enabled !== false,
          maintenance: {
            enabled: Boolean(configDoc.maintenance?.enabled),
            title: configDoc.maintenance?.title || inMemoryStore.config.maintenance?.title || "Site & App Under Maintenance",
            message: configDoc.maintenance?.message || inMemoryStore.config.maintenance?.message || "Our servers are currently undergoing scheduled maintenance and upgrades. MoviesZone will be back online shortly!",
            back_online_time: configDoc.maintenance?.back_online_time || inMemoryStore.config.maintenance?.back_online_time || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        };
        return NextResponse.json(
          {
            success: true,
            source: "mongodb",
            config: mergedConfig,
          },
          { headers: CORS_HEADERS }
        );
      }
    }

    // Fallback to in-memory store
    return NextResponse.json(
      {
        success: true,
        source: isMongoConfigured() ? "mongodb_empty" : "in_memory",
        config: inMemoryStore.config,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("Config GET error:", err);
    return NextResponse.json(
      {
        success: true,
        source: "fallback",
        config: inMemoryStore.config,
        error: err.message,
      },
      { headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const tokenFromHeader = authHeader.replace(/^Bearer\s+/i, "").trim();
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(/cinestream_admin_token=([^;]+)/);
    const tokenFromCookie = cookieMatch ? cookieMatch[1] : "";
    const xAdminKey = request.headers.get("x-admin-key") || "";

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@movieszone2026";
    const isAuthorized =
      (tokenFromHeader && verifyAdminToken(tokenFromHeader)) ||
      (tokenFromCookie && verifyAdminToken(tokenFromCookie)) ||
      (xAdminKey && xAdminKey.trim() === ADMIN_PASSWORD.trim());

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin authentication required." },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid configuration payload" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const updatedConfig = {
      ...inMemoryStore.config,
      ...body,
      _id: "global_config",
      updated_at: new Date().toISOString(),
    };

    // Update in-memory store
    inMemoryStore.config = updatedConfig;

    // Persist directly to MongoDB Atlas
    const db = await getDb();
    if (db) {
      await db.collection("app_config").updateOne(
        { _id: "global_config" as any },
        { $set: updatedConfig },
        { upsert: true }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Remote configuration saved to MongoDB and broadcasted successfully",
        config: updatedConfig,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("Config POST error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
