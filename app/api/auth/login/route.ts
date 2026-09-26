import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/mongodb";
import { verifyPassword, generateToken } from "@/lib/auth";

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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    let userDoc: any = null;
    let userId = "";

    const db = await getDb();
    if (db) {
      userDoc = await db.collection("users").findOne({ email });
      if (userDoc) {
        userId = String(userDoc._id);
      }
    } else {
      userDoc = inMemoryStore?.users?.get(email);
      if (userDoc) {
        userId = userDoc.id;
      }
    }

    if (!userDoc) {
      return NextResponse.json(
        { error: "No account found with this email address. Please sign up." },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Check if account is Google OAuth only
    if (userDoc.authProvider === "google" && !userDoc.passwordHash) {
      return NextResponse.json(
        { error: "This account is linked with Google Sign-In. Please click 'Continue with Google'." },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Verify Password
    const isValid = verifyPassword(password, userDoc.passwordHash, userDoc.salt);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Update lastLoginAt
    const now = new Date();
    if (db) {
      await db.collection("users").updateOne({ email }, { $set: { lastLoginAt: now } }).catch(() => {});
    }

    const token = generateToken(userId, email);

    const user = {
      id: userId,
      name: userDoc.name || email.split("@")[0],
      email: userDoc.email,
      avatar: userDoc.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userDoc.name || email)}`,
      authProvider: userDoc.authProvider || "credentials",
      createdAt: userDoc.createdAt ? new Date(userDoc.createdAt).toISOString() : now.toISOString(),
      token,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Logged in successfully",
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
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during login" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
