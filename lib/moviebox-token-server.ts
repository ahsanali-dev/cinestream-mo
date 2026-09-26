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

/**
 * Stores a verified token in the MongoDB Atlas pool and in-memory store.
 */
export async function addVerifiedTokenToPool(token: string): Promise<string[]> {
  const currentTokens: string[] =
    inMemoryStore.config.moviebox?.auth_tokens || [];

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
