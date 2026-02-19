const admin = require("../config/firebase");
const User = require("../models/User");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    // Find or create user in MongoDB
    let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name || decoded.email?.split("@")[0] || "User",
        email: decoded.email,
        avatar: decoded.picture || "",
      });
    }

    req.user = user;
    req.firebaseUser = decoded;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
