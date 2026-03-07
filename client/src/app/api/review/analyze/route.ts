export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { analyzeCode } from "@/services/groqService";
import { hashCode } from "@/services/cacheService";
import CodeReview from "@/models/CodeReview";

// POST /api/review/analyze
export async function POST(req: Request) {
  try {
    const result = await authenticate(req);
    if ("error" in result) return result.error;

    const { user } = result;
    const { code, language, fileName } = await req.json();

    if (!code || !language) {
      return NextResponse.json({ error: "Code and language are required" }, { status: 400 });
    }

    if (code.length > 50000) {
      return NextResponse.json({ error: "Code exceeds maximum length (50,000 chars)" }, { status: 400 });
    }

    await connectDB();

    const codeHash = hashCode(code, language);

    // Call Groq API
    const aiResponse = await analyzeCode(code, language);

    // Save to MongoDB
    const review = await CodeReview.create({
      userId: user._id,
      language,
      codeHash,
      originalCode: code,
      fileName: fileName || "untitled",
      aiResponse,
      score: aiResponse.score,
      status: "completed",
    });

    return NextResponse.json({ reviewId: review._id, ...aiResponse });
  } catch (err: any) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
