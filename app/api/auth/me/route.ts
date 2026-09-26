import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    let token = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      // Check query param if present
      const url = new URL(req.url);
      token = url.searchParams.get("token") || "";
    }

    if (!token) {
      return NextResponse.json(
        { user: null },
        { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const user = await getUserFromToken(token);
    return NextResponse.json(
      { user },
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error: any) {
    console.error("Auth Me API error:", error);
    return NextResponse.json(
      { user: null, error: error?.message },
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get("authorization");
    let token = body.token || "";

    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        { user: null },
        { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const user = await getUserFromToken(token);
    return NextResponse.json(
      { user },
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { user: null, error: error?.message },
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
