export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CALLBACK_URL =
  process.env.GITHUB_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/github/callback`;

// GET /api/github/auth-url
export async function GET(req: NextRequest) {
  try {
    const result = await authenticate(req);
    if ("error" in result) return result.error;

    if (!GITHUB_CLIENT_ID) {
      return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 500 });
    }

    const state = result.user._id.toString();
    const url =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${GITHUB_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}` +
      `&scope=repo,read:user` +
      `&state=${state}`;

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("[GitHub] auth-url error:", err);
    return NextResponse.json({ error: "Failed to generate GitHub auth URL" }, { status: 500 });
  }
}
