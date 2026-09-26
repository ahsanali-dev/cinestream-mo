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
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now - 7 * 86400 * 1000);

    const db = await getDb();

    let allDevices: any[] = [];
    let isConnectedToMongo = false;

    if (db) {
      try {
        allDevices = await db.collection("devices").find({}).toArray();
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

    // Recent 10 devices
    const recentDevices = [...allDevices]
      .sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime())
      .slice(0, 10)
      .map((d) => {
        const lastActive = new Date(d.lastActiveAt);
        const isLive = lastActive >= fiveMinutesAgo;
        return {
          deviceId: d.deviceId,
          deviceModel: d.deviceModel,
          os: `${d.os || "Android"} ${d.osVersion || "14"}`,
          appVersion: d.appVersion || "1.0.0",
          currentScreen: d.currentScreen || "HomeScreen",
          lastActiveAt: d.lastActiveAt,
          status: isLive ? "online" : "offline",
          pingCount: d.pingCount || 1,
        };
      });

    return NextResponse.json(
      {
        success: true,
        stats: {
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
        },
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
