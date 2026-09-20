/**
 * CineStream Multi-Origin Cloudflare Worker Proxy
 * Supports VixSrc, NetMirror (net77.cc), and all streaming endpoints with CORS headers
 */

export default {
  async fetch(request) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "Missing url parameter" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    let parsedTarget;
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
    headers.set("Accept", "*/*");
    headers.set("Accept-Language", "en-US,en;q=0.9");
    headers.set("Referer", referer);

    // Only set Origin if it's a POST/PUT/DELETE or explicitly needed
    if (request.method !== "GET" && request.method !== "HEAD") {
      headers.set("Origin", origin);
    }

    // Forward any custom cookies if present
    const cookieHeader = request.headers.get("Cookie");
    if (cookieHeader) {
      headers.set("Cookie", cookieHeader);
    }

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        redirect: "follow",
      });

      const resHeaders = new Headers(response.headers);
      resHeaders.set("Access-Control-Allow-Origin", "*");
      resHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
      resHeaders.set("Access-Control-Allow-Headers", "*");

      // Remove restrictive framing / csp headers that can interfere with playback
      resHeaders.delete("Content-Security-Policy");
      resHeaders.delete("X-Frame-Options");
      resHeaders.delete("content-encoding");
      resHeaders.delete("content-length");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: resHeaders,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
};
