import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const report: Record<string, any> = {};

  // 1. Check IP
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(3000) });
    report.ip = await ipRes.json();
  } catch (e: any) {
    report.ipError = e.message;
  }

  // 2. Check VixSrc
  try {
    const t0 = Date.now();
    const vixRes = await fetch("https://vixsrc.to/api/movie/674", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json, text/javascript, */*; q=0.01",
        Referer: "https://vixsrc.to",
        Origin: "https://vixsrc.to",
      },
      signal: AbortSignal.timeout(4000),
    });
    const vixText = await vixRes.text();
    report.vix = {
      durationMs: Date.now() - t0,
      status: vixRes.status,
      statusText: vixRes.statusText,
      server: vixRes.headers.get("server"),
      cfRay: vixRes.headers.get("cf-ray"),
      preview: vixText.slice(0, 200),
    };
  } catch (e: any) {
    report.vixError = e.message;
  }

  // 3. Check NetMirror
  try {
    const t0 = Date.now();
    const nmRes = await fetch("https://mobidetect.art/check.php?platform=android", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(4000),
    });
    const nmText = await nmRes.text();
    report.netMirror = {
      durationMs: Date.now() - t0,
      status: nmRes.status,
      statusText: nmRes.statusText,
      preview: nmText.slice(0, 200),
    };
  } catch (e: any) {
    report.netMirrorError = e.message;
  }

  return NextResponse.json(report);
}
