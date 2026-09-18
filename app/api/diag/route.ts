import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const report: Record<string, any> = {};

  // Test 1: VixSrc with Android User-Agent & Mobile headers
  try {
    const res = await fetch("https://vixsrc.to/api/movie/674", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://vixsrc.to/",
      },
      signal: AbortSignal.timeout(3000),
    });
    report.vixMobile = { status: res.status, preview: (await res.text()).slice(0, 100) };
  } catch (e: any) {
    report.vixMobileError = e.message;
  }

  // Test 2: VixCloud or other Vix domains
  const altDomains = ["https://vixcloud.co/api/movie/674", "https://vixsrc.to/embed/movie/674"];
  for (const url of altDomains) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(3000),
      });
      report[url] = { status: res.status, preview: (await res.text()).slice(0, 100) };
    } catch (e: any) {
      report[url] = { error: e.message };
    }
  }

  // Test 3: Can Net52 search & playlist be fetched on Vercel?
  try {
    const sRes = await fetch("https://net52.cc/search.php?s=Harry%20Potter", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
        "Referer": "https://net52.cc/mobile/home?app=1",
      },
      signal: AbortSignal.timeout(4000),
    });
    report.net52Search = { status: sRes.status, preview: (await sRes.text()).slice(0, 150) };
  } catch (e: any) {
    report.net52SearchError = e.message;
  }

  // Test 4: Can we use a public Cloudflare edge proxy / worker?
  // Let's test if fetching through a worker or open CORS proxy works
  const publicProxies = [
    "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://vixsrc.to/api/movie/674"),
    "https://corsproxy.io/?" + encodeURIComponent("https://vixsrc.to/api/movie/674"),
  ];
  for (const p of publicProxies) {
    try {
      const res = await fetch(p, { signal: AbortSignal.timeout(4000) });
      report[p.slice(0, 30)] = { status: res.status, preview: (await res.text()).slice(0, 150) };
    } catch (e: any) {
      report[p.slice(0, 30)] = { error: e.message };
    }
  }

  return NextResponse.json(report);
}
