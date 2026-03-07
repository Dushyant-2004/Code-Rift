export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import CodeReview from "@/models/CodeReview";

// GET /api/dashboard/languages
export async function GET(req: NextRequest) {
  try {
    const result = await authenticate(req);
    if ("error" in result) return result.error;

    await connectDB();

    const languages = await CodeReview.distinct("language", {
      userId: result.user._id,
    });

    return NextResponse.json(languages);
  } catch (err: any) {
    console.error("Dashboard languages error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
