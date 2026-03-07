export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import CodeReview from "@/models/CodeReview";

// GET /api/dashboard/reviews
export async function GET(req: NextRequest) {
  try {
    const result = await authenticate(req);
    if ("error" in result) return result.error;

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const language = searchParams.get("language");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const filter: any = { userId: result.user._id, status: "completed" };
    if (language && language !== "all") {
      filter.language = language;
    }

    const sortOptions: any = {};
    if (sortBy === "score") {
      sortOptions.score = order === "asc" ? 1 : -1;
    } else {
      sortOptions.createdAt = order === "asc" ? 1 : -1;
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      CodeReview.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select("-originalCode")
        .lean(),
      CodeReview.countDocuments(filter),
    ]);

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error("Dashboard reviews error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
