import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";

// GET /api/auth/me
export async function GET(req: Request) {
  try {
    const result = await authenticate(req);
    if ("error" in result) return result.error;

    const { user } = result;
    return NextResponse.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    console.error("Auth me error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
