"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import ResultsPanel from "@/components/ResultsPanel";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import toast from "react-hot-toast";
import { ArrowLeft, FileCode, Copy, Check } from "lucide-react";
import dynamic from "next/dynamic";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => <div className="h-[400px] rounded-xl skeleton" />,
});

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchReview() {
      try {
        setLoading(true);
        const data = await api.getReview(params.id as string);
        setReview(data);
      } catch (err: any) {
        toast.error(err.message || "Failed to load review");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchReview();
  }, [params.id, router]);

  const handleCopy = useCallback(async () => {
    if (!review?.originalCode) return;
    await navigator.clipboard.writeText(review.originalCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Code copied!");
  }, [review?.originalCode]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!review) return null;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">{review.fileName}</h1>
              <span className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-300 text-[10px] sm:text-xs font-medium uppercase flex-shrink-0">
                {review.language}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
              Reviewed on {new Date(review.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Code */}
          <div>
            <div className="rounded-xl overflow-hidden border border-white/5 bg-surface-800/50">
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-surface-900/50 border-b border-white/5">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs text-gray-500 font-mono truncate">{review.fileName}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors text-[10px] sm:text-xs flex-shrink-0"
                >
                  {copied ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="h-[350px] sm:h-[450px] lg:h-[500px]">
                <CodeEditor
                  height="100%"
                  language={review.language}
                  value={review.originalCode}
                  readOnly
                  fontSize={13}
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div>
            <ResultsPanel
              result={review.aiResponse}
              onClose={() => router.push("/dashboard")}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
