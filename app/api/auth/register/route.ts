import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/mongodb";
import { hashPassword, generateToken } from "@/lib/auth";

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
    const name = String(body.name || "").trim();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Please provide a valid full name (at least 2 characters)" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const { hash, salt } = hashPassword(password);
    const now = new Date();
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

    let userId = "";

    // 1. Try MongoDB Atlas
    const db = await getDb();
    if (db) {
      const existing = await db.collection("users").findOne({ email });
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in instead." },
          { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
        );
      }

      const insertResult = await db.collection("users").insertOne({
        name,
        email,
        passwordHash: hash,
        salt,
        avatar: defaultAvatar,
        authProvider: "credentials",
        role: "user",
        createdAt: now,
        lastLoginAt: now,
      });

      userId = String(insertResult.insertedId);
    } else {
      // 2. In-Memory fallback
      if (inMemoryStore?.users?.has(email)) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in instead." },
          { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
        );
      }
      userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      inMemoryStore?.users?.set(email, {
        id: userId,
        name,
        email,
        passwordHash: hash,
        salt,
        avatar: defaultAvatar,
        authProvider: "credentials",
        role: "user",
        createdAt: now.toISOString(),
        lastLoginAt: now.toISOString(),
      });
    }

    const token = generateToken(userId, email);

    const user = {
      id: userId,
      name,
      email,
      avatar: defaultAvatar,
      authProvider: "credentials",
      createdAt: now.toISOString(),
      token,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user,
      },
      {
        status: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during registration" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
