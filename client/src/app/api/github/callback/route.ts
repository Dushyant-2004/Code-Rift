import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { exchangeCodeForToken, getGitHubUser } from "@/services/githubService";
import User from "@/models/User";

const CLIENT_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// GET /api/github/callback
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${CLIENT_URL}/github?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${CLIENT_URL}/github?error=no_code`);
  }

  try {
    await connectDB();

    const accessToken = await exchangeCodeForToken(code);
    const ghUser = await getGitHubUser(accessToken);

    if (state) {
      await User.findByIdAndUpdate(state, {
        githubAccessToken: accessToken,
        githubUsername: ghUser.login,
      });
    }

    return NextResponse.redirect(`${CLIENT_URL}/github?connected=true`);
  } catch (err: any) {
    console.error("[GitHub] callback error:", err);
    return NextResponse.redirect(
      `${CLIENT_URL}/github?error=${encodeURIComponent(err.message || "auth_failed")}`
    );
  }
}
