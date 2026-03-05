import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { analyzeCode } from "@/services/groqService";
import {
  hashCode,
  getCachedAnalysis,
  setCachedAnalysis,
  checkRateLimit,
  setJobState,
} from "@/services/cacheService";
import CodeReview from "@/models/CodeReview";
import crypto from "crypto";

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

    // Rate limiting
    const rateLimit = await checkRateLimit(user._id.toString());

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later.", resetIn: rateLimit.resetIn },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.resetIn),
          },
        }
      );
    }

    await connectDB();

    // Check cache
    const codeHash = hashCode(code, language);
    const cached = await getCachedAnalysis(codeHash);

    if (cached) {
      const review = await CodeReview.create({
        userId: user._id,
        language,
        codeHash,
        originalCode: code,
        fileName: fileName || "untitled",
        aiResponse: cached,
        score: cached.score,
        status: "completed",
      });

      return NextResponse.json(
        { reviewId: review._id, cached: true, ...cached },
        {
          headers: {
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.resetIn),
          },
        }
      );
    }

    // Generate job ID for status tracking
    const jobId = crypto.randomUUID();
    await setJobState(jobId, { status: "processing", startedAt: Date.now() });

    // Call Groq API
    const aiResponse = await analyzeCode(code, language);

    // Cache result
    await setCachedAnalysis(codeHash, aiResponse);

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

    await setJobState(jobId, { status: "completed" });

    return NextResponse.json(
      { reviewId: review._id, cached: false, ...aiResponse },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(rateLimit.resetIn),
        },
      }
    );
  } catch (err: any) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
