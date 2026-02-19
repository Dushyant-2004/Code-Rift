const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const User = require("../models/User");

// POST /api/auth/sync — sync Firebase user with MongoDB
router.post("/sync", authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — get current user
router.get("/me", authenticate, async (req, res, next) => {
  try {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
      createdAt: req.user.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
