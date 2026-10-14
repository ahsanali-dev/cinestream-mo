import { getDb, inMemoryStore } from "./mongodb";

const TEST_SUBJECT_ID = "7346018858530490728"; // The Love Hypothesis
const TEST_DETAIL_PATH = "the-love-hypothesis-8CNfawlQEK8";

/**
 * Mints a brand-new live MovieBox authorization token from the official gateway.
 * Executed server-side on Node.js / Vercel to bypass React Native / browser CORS header stripping.
 */
export async function mintFreshMovieBoxToken(apiBase = "https://h5-api.aoneroom.com"): Promise<string | null> {
  try {
    const res = await fetch(`${apiBase}/wefeed-h5api-bff/home`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
        "Content-Type": "application/json",
        Referer: "https://moviebox.ac/",
      },
      cache: "no-store",
    });

    const xUser = res.headers.get("x-user") || res.headers.get("X-User");
    if (!xUser) {
      console.warn("[MovieBoxTokenServer] No x-user header returned from gateway");
      return null;
    }

    const parsed = typeof xUser === "string" ? JSON.parse(xUser) : xUser;
    if (parsed && typeof parsed.token === "string" && parsed.token.length > 30) {
      return parsed.token;
    }
  } catch (err) {
    console.error("[MovieBoxTokenServer] Error minting token:", err);
  }
  return null;
}

/**
 * Validates a token against MovieBox's playback endpoint to guarantee it returns active streams.
 */
export async function testMovieBoxToken(
  token: string,
  apiBase = "https://h5-api.aoneroom.com",
  webBase = "https://moviebox.ac"
): Promise<{ ok: boolean; streamsCount: number; limited: boolean; message: string }> {
  try {
    const playUrl = `${apiBase}/wefeed-h5api-bff/subject/play?subjectId=${TEST_SUBJECT_ID}&se=0&ep=0`;
    const res = await fetch(playUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
        "Content-Type": "application/json",
        "X-No-High-Risk-Restrict": "1",
        "x-auth-token": token,
        Authorization: `Bearer ${token}`,
        Cookie: `token=${token};`,
        Referer: `${webBase}/movies/${TEST_DETAIL_PATH}?id=${TEST_SUBJECT_ID}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, streamsCount: 0, limited: false, message: `HTTP ${res.status}` };
    }

    const json = await res.json().catch(() => null);
    const limited = json?.data?.limited === true;
    const streamsCount = Array.isArray(json?.data?.streams) ? json.data.streams.length : 0;

    if (streamsCount > 0 && !limited) {
      return { ok: true, streamsCount, limited: false, message: "Valid & Delivering Streams" };
    }

    return {
      ok: false,
      streamsCount,
      limited,
      message: limited ? "Rate-limited by MovieBox" : "Zero streams returned",
    };
  } catch (err: any) {
    return { ok: false, streamsCount: 0, limited: false, message: err?.message || "Network Error" };
  }
}

let lastVerifiedHealthyToken = "";
let lastVerifiedAt = 0;

/**
 * Automatically obtains a verified, working MovieBox token.
 * If current token in pool is expired/rate-limited or forceRefresh is true,
 * it auto-mints a fresh token from MovieBox, verifies playback streams,
 * and updates MongoDB Atlas automatically.
 */
export async function getOrRefreshHealthyToken(forceRefresh = false): Promise<{
  token: string | null;
  source: "cached_healthy" | "pool_verified" | "minted_live" | "fallback_pool";
  message?: string;
}> {
  const apiBase = inMemoryStore.config.moviebox?.api_base || "https://h5-api.aoneroom.com";
  const webBase = inMemoryStore.config.moviebox?.web_base || "https://moviebox.ac";

  // Fast-path: if not forced and last token was verified healthy within 5 minutes
  if (
    !forceRefresh &&
    lastVerifiedHealthyToken &&
    Date.now() - lastVerifiedAt < 5 * 60 * 1000
  ) {
    return { token: lastVerifiedHealthyToken, source: "cached_healthy" };
  }

  // Fetch current pool from MongoDB Atlas or in-memory
  let pool: string[] = inMemoryStore.config.moviebox?.auth_tokens || [];
  try {
    const db = await getDb();
    if (db) {
      const doc = await db.collection("app_config").findOne({ _id: "global_config" as any });
      if (doc?.moviebox?.auth_tokens && Array.isArray(doc.moviebox.auth_tokens) && doc.moviebox.auth_tokens.length > 0) {
        pool = doc.moviebox.auth_tokens;
        if (inMemoryStore.config.moviebox) {
          inMemoryStore.config.moviebox.auth_tokens = pool;
        }
      }
    }
  } catch (e) {}

  // 1. If not forcing a brand-new mint, test the current top token
  if (!forceRefresh && pool.length > 0) {
    const topToken = pool[0];
    const testResult = await testMovieBoxToken(topToken, apiBase, webBase);
    if (testResult.ok) {
      lastVerifiedHealthyToken = topToken;
      lastVerifiedAt = Date.now();
      return { token: topToken, source: "pool_verified" };
    }
    console.warn(
      `[MovieBoxTokenServer] Current pool token failed validation (${testResult.message}). Auto-minting fresh token...`
    );
  }

  // 2. Auto-mint a brand new live token from MovieBox gateway
  const freshToken = await mintFreshMovieBoxToken(apiBase);
  if (freshToken) {
    const testFresh = await testMovieBoxToken(freshToken, apiBase, webBase);
    if (testFresh.ok) {
      await addVerifiedTokenToPool(freshToken);
      lastVerifiedHealthyToken = freshToken;
      lastVerifiedAt = Date.now();
      return { token: freshToken, source: "minted_live" };
    } else {
      console.warn(`[MovieBoxTokenServer] Freshly minted token failed verification: ${testFresh.message}`);
    }
  }

  // 3. Fallback: check remaining tokens in the pool
  for (let i = 1; i < pool.length; i++) {
    const fallbackToken = pool[i];
    const test = await testMovieBoxToken(fallbackToken, apiBase, webBase);
    if (test.ok) {
      await addVerifiedTokenToPool(fallbackToken);
      lastVerifiedHealthyToken = fallbackToken;
      lastVerifiedAt = Date.now();
      return { token: fallbackToken, source: "pool_verified" };
    }
  }

  // 4. Ultimate fallback: if gateway was down, return top pool token anyway
  if (pool.length > 0) {
    return { token: pool[0], source: "fallback_pool", message: "Gateway unreachable, returned best available" };
  }

  return { token: null, source: "fallback_pool", message: "No tokens available" };
}

/**
 * Stores a verified token in the MongoDB Atlas pool and in-memory store.
 */
export async function addVerifiedTokenToPool(token: string): Promise<string[]> {
  let currentTokens: string[] = inMemoryStore.config.moviebox?.auth_tokens || [];
  try {
    const db = await getDb();
    if (db) {
      const doc = await db.collection("app_config").findOne({ _id: "global_config" as any });
      if (doc?.moviebox?.auth_tokens && Array.isArray(doc.moviebox.auth_tokens)) {
        currentTokens = doc.moviebox.auth_tokens;
      }
    }
  } catch {}

  // Filter existing, prepend new token, keep top 6
  const updatedTokens = [token, ...currentTokens.filter((t) => t !== token)].slice(0, 6);

  inMemoryStore.config.moviebox = {
    ...inMemoryStore.config.moviebox,
    auth_tokens: updatedTokens,
  };

  try {
    const db = await getDb();
    if (db) {
      await db.collection("app_config").updateOne(
        { _id: "global_config" as any },
        {
          $set: {
            "moviebox.auth_tokens": updatedTokens,
            updated_at: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
    }
  } catch (e) {
    console.error("[MovieBoxTokenServer] Failed to persist token pool to MongoDB:", e);
  }

  return updatedTokens;
}
