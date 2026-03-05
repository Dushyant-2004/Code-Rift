import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getRepoTree } from "@/services/githubService";
import User from "@/models/User";

// GET /api/github/repos/[owner]/[repo]/tree
export async function GET(
  req: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const result = await authenticate(req);
    if ("error" in result) return result.error;

    await connectDB();

    const user = await User.findById(result.user._id).select("githubAccessToken");
    if (!user?.githubAccessToken) {
      return NextResponse.json({ error: "GitHub not connected" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch") || "main";
    const tree = await getRepoTree(user.githubAccessToken, params.owner, params.repo, branch);

    return NextResponse.json({ tree });
  } catch (err: any) {
    console.error("[GitHub] tree error:", err);
    return NextResponse.json({ error: "Failed to fetch repository tree" }, { status: 500 });
  }
}
