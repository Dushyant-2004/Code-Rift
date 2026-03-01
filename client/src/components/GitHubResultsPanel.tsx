"use client";

import { motion, AnimatePresence } from "framer-motion";
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
  OctagonAlert,
  ArrowRight,
  FileCode,
  CircleDot,
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
  meta?: {
    owner: string;
    repo: string;
    path: string;
    language: string;
    truncated: boolean;
    originalLength: number;
  };
}

interface GitHubResultsPanelProps {
  result: AnalysisResult;
  onClose: () => void;
  fileName?: string;
}

const typeConfig: Record<
  string,
  { icon: typeof Bug; label: string; color: string; bg: string; accent: string }
> = {
  bug: { icon: Bug, label: "Bug", color: "text-red-400", bg: "bg-red-500/8 border-red-500/15", accent: "border-l-red-500" },
  code_smell: { icon: AlertTriangle, label: "Code Smell", color: "text-yellow-400", bg: "bg-yellow-500/8 border-yellow-500/15", accent: "border-l-yellow-500" },
  performance: { icon: Zap, label: "Performance", color: "text-orange-400", bg: "bg-orange-500/8 border-orange-500/15", accent: "border-l-orange-500" },
  security: { icon: Shield, label: "Security", color: "text-rose-400", bg: "bg-rose-500/8 border-rose-500/15", accent: "border-l-rose-500" },
  readability: { icon: Eye, label: "Readability", color: "text-blue-400", bg: "bg-blue-500/8 border-blue-500/15", accent: "border-l-blue-500" },
  optimization: { icon: Lightbulb, label: "Optimization", color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/15", accent: "border-l-emerald-500" },
  syntax: { icon: Code2, label: "Syntax", color: "text-pink-400", bg: "bg-pink-500/8 border-pink-500/15", accent: "border-l-pink-500" },
  style: { icon: Paintbrush, label: "Style", color: "text-violet-400", bg: "bg-violet-500/8 border-violet-500/15", accent: "border-l-violet-500" },
  best_practice: { icon: BookOpen, label: "Best Practice", color: "text-teal-400", bg: "bg-teal-500/8 border-teal-500/15", accent: "border-l-teal-400" },
  error_handling: { icon: ShieldAlert, label: "Error Handling", color: "text-amber-400", bg: "bg-amber-500/8 border-amber-500/15", accent: "border-l-amber-400" },
  maintainability: { icon: Wrench, label: "Maintainability", color: "text-indigo-400", bg: "bg-indigo-500/8 border-indigo-500/15", accent: "border-l-indigo-400" },
  complexity: { icon: Layers, label: "Complexity", color: "text-cyan-400", bg: "bg-cyan-500/8 border-cyan-500/15", accent: "border-l-cyan-400" },
  other: { icon: HelpCircle, label: "Other", color: "text-gray-400", bg: "bg-gray-500/8 border-gray-500/15", accent: "border-l-gray-500" },
};

const severityConfig: Record<
  string,
  { label: string; color: string; dotColor: string; priority: number }
> = {
  critical: { label: "Critical", color: "text-red-400", dotColor: "bg-red-500", priority: 0 },
  high: { label: "High", color: "text-orange-400", dotColor: "bg-orange-500", priority: 1 },
  medium: { label: "Medium", color: "text-yellow-400", dotColor: "bg-yellow-500", priority: 2 },
  low: { label: "Low", color: "text-blue-400", dotColor: "bg-blue-400", priority: 3 },
  info: { label: "Info", color: "text-gray-400", dotColor: "bg-gray-400", priority: 4 },
};

export default function GitHubResultsPanel({
  result,
  onClose,
  fileName,
}: GitHubResultsPanelProps) {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "risks" | "improvements">("all");

  // Separate risk-level issues from improvement suggestions
  const riskIssues = result.issues.filter(
    (i) =>
      i.severity === "critical" ||
      i.severity === "high" ||
      i.type === "security" ||
      i.type === "bug"
  );
  const improvementIssues = result.issues.filter(
    (i) => !riskIssues.includes(i)
  );

  // Sort issues by severity
  const sortBySeverity = (issues: Issue[]) =>
    [...issues].sort(
      (a, b) =>
        (severityConfig[a.severity]?.priority ?? 3) -
        (severityConfig[b.severity]?.priority ?? 3)
    );

  const displayedIssues =
    activeTab === "risks"
      ? sortBySeverity(riskIssues)
      : activeTab === "improvements"
      ? sortBySeverity(improvementIssues)
      : sortBySeverity(result.issues);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.25 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
            <FileCode className="h-4 w-4 text-brand-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white leading-tight">
              File Analysis
            </h2>
            {fileName && (
              <p className="text-xs text-gray-500 font-mono mt-0.5">{fileName}</p>
            )}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </motion.button>
      </div>

      {result.cached && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500/8 border border-brand-500/15 text-brand-300 text-xs"
        >
          <Zap className="h-3.5 w-3.5" />
          Cached result — delivered instantly
        </motion.div>
      )}

      {/* Summary Card */}
      <motion.div
        variants={item}
        initial="hidden"
        animate="show"
        className="p-4 rounded-xl bg-surface-800/60 border border-white/5"
      >
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Summary
        </h3>
        <p className="text-sm text-gray-200 leading-relaxed">{result.summary}</p>
      </motion.div>

      {/* Risk Exposure Banner — only if there are critical/high/security issues */}
      {riskIssues.length > 0 && (
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          className="p-4 rounded-xl bg-red-500/5 border border-red-500/15"
        >
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-red-500/10 mt-0.5">
              <OctagonAlert className="h-4 w-4 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-red-400 mb-1">
                {riskIssues.length} Risk{riskIssues.length > 1 ? "s" : ""} Detected
              </h3>
              <ul className="space-y-1">
                {riskIssues.slice(0, 3).map((issue, i) => (
                  <li
                    key={i}
                    className="text-xs text-red-300/80 flex items-center gap-1.5"
                  >
                    <ArrowRight className="h-3 w-3 flex-shrink-0 text-red-500/60" />
                    <span className="truncate">{issue.title}</span>
                    {issue.line && (
                      <span className="text-red-500/40 font-mono text-[10px] flex-shrink-0">
                        L{issue.line}
                      </span>
                    )}
                  </li>
                ))}
                {riskIssues.length > 3 && (
                  <li className="text-[11px] text-red-500/50 pl-4">
                    +{riskIssues.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
        >
          <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Strengths
          </h3>
          <ul className="space-y-1.5">
            {result.strengths.map((s, i) => (
              <li
                key={i}
                className="text-sm text-emerald-200/80 flex items-start gap-2"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Tab Filter */}
      {result.issues.length > 0 && (
        <div className="flex items-center gap-1 p-1 bg-surface-800/60 rounded-lg border border-white/5 w-fit">
          {[
            { key: "all" as const, label: "All", count: result.issues.length },
            { key: "risks" as const, label: "Risks & Bugs", count: riskIssues.length },
            { key: "improvements" as const, label: "Improvements", count: improvementIssues.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-brand-500/15 text-brand-300 border border-brand-500/20"
                  : "text-gray-500 hover:text-gray-300 border border-transparent"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === tab.key
                      ? "bg-brand-500/20 text-brand-300"
                      : "bg-white/5 text-gray-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Findings List */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-2"
      >
        {displayedIssues.map((issue, idx) => {
          const config = typeConfig[issue.type] || typeConfig.other;
          const sev = severityConfig[issue.severity] || severityConfig.medium;
          const Icon = config.icon;
          const globalIdx = result.issues.indexOf(issue);
          const isExpanded = expandedIssue === globalIdx;

          return (
            <motion.div
              key={globalIdx}
              variants={item}
              className={`rounded-xl border-l-[3px] ${config.accent} bg-surface-800/40 border border-white/5 overflow-hidden hover:bg-surface-800/60 transition-colors`}
            >
              <button
                onClick={() =>
                  setExpandedIssue(isExpanded ? null : globalIdx)
                }
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">
                      {issue.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px]">
                      <CircleDot className={`h-2.5 w-2.5 ${sev.color}`} />
                      <span className={sev.color}>{sev.label}</span>
                    </span>
                    <span className="text-[10px] text-gray-600">·</span>
                    <span className="text-[11px] text-gray-500">
                      {config.label}
                    </span>
                    {issue.line && (
                      <>
                        <span className="text-[10px] text-gray-600">·</span>
                        <span className="text-[11px] text-gray-500 font-mono">
                          Line {issue.line}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-gray-600" />
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
                    <div className="px-4 pb-4 space-y-3 ml-7">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {issue.description}
                      </p>
                      {issue.suggestion && (
                        <div className="p-3 rounded-lg bg-brand-500/5 border border-brand-500/10">
                          <p className="text-[11px] font-semibold text-brand-400 uppercase tracking-wider mb-1">
                            Recommended Change
                          </p>
                          <p className="text-sm text-brand-200/80 leading-relaxed">
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

      {/* Empty states */}
      {result.issues.length === 0 && (
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          className="text-center py-8"
        >
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
          <p className="text-base font-medium text-emerald-400">
            No issues found
          </p>
          <p className="text-xs text-gray-500 mt-1">
            This file looks clean — no risks or improvements detected.
          </p>
        </motion.div>
      )}

      {result.issues.length > 0 && displayedIssues.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-6"
        >
          <p className="text-sm text-gray-500">
            No findings in this category.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
