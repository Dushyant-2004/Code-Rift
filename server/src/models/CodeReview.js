const mongoose = require("mongoose");

const VALID_ISSUE_TYPES = [
  "bug",
  "code_smell",
  "performance",
  "security",
  "readability",
  "optimization",
  "syntax",
  "style",
  "best_practice",
  "error_handling",
  "maintainability",
  "complexity",
  "other",
];

const issueSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: VALID_ISSUE_TYPES,
    required: true,
  },
  severity: {
    type: String,
    enum: ["critical", "high", "medium", "low", "info"],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  line: { type: Number, default: null },
  suggestion: { type: String, default: "" },
});

const codeReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      trim: true,
    },
    codeHash: {
      type: String,
      required: true,
      index: true,
    },
    originalCode: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      default: "untitled",
    },
    aiResponse: {
      summary: { type: String, default: "" },
      issues: [issueSchema],
      score: { type: Number, min: 0, max: 100, default: 0 },
      strengths: [{ type: String }],
      overallRating: { type: String, default: "" },
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient dashboard queries
codeReviewSchema.index({ userId: 1, createdAt: -1 });
codeReviewSchema.index({ userId: 1, language: 1 });
codeReviewSchema.index({ userId: 1, score: -1 });

module.exports = mongoose.model("CodeReview", codeReviewSchema);
