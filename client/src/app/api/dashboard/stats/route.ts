export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import CodeReview from "@/models/CodeReview";

// GET /api/dashboard/stats
export async function GET(req: NextRequest) {
  try {
    const result = await authenticate(req);
    if ("error" in result) return result.error;

    await connectDB();

    const userId = result.user._id;

    const [totalReviews, avgScore, languageBreakdown, recentActivity] =
      await Promise.all([
        CodeReview.countDocuments({ userId, status: "completed" }),
        CodeReview.aggregate([
          { $match: { userId, status: "completed" } },
          { $group: { _id: null, avg: { $avg: "$score" } } },
        ]),
        CodeReview.aggregate([
          { $match: { userId, status: "completed" } },
          { $group: { _id: "$language", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        CodeReview.find({ userId, status: "completed" })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("language score fileName createdAt")
          .lean(),
      ]);

    return NextResponse.json({
      totalReviews,
      averageScore: Math.round(avgScore[0]?.avg || 0),
      languageBreakdown: languageBreakdown.map((l: any) => ({
        language: l._id,
        count: l.count,
      })),
      recentActivity,
    });
  } catch (err: any) {
    console.error("Dashboard stats error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
