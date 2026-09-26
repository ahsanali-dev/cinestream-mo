import { NextRequest, NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, appVersion, deviceModel, os = "android", osVersion = "14", currentScreen, streamProvider } = body;

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: "Missing deviceId" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const now = new Date();

    // 1. Update In-Memory Store
    const existing = inMemoryStore.devices.get(deviceId);
    if (existing) {
      existing.lastActiveAt = now;
      existing.currentScreen = currentScreen || existing.currentScreen;
      existing.appVersion = appVersion || existing.appVersion;
      existing.streamProvider = streamProvider || existing.streamProvider;
      existing.pingCount = (existing.pingCount || 0) + 1;
    } else {
      inMemoryStore.devices.set(deviceId, {
        deviceId,
        deviceModel: deviceModel || "Android Device",
        os,
        osVersion,
        appVersion: appVersion || "1.0.0",
        currentScreen: currentScreen || "HomeScreen",
        streamProvider: streamProvider || "moviebox",
        installedAt: now,
        lastActiveAt: now,
        pingCount: 1,
      });
    }

    // 2. Persist to MongoDB if available
    const db = await getDb();
    if (db) {
      await db.collection("devices").updateOne(
        { deviceId },
        {
          $set: {
            lastActiveAt: now,
            currentScreen: currentScreen || "HomeScreen",
            appVersion: appVersion || "1.0.0",
            streamProvider: streamProvider || "moviebox",
          },
          $setOnInsert: {
            deviceId,
            deviceModel: deviceModel || "Android Device",
            os,
            osVersion,
            installedAt: now,
          },
          $inc: { pingCount: 1 },
        },
        { upsert: true }
      );
    }

    return NextResponse.json(
      {
        success: true,
        acknowledged: true,
        isNewInstall: !existing,
        timestamp: now.toISOString(),
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("Ping error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
