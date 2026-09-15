import { NextRequest, NextResponse } from "next/server";
import { encryptStreamUrl, decryptStreamUrl } from "@/lib/stream-crypto";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Range, X-Requested-With",
};

/**
 * Robust URL sanitizer for upstream CDN & M3U8 relative/malformed paths
 */
function sanitizeTargetUrl(rawUrl: string, baseUrl: string): string | null {
  try {
    let clean = rawUrl.trim();
    if (!clean) return null;

    // Fix malformed triple slashes: https:///files/... -> https://origin/files/...
    if (clean.startsWith("https:///")) {
      try {
        const baseObj = new URL(baseUrl);
        clean = `${baseObj.origin}/${clean.replace("https:///", "")}`;
      } catch {
        clean = clean.replace("https:///", "https://");
      }
    } else if (clean.startsWith("http:///")) {
      try {
        const baseObj = new URL(baseUrl);
        clean = `${baseObj.origin}/${clean.replace("http:///", "")}`;
      } catch {
        clean = clean.replace("http:///", "http://");
      }
    } else if (clean.startsWith("//")) {
      clean = "https:" + clean;
    }

    let parsed: URL;
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      parsed = new URL(clean);
      // If hostname is single word without a TLD like 'files' or 'localhost', resolve path against base origin
      if (!parsed.hostname.includes(".")) {
        const baseObj = new URL(baseUrl);
        parsed = new URL(parsed.pathname + parsed.search, baseObj.origin);
      }
    } else {
      parsed = new URL(clean, baseUrl);
    }
    return parsed.href;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("d") || searchParams.get("token");

  let targetUrl: string | null = null;
  let referer = "https://vixsrc.to/";

  if (token) {
    const decrypted = decryptStreamUrl(token);
    if (!decrypted || !decrypted.url) {
      return new NextResponse("Access Denied: Invalid or expired token", {
        status: 403,
        headers: CORS_HEADERS,
      });
    }
    targetUrl = decrypted.url;
    if (decrypted.referer) {
      referer = decrypted.referer;
    }
  } else if (searchParams.get("url")) {
    targetUrl = searchParams.get("url");
    if (searchParams.get("referer")) {
      referer = searchParams.get("referer")!;
    }
  }

  if (!targetUrl) {
    return new NextResponse("Missing stream parameter", {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  // Sanitize target URL against referer
  const sanitizedTargetUrl = sanitizeTargetUrl(targetUrl, referer);
  if (!sanitizedTargetUrl) {
    return new NextResponse("Invalid upstream URL", {
      status: 400,
      headers: CORS_HEADERS,
    });
  }
  targetUrl = sanitizedTargetUrl;

  try {
    let requestOrigin = "https://vixsrc.to";
    try {
      if (referer) {
        requestOrigin = new URL(referer).origin;
      }
    } catch {}

    const requestHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Referer: referer,
      Origin: requestOrigin,
    };

    const clientRange = request.headers.get("range");
    if (clientRange) {
      requestHeaders["Range"] = clientRange;
    }

    const controller = new AbortController();
    const connectTimeout = setTimeout(() => controller.abort(), 30000);

    // Forward client abort signal so browser scrubbing cleans up cleanly
    if (request.signal) {
      request.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(targetUrl, {
        headers: requestHeaders,
        signal: controller.signal,
      });
    } finally {
      // Clear connect timeout immediately once headers are received so active video transfers don't get aborted!
      clearTimeout(connectTimeout);
    }

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return new NextResponse(`Upstream error: ${upstreamRes.statusText}`, {
        status: upstreamRes.status,
        headers: CORS_HEADERS,
      });
    }

    const contentType = upstreamRes.headers.get("content-type") || "";
    const isM3U8 =
      contentType.includes("mpegurl") ||
      targetUrl.includes(".m3u8") ||
      targetUrl.includes("/playlist");

    if (isM3U8) {
      const originalText = await upstreamRes.text();
      const lines = originalText.split("\n");
      const rewrittenLines: string[] = [];

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Skip broken dummy audio media tags from NetMirror (e.g., https:///files/108978/a/0/0.m3u8 or 1. Unknown)
        if (
          line.includes("TYPE=AUDIO") &&
          (line.includes("///files") ||
            line.includes("NAME=\"1. Unknown\"") ||
            line.includes("LANGUAGE=\"und\""))
        ) {
          continue;
        }

        if (line.startsWith("#")) {
          // If STREAM-INF references dummy audio group that was removed, strip AUDIO attribute
          if (line.startsWith("#EXT-X-STREAM-INF:") && (line.includes('AUDIO="aac"') || line.includes('AUDIO="und"'))) {
            line = line.replace(/,AUDIO="[^"]+"/g, "").replace(/AUDIO="[^"]+",/g, "");
          }

          // Rewrite URI attributes in tags like #EXT-X-MEDIA:TYPE=AUDIO/SUBTITLES and #EXT-X-KEY
          const rewrittenTag = line.replace(
            /URI=["']([^"']+)["']/g,
            (_match, uri) => {
              const fullUri = sanitizeTargetUrl(uri, targetUrl!) || (uri.startsWith("http") ? uri : new URL(uri, targetUrl!).href);
              const encryptedToken = encryptStreamUrl(fullUri, referer);
              return `URI="/api/stream/proxy?d=${encryptedToken}"`;
            },
          );
          rewrittenLines.push(rewrittenTag);
        } else {
          // It is a stream segment (.ts / .jpg) or child variant playlist link
          const fullSegmentUrl = sanitizeTargetUrl(line, targetUrl) || (line.startsWith("http") ? line : new URL(line, targetUrl).href);
          const encryptedToken = encryptStreamUrl(fullSegmentUrl, referer);
          rewrittenLines.push(`/api/stream/proxy?d=${encryptedToken}`);
        }
      }

      return new NextResponse(rewrittenLines.join("\n"), {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
          ...CORS_HEADERS,
        },
      });
    }

    // Binary video segments (.ts, .jpg, .mp4) or subtitles (.vtt)
    const headers = new Headers();
    headers.set(
      "Content-Type",
      contentType ||
        (targetUrl.endsWith(".vtt")
          ? "text/vtt"
          : targetUrl.includes(".mp4")
          ? "video/mp4"
          : "video/mp2t"),
    );
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "*");
    headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
    if (upstreamRes.headers.get("content-length")) {
      headers.set("Content-Length", upstreamRes.headers.get("content-length")!);
    }
    if (upstreamRes.headers.get("content-range")) {
      headers.set("Content-Range", upstreamRes.headers.get("content-range")!);
    }
    if (upstreamRes.headers.get("accept-ranges")) {
      headers.set("Accept-Ranges", upstreamRes.headers.get("accept-ranges")!);
    } else {
      headers.set("Accept-Ranges", "bytes");
    }

    // Safe streaming pipeline with TransformStream to gracefully handle client scrubbing/disconnects
    const { readable, writable } = new TransformStream();
    if (upstreamRes.body) {
      upstreamRes.body.pipeTo(writable).catch(() => {
        // Silently handle stream closure when user seeks or closes tab
      });
    }

    return new NextResponse(readable, {
      status: upstreamRes.status,
      headers,
    });
  } catch (error: any) {
    // Graceful handling for client disconnects and initial timeouts
    const isAborted = error?.name === "TimeoutError" || error?.name === "AbortError";
    if (!isAborted) {
      console.error("Proxy streaming error:", error?.message || error);
    }
    return new NextResponse("Failed to proxy video stream", {
      status: isAborted ? 504 : 502,
      headers: CORS_HEADERS,
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

