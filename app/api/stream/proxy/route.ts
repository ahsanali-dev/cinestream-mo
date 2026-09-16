import { NextRequest, NextResponse } from "next/server";
import { encryptStreamUrl, decryptStreamUrl } from "@/lib/stream-crypto";
import http2 from "node:http2";
import { Readable } from "node:stream";

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

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Dynamically resolves the exact legitimate referer required by each upstream CDN
 */
function getTargetReferer(targetUrl: string, existingReferer?: string): string {
  if (
    targetUrl.includes("hakunaymatata.com") ||
    targetUrl.includes("bcdnxw") ||
    targetUrl.includes("net27.cc") ||
    targetUrl.includes("net77.cc") ||
    targetUrl.includes("videodownloader")
  ) {
    return "https://videodownloader.site/";
  }
  if (
    targetUrl.includes("vixsrc.to") ||
    targetUrl.includes("redzebra93.fun") ||
    targetUrl.includes("vix-content.net")
  ) {
    return "https://vixsrc.to/";
  }
  return existingReferer || "https://videodownloader.site/";
}

interface UpstreamResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  body: ReadableStream<Uint8Array> | null;
  text: () => Promise<string>;
}

// Connection pool for HTTP/2 sessions to minimize handshake latency across range chunks
const http2Sessions = new Map<string, http2.ClientHttp2Session>();

function getHttp2Session(origin: string): http2.ClientHttp2Session {
  let session = http2Sessions.get(origin);
  if (!session || session.destroyed || session.closed) {
    session = http2.connect(origin);
    session.on("error", () => {
      try { session?.destroy(); } catch {}
      http2Sessions.delete(origin);
    });
    session.on("close", () => {
      http2Sessions.delete(origin);
    });
    http2Sessions.set(origin, session);
  }
  return session;
}

/**
 * Native HTTP/2 client for upstream CDN endpoints that require ALPN h2 (e.g. Alibaba Cloud CDN / Tengine)
 * and reject HTTP/1.1 from cloud datacenter IPs with 426 Upgrade Required.
 */
async function fetchHttp2(
  targetUrl: string,
  headers: Record<string, string>,
  signal?: AbortSignal,
): Promise<UpstreamResponse> {
  const parsed = new URL(targetUrl);
  const session = getHttp2Session(parsed.origin);

  return new Promise((resolve, reject) => {
    let req: http2.ClientHttp2Stream;

    const reqHeaders: http2.OutgoingHttpHeaders = {
      ":method": "GET",
      ":path": parsed.pathname + parsed.search,
      ":authority": parsed.host,
      ":scheme": parsed.protocol.replace(":", ""),
    };

    for (const [key, value] of Object.entries(headers)) {
      const lower = key.toLowerCase();
      // Filter out HTTP/1.1-specific connection headers not allowed in HTTP/2
      if (
        !lower.startsWith(":") &&
        lower !== "host" &&
        lower !== "connection" &&
        lower !== "keep-alive" &&
        lower !== "upgrade"
      ) {
        reqHeaders[lower] = value;
      }
    }

    try {
      req = session.request(reqHeaders);
    } catch {
      // If session failed, clear and retry once with fresh session
      http2Sessions.delete(parsed.origin);
      const freshSession = getHttp2Session(parsed.origin);
      req = freshSession.request(reqHeaders);
    }

    let resolved = false;

    if (signal) {
      if (signal.aborted) {
        try { req.close(http2.constants.NGHTTP2_CANCEL); } catch {}
        return reject(new DOMException("Aborted", "AbortError"));
      }
      signal.addEventListener(
        "abort",
        () => {
          try { req.close(http2.constants.NGHTTP2_CANCEL); } catch {}
        },
        { once: true },
      );
    }

    req.on("error", (err) => {
      if (!resolved) {
        reject(err);
      }
    });

    req.on("response", (resHeaders) => {
      resolved = true;
      const status = (resHeaders[":status"] as number) || 200;
      const responseHeaders = new Headers();

      for (const [k, v] of Object.entries(resHeaders)) {
        if (!k.startsWith(":")) {
          if (Array.isArray(v)) {
            v.forEach((val) => responseHeaders.append(k, val));
          } else if (v !== undefined) {
            responseHeaders.set(k, String(v));
          }
        }
      }

      const webStream = Readable.toWeb(req) as ReadableStream<Uint8Array>;

      resolve({
        ok: status >= 200 && status < 300,
        status,
        statusText:
          status === 206
            ? "Partial Content"
            : status === 200
            ? "OK"
            : `Status ${status}`,
        headers: responseHeaders,
        body: webStream,
        text: async () => {
          return new Response(webStream).text();
        },
      });
    });
  });
}

/**
 * Intelligent upstream dispatcher: uses HTTP/2 for CDNs enforcing h2 protocol upgrades
 * and automatically upgrades to HTTP/2 if upstream responds with 426 Upgrade Required.
 */
async function fetchUpstream(
  targetUrl: string,
  requestHeaders: Record<string, string>,
  signal?: AbortSignal,
): Promise<UpstreamResponse> {
  const isHttps = targetUrl.startsWith("https://");
  const isAlibabaCdn =
    targetUrl.includes("hakunaymatata.com") ||
    targetUrl.includes("bcdnxw");

  // Proactively use HTTP/2 for Alibaba Cloud CDN nodes (which enforce HTTP/2 from cloud datacenters)
  if (isHttps && isAlibabaCdn) {
    try {
      return await fetchHttp2(targetUrl, requestHeaders, signal);
    } catch (h2Err) {
      console.warn("HTTP/2 initial fetch failed, falling back to standard fetch:", h2Err);
    }
  }

  // Standard fetch for other upstream servers
  const controller = new AbortController();
  const connectTimeout = setTimeout(() => controller.abort(), 30000);
  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: requestHeaders,
      signal: controller.signal,
      cache: "no-store",
    });

    // If server demands HTTP protocol upgrade (426 Upgrade Required), immediately upgrade to HTTP/2
    if (res.status === 426 && isHttps) {
      return await fetchHttp2(targetUrl, requestHeaders, signal);
    }

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
      body: res.body,
      text: () => res.text(),
    };
  } finally {
    clearTimeout(connectTimeout);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("d") || searchParams.get("token");

  let targetUrl: string | null = null;
  let referer: string | undefined = undefined;

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
  const resolvedReferer = getTargetReferer(targetUrl, referer);
  const sanitizedTargetUrl = sanitizeTargetUrl(targetUrl, resolvedReferer);
  if (!sanitizedTargetUrl) {
    return new NextResponse("Invalid upstream URL", {
      status: 400,
      headers: CORS_HEADERS,
    });
  }
  targetUrl = sanitizedTargetUrl;

  try {
    const requestHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: resolvedReferer,
    };

    const clientRange = request.headers.get("range");
    if (clientRange) {
      requestHeaders["Range"] = clientRange;
    }

    const upstreamRes = await fetchUpstream(
      targetUrl,
      requestHeaders,
      request.signal,
    );

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
          // Check if line is a child playlist or direct video segment
          const isChildPlaylist = line.includes(".m3u8") || line.includes("/playlist");
          
          if (isChildPlaylist) {
            const fullChildUrl = sanitizeTargetUrl(line, targetUrl) || (line.startsWith("http") ? line : new URL(line, targetUrl).href);
            const encryptedToken = encryptStreamUrl(fullChildUrl, referer);
            rewrittenLines.push(`/api/stream/proxy?d=${encryptedToken}`);
          } else if (line.startsWith("http://") || line.startsWith("https://")) {
            // Absolute segment URL from edge CDN (e.g. *.redzebra93.fun) has native CORS (*). Keep direct for ultra-fast zero-proxy streaming.
            rewrittenLines.push(line);
          } else {
            // Relative segment (.ts / .jpg)
            const fullSegmentUrl = sanitizeTargetUrl(line, targetUrl) || new URL(line, targetUrl).href;
            const encryptedToken = encryptStreamUrl(fullSegmentUrl, referer);
            rewrittenLines.push(`/api/stream/proxy?d=${encryptedToken}`);
          }
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

export const HEAD = GET;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

