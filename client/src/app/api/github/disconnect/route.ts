import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

// POST /api/github/disconnect
export async function POST(req: NextRequest) {
  try {
    const result = await authenticate(req);
    if ("error" in result) return result.error;

    await connectDB();

    await User.findByIdAndUpdate(result.user._id, {
      githubAccessToken: null,
      githubUsername: null,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[GitHub] disconnect error:", err);
    return NextResponse.json({ error: "Failed to disconnect GitHub" }, { status: 500 });
  }
}
