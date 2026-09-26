import { NextRequest, NextResponse } from "next/server";
import { getDb, inMemoryStore, isMongoConfigured } from "@/lib/mongodb";

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
          shorts_enabled: true,
          family_filter_enabled: true,
          ...configDoc,
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

    // Persist to MongoDB if connected
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
        message: "Remote configuration updated successfully",
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
