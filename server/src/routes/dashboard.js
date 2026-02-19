const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const CodeReview = require("../models/CodeReview");

// GET /api/dashboard/reviews — list user's reviews
router.get("/reviews", authenticate, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      language,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = { userId: req.user._id, status: "completed" };
    if (language && language !== "all") {
      filter.language = language;
    }

    const sortOptions = {};
    if (sortBy === "score") {
      sortOptions.score = order === "asc" ? 1 : -1;
    } else {
      sortOptions.createdAt = order === "asc" ? 1 : -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      CodeReview.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select("-originalCode")
        .lean(),
      CodeReview.countDocuments(filter),
    ]);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/stats — user statistics
router.get("/stats", authenticate, async (req, res, next) => {
  try {
    const userId = req.user._id;

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

    res.json({
      totalReviews,
      averageScore: Math.round(avgScore[0]?.avg || 0),
      languageBreakdown: languageBreakdown.map((l) => ({
        language: l._id,
        count: l.count,
      })),
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/languages — distinct languages used
router.get("/languages", authenticate, async (req, res, next) => {
  try {
    const languages = await CodeReview.distinct("language", {
      userId: req.user._id,
    });
    res.json(languages);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
