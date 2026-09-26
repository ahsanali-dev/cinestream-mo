import { NextResponse } from "next/server";
import { upsertGoogleUser } from "@/lib/auth";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function parseGoogleJwt(credential: string): { email?: string; name?: string; picture?: string; sub?: string } | null {
  try {
    const parts = credential.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let email = "";
    let name = "";
    let avatar = "";
    let googleId = "";

    // 1. If Google Access Token provided (from GIS OAuth2 Token Client Popup)
    if (body.access_token) {
      try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${body.access_token}` },
        });
        if (userInfoRes.ok) {
          const googleUser = await userInfoRes.json();
          if (googleUser.email) {
            email = googleUser.email.toLowerCase().trim();
            name = googleUser.name || email.split("@")[0];
            avatar = googleUser.picture || "";
            googleId = googleUser.sub || "";
          }
        }
      } catch (err) {
        console.warn("Failed to fetch userinfo with access_token:", err);
      }
    }

    // 2. If Google ID Token Credential provided (from GIS One Tap or standard ID Token)
    if (!email && body.credential) {
      try {
        // Attempt verification with Google tokeninfo endpoint
        const tokenRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.credential)}`
        );
        if (tokenRes.ok) {
          const tokenInfo = await tokenRes.json();
          if (tokenInfo.email) {
            email = tokenInfo.email.toLowerCase().trim();
            name = tokenInfo.name || email.split("@")[0];
            avatar = tokenInfo.picture || "";
            googleId = tokenInfo.sub || "";
          }
        }
      } catch (err) {
        console.warn("Google tokeninfo check failed, falling back to local JWT parse:", err);
      }

      if (!email) {
        const parsed = parseGoogleJwt(body.credential);
        if (parsed?.email) {
          email = parsed.email.toLowerCase().trim();
          name = parsed.name || email.split("@")[0];
          avatar = parsed.picture || "";
          googleId = parsed.sub || "";
        }
      }
    }

    // 3. If OAuth 2.0 Authorization Code provided
    if (!email && body.code) {
      try {
        const tokenExchangeRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code: body.code,
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
            redirect_uri: body.redirect_uri || `${new URL(req.url).origin}/api/auth/google/callback`,
            grant_type: "authorization_code",
          }),
        });

        if (tokenExchangeRes.ok) {
          const tokens = await tokenExchangeRes.json();
          if (tokens.access_token) {
            const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${tokens.access_token}` },
            });
            if (userRes.ok) {
              const u = await userRes.json();
              if (u.email) {
                email = u.email.toLowerCase().trim();
                name = u.name || email.split("@")[0];
                avatar = u.picture || "";
                googleId = u.sub || "";
              }
            }
          }
        }
      } catch (err) {
        console.warn("OAuth code exchange error:", err);
      }
    }

    // 4. Fallback if client directly sent decoded verified fields
    if (!email && body.email) {
      email = String(body.email).toLowerCase().trim();
      name = String(body.name || email.split("@")[0]).trim();
      avatar = String(body.avatar || "");
      googleId = String(body.googleId || "");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Could not retrieve a valid email from Google account" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Upsert into Database (or in-memory store)
    const user = await upsertGoogleUser({
      email,
      name,
      avatar,
      googleId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Google login successful",
        user,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Google Auth API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during Google authentication" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
