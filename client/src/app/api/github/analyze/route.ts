export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getFileContent } from "@/services/githubService";
import { analyzeCode } from "@/services/groqService";
import User from "@/models/User";

const langMap: Record<string, string> = {
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  ts: "typescript", tsx: "typescript",
  py: "python", pyw: "python",
  java: "java", kt: "kotlin", kts: "kotlin",
  go: "go", rs: "rust", rb: "ruby",
  php: "php", c: "c", h: "c",
  cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp",
  cs: "csharp", swift: "swift", dart: "dart",
  html: "html", css: "css", scss: "scss",
  json: "json", yaml: "yaml", yml: "yaml",
  sql: "sql", sh: "shell", bash: "shell",
  vue: "vue", svelte: "svelte",
};

// POST /api/github/analyze
export async function POST(req: NextRequest) {
  try {
    const result = await authenticate(req);
    if ("error" in result) return result.error;

    await connectDB();

    const user = await User.findById(result.user._id).select("githubAccessToken");
    if (!user?.githubAccessToken) {
      return NextResponse.json({ error: "GitHub not connected" }, { status: 401 });
    }

    const { owner, repo, path: filePath, branch } = await req.json();
    if (!owner || !repo || !filePath) {
      return NextResponse.json({ error: "owner, repo, and path are required" }, { status: 400 });
    }

    const content = await getFileContent(user.githubAccessToken, owner, repo, filePath);

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "File is empty or could not be read" }, { status: 400 });
    }

    const MAX_CHARS = 12000;
    const truncated = content.length > MAX_CHARS;
    const codeToAnalyze = truncated ? content.substring(0, MAX_CHARS) : content;

    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const language = langMap[ext] || ext || "text";

    const analysis = await analyzeCode(codeToAnalyze, language);

    return NextResponse.json({
      ...analysis,
      meta: { owner, repo, path: filePath, language, truncated, originalLength: content.length },
    });
  } catch (err: any) {
    console.error("[GitHub] analyze error:", err);
    if (err.message?.includes("401")) {
      return NextResponse.json({ error: "GitHub token expired. Please reconnect." }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || "Failed to analyze file" }, { status: 500 });
  }
}
