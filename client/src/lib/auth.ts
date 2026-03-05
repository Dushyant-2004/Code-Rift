import getFirebaseAdmin from "@/lib/firebaseAdmin";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";

export interface AuthenticatedUser {
  _id: string;
  firebaseUid: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  createdAt: string;
}

export async function authenticate(
  req: Request
): Promise<{ user: AuthenticatedUser } | { error: NextResponse }> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: NextResponse.json({ error: "No token provided" }, { status: 401 }) };
    }

    const token = authHeader.split("Bearer ")[1];
    const admin = getFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(token);

    await connectDB();

    let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name || decoded.email?.split("@")[0] || "User",
        email: decoded.email,
        avatar: decoded.picture || "",
      });
    }

    return { user: user.toObject() as unknown as AuthenticatedUser };
  } catch {
    return { error: NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }) };
  }
}
