"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ScoreGauge from "@/components/ScoreGauge";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  BarChart3,
  Code2,
  Clock,
  TrendingUp,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  FileCode,
  Search,
} from "lucide-react";

interface Review {
  _id: string;
  language: string;
  fileName: string;
  score: number;
  aiResponse: { summary: string; issues: any[] };
  createdAt: string;
}

interface Stats {
  totalReviews: number;
  averageScore: number;
  languageBreakdown: { language: string; count: number }[];
  recentActivity: any[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterLang, setFilterLang] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, reviewsRes, langsRes] = await Promise.all([
        api.getStats(),
        api.getReviews({ page, limit: 10, language: filterLang, sortBy, order: sortOrder }),
        api.getLanguages(),
      ]);
      setStats(statsRes);
      setReviews(reviewsRes.reviews);
      setTotalPages(reviewsRes.pagination.pages);
      setLanguages(langsRes);
    } catch (err: any) {
      toast.error(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [page, filterLang, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getScoreColor = useCallback((score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-blue-400";
    if (score >= 50) return "text-yellow-400";
    if (score >= 30) return "text-orange-400";
    return "text-red-400";
  }, []);

  const formatDate = useCallback((d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }), []);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (loading && !stats) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="skeleton h-8 w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-5 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Your code review history and analytics
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-8"
          >
            <motion.div
              variants={item}
              className="p-3 sm:p-5 rounded-xl bg-surface-800/50 border border-white/5"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-400" />
                </div>
                <span className="text-xs sm:text-sm text-gray-400">Total Reviews</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalReviews}</p>
            </motion.div>

            <motion.div
              variants={item}
              className="p-3 sm:p-5 rounded-xl bg-surface-800/50 border border-white/5"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                </div>
                <span className="text-xs sm:text-sm text-gray-400">Avg Score</span>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${getScoreColor(stats.averageScore)}`}>
                {stats.averageScore}
              </p>
            </motion.div>

            <motion.div
              variants={item}
              className="p-3 sm:p-5 rounded-xl bg-surface-800/50 border border-white/5"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Code2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400" />
                </div>
                <span className="text-xs sm:text-sm text-gray-400">Languages</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">
                {stats.languageBreakdown.length}
              </p>
            </motion.div>

            <motion.div
              variants={item}
              className="p-3 sm:p-5 rounded-xl bg-surface-800/50 border border-white/5"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400" />
                </div>
                <span className="text-xs sm:text-sm text-gray-400">Last Review</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-white">
                {stats.recentActivity[0]
                  ? formatDate(stats.recentActivity[0].createdAt)
                  : "No reviews yet"}
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Language Breakdown */}
        {stats && stats.languageBreakdown.length > 0 && (
          <motion.div
            variants={item}
            initial="hidden"
            animate="show"
            className="mb-5 sm:mb-8 p-3 sm:p-5 rounded-xl bg-surface-800/50 border border-white/5"
          >
            <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-3 sm:mb-4">Language Breakdown</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {stats.languageBreakdown.map((lb) => (
                <div
                  key={lb.language}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-700/50 border border-white/5"
                >
                  <FileCode className="h-3.5 w-3.5 text-brand-400" />
                  <span className="text-sm text-gray-300 capitalize">{lb.language}</span>
                  <span className="text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                    {lb.count}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <h2 className="text-base sm:text-lg font-semibold text-white">Review History</h2>
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            {/* Language Filter */}
            <select
              value={filterLang}
              onChange={(e) => { setFilterLang(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-surface-800 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-brand-500/50 appearance-none cursor-pointer"
            >
              <option value="all">All Languages</option>
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split("-");
                setSortBy(s);
                setSortOrder(o);
                setPage(1);
              }}
              className="px-3 py-2 bg-surface-800 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-brand-500/50 appearance-none cursor-pointer"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="score-desc">Highest Score</option>
              <option value="score-asc">Lowest Score</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-12 w-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 font-medium">No reviews found</p>
            <p className="text-sm text-gray-500 mt-1">
              Start by analyzing some code on the{" "}
              <Link href="/review" className="text-brand-400 hover:underline">
                Review page
              </Link>
            </p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {reviews.map((review) => (
              <motion.div
                key={review._id}
                variants={item}
                whileHover={{ scale: 1.005 }}
                className="group"
              >
                <Link href={`/review/${review._id}`}>
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-surface-800/50 border border-white/5 hover:border-brand-500/20 transition-all cursor-pointer">
                    {/* Score */}
                    <div className="flex-shrink-0">
                      <div
                        className={`text-xl sm:text-2xl font-bold ${getScoreColor(review.score)} w-10 sm:w-14 text-center`}
                      >
                        {review.score}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                        <span className="text-xs sm:text-sm font-medium text-white truncate">
                          {review.fileName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-300 text-[11px] font-medium uppercase">
                          {review.language}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {review.aiResponse?.summary || "No summary"}
                      </p>
                    </div>

                    {/* Issues Count + Date */}
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-500">
                        {review.aiResponse?.issues?.length || 0} issues
                      </span>
                      <span className="text-xs text-gray-600">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>

                    <ExternalLink className="h-4 w-4 text-gray-600 group-hover:text-brand-400 transition-colors flex-shrink-0" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-surface-800 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-surface-800 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
