import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

// GET /api/github/status
export async function GET(req: NextRequest) {
  try {
    const result = await authenticate(req);
    if ("error" in result) return result.error;

    await connectDB();

    const user = await User.findById(result.user._id).select("githubAccessToken githubUsername");
    return NextResponse.json({
      connected: !!user?.githubAccessToken,
      username: user?.githubUsername || null,
    });
  } catch (err: any) {
    console.error("[GitHub] status error:", err);
    return NextResponse.json({ error: "Failed to check GitHub status" }, { status: 500 });
  }
}
