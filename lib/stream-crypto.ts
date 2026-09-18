import crypto from "crypto";

/**
 * CineStream Stream URL Encryption & Masking Engine
 * Encrypts upstream stream hosts, video chunks (.ts), playlists (.m3u8),
 * encryption keys, and subtitles with AES-256-CBC using a server-side secret key.
 * This guarantees upstream hosts (e.g. vixsrc, cdn domains) are never exposed to clients,
 * DevTools, or network sniffers.
 */

const SECRET_PHRASE = process.env.STREAM_SECRET || "cinestream-vault-encrypted-master-stream-key-2026";
const SECRET_KEY = crypto.createHash("sha256").update(SECRET_PHRASE).digest();
const IV_LENGTH = 16;

export interface ExtraAudioTrack {
  label: string;
  lang: string;
  url: string;
  referer?: string;
}

export interface DecryptedStreamPayload {
  url: string;
  referer?: string;
  extraAudio?: ExtraAudioTrack[];
}

/**
 * Encrypts a target URL, optional referer, and optional extra audio tracks into a secure token.
 */
export function encryptStreamUrl(
  url: string,
  referer?: string,
  extraAudio?: ExtraAudioTrack[],
): string {
  try {
    const payload = JSON.stringify({
      u: url,
      r: referer || "",
      a: extraAudio && extraAudio.length > 0 ? extraAudio : undefined,
      t: Date.now(), // timestamp prevents identical tokens
    });

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, iv);
    let encrypted = cipher.update(payload, "utf8", "base64url");
    encrypted += cipher.final("base64url");

    return `${iv.toString("base64url")}.${encrypted}`;
  } catch (error) {
    console.error("Stream encryption failed:", error);
    return "";
  }
}

/**
 * Decrypts a secure token back into the target URL, referer, and extra audio tracks.
 */
export function decryptStreamUrl(token: string): DecryptedStreamPayload | null {
  try {
    if (!token || typeof token !== "string") return null;

    const dotIdx = token.indexOf(".");
    if (dotIdx === -1) return null;

    const ivStr = token.substring(0, dotIdx);
    const encryptedStr = token.substring(dotIdx + 1);

    if (!ivStr || !encryptedStr) return null;

    const iv = Buffer.from(ivStr, "base64url");
    if (iv.length !== IV_LENGTH) return null;

    const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, iv);
    let decrypted = decipher.update(encryptedStr, "base64url", "utf8");
    decrypted += decipher.final("utf8");

    const data = JSON.parse(decrypted);
    if (!data || !data.u) return null;

    return {
      url: data.u,
      referer: data.r || undefined,
      extraAudio: Array.isArray(data.a) ? data.a : undefined,
    };
  } catch {
    // Decryption failure (invalid or tampered token)
    return null;
  }
}
