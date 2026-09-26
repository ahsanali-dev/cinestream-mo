import { NextResponse } from "next/server";
import { generateAdminToken, verifyAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@movieszone2026";

/**
 * Check if the request is from an authenticated admin
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const tokenFromHeader = authHeader.replace(/^Bearer\s+/i, "").trim();

    // Check cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(/cinestream_admin_token=([^;]+)/);
    const tokenFromCookie = cookieMatch ? cookieMatch[1] : "";

    const token = tokenFromHeader || tokenFromCookie;

    if (token && verifyAdminToken(token)) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

/**
 * Log in with Admin Master Key / Password
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = body.password || body.key || "";

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Admin access key / password is required" },
        { status: 400 }
      );
    }

    // Verify against ADMIN_PASSWORD or master key
    if (password.trim() !== ADMIN_PASSWORD.trim()) {
      return NextResponse.json(
        { error: "Invalid Admin Credentials. Access Denied." },
        { status: 401 }
      );
    }

    const token = generateAdminToken();

    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful",
      token,
    });

    // Set secure cookie
    response.cookies.set("cinestream_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 86400, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error during authentication" },
      { status: 500 }
    );
  }
}

/**
 * Log out admin
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("cinestream_admin_token");
  return response;
}
