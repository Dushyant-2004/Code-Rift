import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getFileContent } from "@/services/githubService";
import User from "@/models/User";

const langMap: Record<string, string> = {
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  ts: "typescript", tsx: "typescript",
  py: "python", pyw: "python",
  java: "java", kt: "kotlin", kts: "kotlin",
  go: "go", rs: "rust", rb: "ruby", erb: "ruby",
  php: "php", c: "c", h: "c",
  cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp",
  cs: "csharp", swift: "swift", dart: "dart",
  html: "html", htm: "html",
  css: "css", scss: "scss", sass: "sass", less: "less",
  json: "json", yaml: "yaml", yml: "yaml", toml: "toml", xml: "xml",
  md: "markdown", sql: "sql",
  sh: "shell", bash: "shell", zsh: "shell",
  dockerfile: "dockerfile", lua: "lua", r: "r",
  scala: "scala", vue: "vue", svelte: "svelte",
};

// GET /api/github/repos/[owner]/[repo]/file
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
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json({ error: "path query parameter is required" }, { status: 400 });
    }

    const content = await getFileContent(user.githubAccessToken, params.owner, params.repo, filePath);

    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const language = langMap[ext] || ext || "text";

    return NextResponse.json({ content, language, path: filePath });
  } catch (err: any) {
    console.error("[GitHub] file content error:", err);
    if (err.message?.includes("401")) {
      return NextResponse.json({ error: "GitHub token expired. Please reconnect." }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || "Failed to fetch file content" }, { status: 500 });
  }
}
