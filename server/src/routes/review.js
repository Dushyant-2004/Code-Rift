const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { analyzeCode } = require("../services/groqService");
const {
  hashCode,
  getCachedAnalysis,
  setCachedAnalysis,
  checkRateLimit,
  setJobState,
} = require("../services/cacheService");
const CodeReview = require("../models/CodeReview");
const crypto = require("crypto");

// POST /api/review/analyze — analyze code
router.post("/analyze", authenticate, async (req, res, next) => {
  try {
    const { code, language, fileName } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: "Code and language are required" });
    }

    if (code.length > 50000) {
      return res.status(400).json({ error: "Code exceeds maximum length (50,000 chars)" });
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(req.user._id.toString());
    res.set("X-RateLimit-Remaining", rateLimit.remaining);
    res.set("X-RateLimit-Reset", rateLimit.resetIn);

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please try again later.",
        resetIn: rateLimit.resetIn,
      });
    }

    // Check cache
    const codeHash = hashCode(code, language);
    const cached = await getCachedAnalysis(codeHash);

    if (cached) {
      // Save to history even if cached
      const review = await CodeReview.create({
        userId: req.user._id,
        language,
        codeHash,
        originalCode: code,
        fileName: fileName || "untitled",
        aiResponse: cached,
        score: cached.score,
        status: "completed",
      });

      return res.json({
        reviewId: review._id,
        cached: true,
        ...cached,
      });
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
      userId: req.user._id,
      language,
      codeHash,
      originalCode: code,
      fileName: fileName || "untitled",
      aiResponse,
      score: aiResponse.score,
      status: "completed",
    });

    await setJobState(jobId, { status: "completed" });

    res.json({
      reviewId: review._id,
      cached: false,
      ...aiResponse,
    });
  } catch (err) {
    console.error("Analysis error:", err);
    next(err);
  }
});

// GET /api/review/:id — get a specific review
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const review = await CodeReview.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(review);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
