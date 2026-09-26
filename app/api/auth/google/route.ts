import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/mongodb";
import { generateToken } from "@/lib/auth";

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

    if (body.credential) {
      // Decoded from Google One Tap / Google Identity JWT
      const parsed = parseGoogleJwt(body.credential);
      if (parsed?.email) {
        email = parsed.email.toLowerCase().trim();
        name = parsed.name || email.split("@")[0];
        avatar = parsed.picture || "";
        googleId = parsed.sub || "";
      }
    }

    // Direct fields fallback (e.g. from mobile or web client)
    if (!email && body.email) {
      email = String(body.email).toLowerCase().trim();
      name = String(body.name || email.split("@")[0]).trim();
      avatar = String(body.avatar || "");
      googleId = String(body.googleId || "");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid Google account information or email missing" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (!avatar) {
      avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || email)}`;
    }

    const now = new Date();
    let userId = "";
    let existingDoc: any = null;

    const db = await getDb();
    if (db) {
      existingDoc = await db.collection("users").findOne({ email });
      if (existingDoc) {
        userId = String(existingDoc._id);
        // Update avatar if not present and lastLoginAt
        await db.collection("users").updateOne(
          { email },
          {
            $set: {
              lastLoginAt: now,
              ...(avatar && !existingDoc.avatar ? { avatar } : {}),
            },
          }
        );
      } else {
        const insertRes = await db.collection("users").insertOne({
          name,
          email,
          avatar,
          authProvider: "google",
          googleId,
          role: "user",
          createdAt: now,
          lastLoginAt: now,
        });
        userId = String(insertRes.insertedId);
      }
    } else {
      // In-Memory store fallback
      existingDoc = inMemoryStore?.users?.get(email);
      if (existingDoc) {
        userId = existingDoc.id;
        existingDoc.lastLoginAt = now.toISOString();
      } else {
        userId = `usr_g_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newDoc = {
          id: userId,
          name,
          email,
          avatar,
          authProvider: "google",
          googleId,
          role: "user",
          createdAt: now.toISOString(),
          lastLoginAt: now.toISOString(),
        };
        inMemoryStore?.users?.set(email, newDoc);
      }
    }

    const token = generateToken(userId, email);

    const user = {
      id: userId,
      name: (existingDoc?.name) || name,
      email,
      avatar: (existingDoc?.avatar) || avatar,
      authProvider: "google",
      createdAt: existingDoc?.createdAt ? new Date(existingDoc.createdAt).toISOString() : now.toISOString(),
      token,
    };

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
