export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import CodeReview from "@/models/CodeReview";

// GET /api/review/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await authenticate(req);
    if ("error" in result) return result.error;

    await connectDB();

    const review = await CodeReview.findOne({
      _id: params.id,
      userId: result.user._id,
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (err: any) {
    console.error("Get review error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
