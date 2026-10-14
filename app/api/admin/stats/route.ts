import { NextResponse } from "next/server";
import { getDb, inMemoryStore, isMongoConfigured } from "@/lib/mongodb";
import { verifyAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

let cachedStatsPayload: any = null;
let cachedStatsAt = 0;

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const tokenFromHeader = authHeader.replace(/^Bearer\s+/i, "").trim();
    const cookieHeader = req.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(/cinestream_admin_token=([^;]+)/);
    const tokenFromCookie = cookieMatch ? cookieMatch[1] : "";
    const xAdminKey = req.headers.get("x-admin-key") || "";

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@movieszone2026";
    const isAuthorized =
      (tokenFromHeader && verifyAdminToken(tokenFromHeader)) ||
      (tokenFromCookie && verifyAdminToken(tokenFromCookie)) ||
      (xAdminKey && xAdminKey.trim() === ADMIN_PASSWORD.trim());

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized access. Admin authentication required." },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const now = Date.now();

    // Fast return cached stats if computed within last 30 seconds
    if (cachedStatsPayload && now - cachedStatsAt < 30 * 1000) {
      return NextResponse.json(
        { success: true, stats: cachedStatsPayload, cached: true },
        { headers: CORS_HEADERS }
      );
    }

    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now - 7 * 86400 * 1000);

    const db = await getDb();

    let allDevices: any[] = [];
    let isConnectedToMongo = false;

    if (db) {
      try {
        allDevices = await db
          .collection("devices")
          .find(
            {},
            {
              projection: {
                deviceId: 1,
                deviceModel: 1,
                os: 1,
                osVersion: 1,
                lastActiveAt: 1,
                installedAt: 1,
                currentScreen: 1,
                pingCount: 1,
              },
            }
          )
          .sort({ lastActiveAt: -1 })
          .limit(1000)
          .toArray();
        isConnectedToMongo = true;
      } catch (e) {
        console.warn("MongoDB query failed, falling back to inMemoryStore:", e);
        allDevices = Array.from(inMemoryStore.devices.values());
      }
    } else {
      allDevices = Array.from(inMemoryStore.devices.values());
    }

    const totalInstalls = allDevices.length;
    let liveUsers = 0;
    let todayActive = 0;
    let weeklyActive = 0;

    const brandCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};
    const hourlyCounts = new Array(24).fill(0);
    const dailyInstallCounts: Record<string, number> = {};

    // Initialize last 7 days in dailyInstallCounts
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400 * 1000);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyInstallCounts[key] = 0;
    }

    allDevices.forEach((device) => {
      const lastActive = new Date(device.lastActiveAt);
      const installed = new Date(device.installedAt);

      if (lastActive >= fiveMinutesAgo) {
        liveUsers++;
      }
      if (lastActive >= startOfToday) {
        todayActive++;
      }
      if (lastActive >= sevenDaysAgo) {
        weeklyActive++;
      }

      // Hourly distribution
      const hour = lastActive.getHours();
      if (!isNaN(hour)) {
        hourlyCounts[hour]++;
      }

      // Brand distribution
      const rawBrand = (device.deviceModel || "Unknown").split(" ")[0];
      brandCounts[rawBrand] = (brandCounts[rawBrand] || 0) + 1;

      // OS distribution
      const os = (device.os || "Android").toLowerCase();
      osCounts[os] = (osCounts[os] || 0) + 1;

      // Daily installs
      const installKey = installed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dailyInstallCounts[installKey] !== undefined) {
        dailyInstallCounts[installKey]++;
      }
    });

    // Format top brands
    const sortedBrands = Object.entries(brandCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Format daily trend
    const installTrend = Object.entries(dailyInstallCounts).map(([date, count]) => ({
      date,
      installs: count,
    }));

    // Format hourly timeline (Current hour at end)
    const currentHour = new Date().getHours();
    const activityTimeline = [];
    for (let i = 23; i >= 0; i--) {
      const h = (currentHour - i + 24) % 24;
      const label = `${h.toString().padStart(2, "0")}:00`;
      activityTimeline.push({
        time: label,
        active: hourlyCounts[h],
      });
    }

    // Map legacy Android SDK / API versions to user-friendly Android versions
    const ANDROID_API_MAP: Record<string, string> = {
      "21": "Android 5.0",
      "22": "Android 5.1",
      "23": "Android 6.0",
      "24": "Android 7.0",
      "25": "Android 7.1",
      "26": "Android 8.0",
      "27": "Android 8.1",
      "28": "Android 9 (Pie)",
      "29": "Android 10",
      "30": "Android 11",
      "31": "Android 12",
      "32": "Android 12L",
      "33": "Android 13",
      "34": "Android 14",
      "35": "Android 15",
      "36": "Android 16",
      "37": "Android 17",
    };

    const formatDeviceModel = (model?: string, osVersion?: string): string => {
      if (!model) return "Android Device";
      const clean = model.trim();
      // Handle legacy placeholder strings from older app builds stored in MongoDB Atlas
      const match = clean.match(/Android Phone \((\d+)\)/i);
      if (match) {
        const api = match[1];
        const friendlyName = ANDROID_API_MAP[api] || `API ${api}`;
        return `Android Device (${friendlyName})`;
      }
      if (clean.includes("iOS Device")) return "Apple iPhone";
      return clean;
    };

    const formatOS = (os?: string, osVersion?: string): string => {
      const osName = (os || "Android").toLowerCase();
      if (osName === "android") {
        if (osVersion && ANDROID_API_MAP[osVersion]) {
          return ANDROID_API_MAP[osVersion];
        }
        if (osVersion && !isNaN(Number(osVersion)) && Number(osVersion) >= 20) {
          return ANDROID_API_MAP[osVersion] || `Android API ${osVersion}`;
        }
        return `Android ${osVersion || "14"}`;
      }
      if (osName === "ios") return `iOS ${osVersion || "17"}`;
      return `${os || "Android"} ${osVersion || ""}`.trim();
    };

    // Recent connected devices (Top 50 sorted by last active)
    const recentDevices = [...allDevices]
      .sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime())
      .slice(0, 50)
      .map((d) => {
        const lastActive = new Date(d.lastActiveAt);
        const isLive = lastActive >= fiveMinutesAgo;
        return {
          deviceId: d.deviceId,
          deviceModel: formatDeviceModel(d.deviceModel, d.osVersion),
          os: formatOS(d.os, d.osVersion),
          appVersion: d.appVersion || "1.0.0",
          currentScreen: d.currentScreen || "HomeScreen",
          lastActiveAt: d.lastActiveAt,
          status: isLive ? "online" : "offline",
          pingCount: d.pingCount || 1,
        };
      });

    const statsPayload = {
      totalInstalls,
      liveUsers,
      todayActive,
      weeklyActive,
      activityTimeline,
      installTrend,
      deviceBrands: sortedBrands,
      osCounts,
      recentDevices,
      isMongoConnected: isConnectedToMongo,
      isMongoConfigured: isMongoConfigured(),
    };

    cachedStatsPayload = statsPayload;
    cachedStatsAt = Date.now();

    return NextResponse.json(
      {
        success: true,
        stats: statsPayload,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("Stats API error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
