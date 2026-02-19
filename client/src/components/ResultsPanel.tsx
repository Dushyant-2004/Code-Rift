"use client";

import { motion, AnimatePresence } from "framer-motion";
import ScoreGauge from "./ScoreGauge";
import {
  Bug,
  AlertTriangle,
  Zap,
  Shield,
  Eye,
  Lightbulb,
  ChevronDown,
  CheckCircle2,
  X,
  Code2,
  Paintbrush,
  BookOpen,
  ShieldAlert,
  Wrench,
  Layers,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";

interface Issue {
  type: string;
  severity: string;
  title: string;
  description: string;
  line: number | null;
  suggestion: string;
}

interface AnalysisResult {
  summary: string;
  score: number;
  overallRating: string;
  strengths: string[];
  issues: Issue[];
  cached?: boolean;
  reviewId?: string;
}

interface ResultsPanelProps {
  result: AnalysisResult;
  onClose: () => void;
}

const typeConfig: Record<string, { icon: typeof Bug; color: string; bg: string }> = {
  bug: { icon: Bug, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  code_smell: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  performance: { icon: Zap, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  security: { icon: Shield, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  readability: { icon: Eye, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  optimization: { icon: Lightbulb, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  syntax: { icon: Code2, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  style: { icon: Paintbrush, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  best_practice: { icon: BookOpen, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20" },
  error_handling: { icon: ShieldAlert, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  maintainability: { icon: Wrench, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  complexity: { icon: Layers, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  other: { icon: HelpCircle, color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/20" },
};

const severityColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  low: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  info: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

export default function ResultsPanel({ result, onClose }: ResultsPanelProps) {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, x: 30 },
    show: { opacity: 1, x: 0, transition: { type: "spring", bounce: 0.3 } },
  };

  const issuesByType = result.issues.reduce<Record<string, number>>((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-2xl font-bold text-white">Analysis Results</h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </motion.button>
      </div>

      {result.cached && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm"
        >
          <Zap className="h-4 w-4" />
          Cached result — delivered instantly
        </motion.div>
      )}

      {/* Score + Summary Card */}
      <motion.div
        variants={item}
        initial="hidden"
        animate="show"
        className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl bg-surface-800/50 border border-white/5 backdrop-blur-sm"
      >
        <ScoreGauge score={result.score} />
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-semibold text-white mb-2">
            {result.overallRating}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {result.summary}
          </p>
        </div>
      </motion.div>

      {/* Issue Type Breakdown */}
      {Object.keys(issuesByType).length > 0 && (
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 gap-2"
        >
          {Object.entries(issuesByType).map(([type, count]) => {
            const config = typeConfig[type] || typeConfig.code_smell;
            const Icon = config.icon;
            return (
              <div
                key={type}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bg}`}
              >
                <Icon className={`h-4 w-4 ${config.color}`} />
                <span className={`text-sm font-medium ${config.color}`}>
                  {count} {type.replace("_", " ")}
                </span>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
        >
          <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Strengths
          </h3>
          <ul className="space-y-1.5">
            {result.strengths.map((s, i) => (
              <li key={i} className="text-sm text-emerald-200/80 flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Issues List */}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        {result.issues.map((issue, idx) => {
          const config = typeConfig[issue.type] || typeConfig.code_smell;
          const Icon = config.icon;
          const isExpanded = expandedIssue === idx;

          return (
            <motion.div
              key={idx}
              variants={item}
              className={`rounded-xl border bg-surface-800/50 border-white/5 overflow-hidden transition-colors hover:border-white/10`}
            >
              <button
                onClick={() => setExpandedIssue(isExpanded ? null : idx)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className={`p-2 rounded-lg ${config.bg} border`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">
                      {issue.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        severityColors[issue.severity] || severityColors.medium
                      }`}
                    >
                      {issue.severity}
                    </span>
                    {issue.line && (
                      <span className="text-[11px] text-gray-500 font-mono">
                        Line {issue.line}
                      </span>
                    )}
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {issue.description}
                      </p>
                      {issue.suggestion && (
                        <div className="p-3 rounded-lg bg-brand-500/5 border border-brand-500/10">
                          <p className="text-xs font-medium text-brand-400 mb-1">
                            💡 Suggestion
                          </p>
                          <p className="text-sm text-brand-200/80">
                            {issue.suggestion}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {result.issues.length === 0 && (
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          className="text-center py-8 text-gray-500"
        >
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
          <p className="text-lg font-medium text-emerald-400">No issues found!</p>
          <p className="text-sm text-gray-500 mt-1">Your code looks clean.</p>
        </motion.div>
      )}
    </motion.div>
  );
}
