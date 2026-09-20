// @ts-nocheck
/**
 * CineStream Edge Proxy (Deploy on Deno Deploy - https://deno.com/deploy)
 * 100% Free, Global Edge Network, NO Cloudflare Cdn-Loop Headers
 * Completely unblocks VixSrc and NetMirror stream extraction from Vercel!
 */

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const url = new URL(req.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing ?url= parameter" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(targetUrl);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid target URL" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Dynamic Referer and Origin based on target host
  const targetHost = parsedTarget.hostname.toLowerCase();
  let referer = `${parsedTarget.protocol}//${parsedTarget.host}/`;
  let origin = `${parsedTarget.protocol}//${parsedTarget.host}`;

  if (targetHost.includes("net77.cc") || targetHost.includes("net52.cc") || targetHost.includes("mobidetect")) {
    if (targetUrl.includes("post.php") || targetUrl.includes("episodes.php") || targetUrl.includes("playlist.php")) {
      referer = "https://net77.cc/home";
    } else {
      referer = "https://net77.cc/mobile/home?app=1";
    }
    origin = "https://net77.cc";
  } else if (targetHost.includes("vixsrc.to")) {
    referer = "https://vixsrc.to";
    origin = "https://vixsrc.to";
  } else if (targetHost.includes("videodownloader.site")) {
    referer = "https://videodownloader.site/";
    origin = "https://videodownloader.site";
  }

  const headers = new Headers();
  headers.set(
    "User-Agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
  );
  if (targetUrl.includes("/api/")) {
    headers.set("Accept", "application/json, text/javascript, */*; q=0.01");
  } else {
    headers.set("Accept", "*/*");
  }
  headers.set("Accept-Language", "en-US,en;q=0.9");
  headers.set("Referer", referer);

  if (req.method !== "GET" && req.method !== "HEAD") {
    headers.set("Origin", origin);
  }

  const cookieHeader = req.headers.get("Cookie");
  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      redirect: "follow",
    });

    const resHeaders = new Headers(response.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
    resHeaders.set("Access-Control-Allow-Headers", "*");

    // Strip restrictive headers and compression metadata that causes HTTP/2 stream errors
    resHeaders.delete("Content-Security-Policy");
    resHeaders.delete("X-Frame-Options");
    resHeaders.delete("content-encoding");
    resHeaders.delete("content-length");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to fetch upstream" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
