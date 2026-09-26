import { NextResponse } from "next/server";
import { upsertGoogleUser } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  // Handle Google OAuth Cancellation / Error
  if (error || !code) {
    const errorMsg = error || "Google sign-in authorization was cancelled or failed.";
    const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>MoviesZone - Sign In Cancelled</title>
        <style>
          body {
            background-color: #080A0F;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .box {
            text-align: center;
            max-width: 400px;
            padding: 30px;
            background: #11141d;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
          }
          h2 { color: #f87171; font-size: 18px; margin-bottom: 8px; }
          p { color: rgba(255, 255, 255, 0.6); font-size: 13px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="box">
          <h2>Google Sign-In Cancelled</h2>
          <p>${errorMsg}</p>
          <p style="font-size: 11px; color: rgba(255,255,255,0.4)">Closing window...</p>
        </div>
        <script>
          try {
            if (window.opener) {
              window.opener.postMessage({ type: "GOOGLE_AUTH_ERROR", error: ${JSON.stringify(errorMsg)} }, window.location.origin);
              setTimeout(() => window.close(), 1200);
            } else {
              setTimeout(() => { window.location.href = "/"; }, 2000);
            }
          } catch (e) {
            setTimeout(() => window.close(), 1500);
          }
        </script>
      </body>
      </html>
    `;

    return new NextResponse(errorHtml, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const origin = url.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    // Exchange authorization code for Google access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Google token exchange error:", errText);
      throw new Error("Failed to exchange authorization code with Google.");
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch verified profile from Google UserInfo endpoint
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      throw new Error("Failed to retrieve user profile from Google.");
    }

    const googleUser = await userInfoRes.json();
    const email = googleUser.email?.toLowerCase()?.trim();
    if (!email) {
      throw new Error("No verified email returned from Google account.");
    }

    const name = googleUser.name || email.split("@")[0];
    const avatar = googleUser.picture || "";
    const googleId = googleUser.sub || "";

    const user = await upsertGoogleUser({
      email,
      name,
      avatar,
      googleId,
    });

    const successHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>MoviesZone - Welcome ${name}</title>
        <style>
          body {
            background-color: #080A0F;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .box {
            text-align: center;
            max-width: 380px;
            padding: 32px 24px;
            background: #0e1118;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.8);
          }
          .spinner {
            width: 36px;
            height: 36px;
            border: 3px solid rgba(255, 106, 0, 0.2);
            border-top-color: #ff6a00;
            border-radius: 50%;
            margin: 0 auto 18px;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          h2 { color: #ffffff; font-size: 19px; margin-bottom: 6px; font-weight: 700; }
          p { color: rgba(255, 255, 255, 0.5); font-size: 13px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="spinner"></div>
          <h2>Welcome, ${name.replace(/</g, "&lt;")}</h2>
          <p>Signing you in to MoviesZone...</p>
        </div>
        <script>
          const authData = ${JSON.stringify({ user, token: user.token })};
          try {
            localStorage.setItem("cinestream_auth_token", authData.token);
            localStorage.setItem("cinestream_auth_user", JSON.stringify(authData.user));
          } catch(e) {}

          if (window.opener) {
            window.opener.postMessage({ type: "GOOGLE_AUTH_SUCCESS", ...authData }, window.location.origin);
            setTimeout(() => window.close(), 300);
          } else {
            window.location.href = "/";
          }
        </script>
      </body>
      </html>
    `;

    return new NextResponse(successHtml, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("Google callback route error:", err);
    const failHtml = `
      <!DOCTYPE html>
      <html>
      <body style="background:#080A0F;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;max-width:400px;padding:20px;">
          <h2 style="color:#ef4444;">Authentication Error</h2>
          <p style="color:#888;">${err?.message || "Failed to complete Google authentication."}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: "GOOGLE_AUTH_ERROR", error: ${JSON.stringify(err?.message || "Authentication failed")} }, window.location.origin);
              setTimeout(() => window.close(), 2000);
            } else {
              setTimeout(() => { window.location.href = "/"; }, 3000);
            }
          </script>
        </div>
      </body>
      </html>
    `;
    return new NextResponse(failHtml, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
