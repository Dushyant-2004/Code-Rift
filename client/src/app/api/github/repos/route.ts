export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { listRepos } from "@/services/githubService";
import User from "@/models/User";

// GET /api/github/repos
export async function GET(req: NextRequest) {
  try {
    const result = await authenticate(req);
    if ("error" in result) return result.error;

    await connectDB();

    const user = await User.findById(result.user._id).select("githubAccessToken");
    if (!user?.githubAccessToken) {
      return NextResponse.json({ error: "GitHub not connected" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const sort = searchParams.get("sort") || "updated";
    const repos = await listRepos(user.githubAccessToken, page, 30, sort);

    const search = (searchParams.get("search") || "").toLowerCase();
    const filtered = search
      ? repos.filter(
          (r: any) =>
            r.name.toLowerCase().includes(search) ||
            (r.description || "").toLowerCase().includes(search)
        )
      : repos;

    return NextResponse.json({ repos: filtered });
  } catch (err: any) {
    console.error("[GitHub] repos error:", err);
    if (err.message?.includes("401")) {
      return NextResponse.json({ error: "GitHub token expired. Please reconnect." }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 });
  }
}
