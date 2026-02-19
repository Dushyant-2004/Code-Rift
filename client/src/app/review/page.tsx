"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import ResultsPanel from "@/components/ResultsPanel";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import MagneticButton from "@/components/MagneticButton";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import {
  Play,
  Upload,
  RotateCcw,
  ChevronDown,
  FileCode,
  Loader2,
} from "lucide-react";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => <div className="h-[500px] rounded-xl skeleton" />,
});

const LANGUAGES = [
  { value: "javascript", label: "JavaScript", ext: ".js" },
  { value: "typescript", label: "TypeScript", ext: ".ts" },
  { value: "python", label: "Python", ext: ".py" },
  { value: "java", label: "Java", ext: ".java" },
  { value: "cpp", label: "C++", ext: ".cpp" },
  { value: "c", label: "C", ext: ".c" },
  { value: "csharp", label: "C#", ext: ".cs" },
  { value: "go", label: "Go", ext: ".go" },
  { value: "rust", label: "Rust", ext: ".rs" },
  { value: "php", label: "PHP", ext: ".php" },
  { value: "ruby", label: "Ruby", ext: ".rb" },
  { value: "swift", label: "Swift", ext: ".swift" },
  { value: "kotlin", label: "Kotlin", ext: ".kt" },
  { value: "dart", label: "Dart", ext: ".dart" },
  { value: "html", label: "HTML", ext: ".html" },
  { value: "css", label: "CSS", ext: ".css" },
  { value: "sql", label: "SQL", ext: ".sql" },
  { value: "shell", label: "Shell/Bash", ext: ".sh" },
] as const;

const ACCEPTED_EXTENSIONS = LANGUAGES.map((l) => l.ext).join(",");

const DEFAULT_CODE = `// Paste your code here or upload a file
// Then click "Analyze Code" to get AI-powered feedback

function example() {
  console.log("Hello, CodeRift!");
}
`;

export default function ReviewPage() {
  const { user } = useAuth();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState("javascript");
  const [fileName, setFileName] = useState("untitled");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [langOpen, setLangOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lineCount = useMemo(() => code.split("\n").length, [code]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      const detected = LANGUAGES.find((l) => l.ext === ext);
      if (detected) setLanguage(detected.value);
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (content.length > 50000) {
          toast.error("File too large (max 50KB)");
          return;
        }
        setCode(content);
        toast.success(`Loaded ${file.name}`);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    []
  );

  const handleAnalyze = useCallback(async () => {
    if (!code.trim() || code === DEFAULT_CODE) {
      toast.error("Please enter some code to analyze");
      return;
    }

    try {
      setAnalyzing(true);
      setResult(null);
      const res = await api.analyzeCode(code, language, fileName);
      setResult(res);
      toast.success(res.cached ? "Results loaded from cache!" : "Analysis complete!");
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [code, language, fileName]);

  const handleReset = useCallback(() => {
    setCode(DEFAULT_CODE);
    setResult(null);
    setFileName("untitled");
    toast("Editor cleared", { icon: "🗑️" });
  }, []);

  const handleEditorChange = useCallback((value: string) => {
    setCode(value);
  }, []);

  const selectedLang = LANGUAGES.find((l) => l.value === language);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
              Code Review
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Paste code or upload a file for AI-powered analysis
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                onBlur={() => setTimeout(() => setLangOpen(false), 200)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-surface-800 border border-white/10 hover:border-white/20 rounded-xl text-xs sm:text-sm text-gray-300 hover:text-white transition-all min-w-[130px] sm:min-w-[160px]"
              >
                <FileCode className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-400" />
                <span className="truncate">{selectedLang?.label || "Language"}</span>
                <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-auto text-gray-500 flex-shrink-0" />
              </button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 sm:w-56 max-h-60 sm:max-h-72 overflow-auto rounded-xl bg-surface-800 border border-white/10 shadow-xl z-50"
                  >
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => {
                          setLanguage(l.value);
                          setLangOpen(false);
                        }}
                        className={`w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm transition-colors ${
                          language === l.value
                            ? "bg-brand-500/10 text-brand-400"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {l.label}
                        <span className="text-[10px] sm:text-xs text-gray-500 ml-2">{l.ext}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileUpload}
              className="hidden"
            />
            <MagneticButton
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-surface-800 border border-white/10 hover:border-white/20 rounded-xl text-xs sm:text-sm text-gray-300 hover:text-white transition-all"
            >
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Upload
            </MagneticButton>

            {/* Reset */}
            <MagneticButton
              onClick={handleReset}
              className="p-2 sm:p-2.5 bg-surface-800 border border-white/10 hover:border-white/20 rounded-xl text-gray-400 hover:text-white transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </MagneticButton>
          </div>
        </div>

        {/* Editor + Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Editor Panel */}
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-xl overflow-hidden border border-white/5 bg-surface-800/50">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-surface-900/50 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500/60" />
                  <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-[10px] sm:text-xs text-gray-500 ml-2 font-mono truncate">
                  {fileName}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-600 ml-auto flex-shrink-0">
                  {lineCount} lines
                </span>
              </div>
              <div className="h-[350px] sm:h-[450px] lg:h-[500px]">
                <CodeEditor
                  height="100%"
                  language={language}
                  value={code}
                  onChange={handleEditorChange}
                />
              </div>
            </div>

            {/* Analyze Button */}
            <MagneticButton
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-xl text-white font-semibold text-sm sm:text-base shadow-lg shadow-brand-500/20 transition-all"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                  Analyze Code
                </>
              )}
            </MagneticButton>
          </div>

          {/* Results Panel */}
          <div className="min-h-[300px] sm:min-h-[400px] lg:min-h-[560px]">
            <AnimatePresence mode="wait">
              {analyzing && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <LoadingSkeleton />
                </motion.div>
              )}

              {!analyzing && result && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                >
                  <ResultsPanel result={result} onClose={() => setResult(null)} />
                </motion.div>
              )}

              {!analyzing && !result && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex items-center justify-center"
                >
                  <div className="text-center py-12 sm:py-20">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Play className="h-6 w-6 sm:h-8 sm:w-8 text-brand-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-300 mb-2">
                      Ready to Analyze
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 max-w-xs sm:max-w-sm mx-auto">
                      Write or paste code in the editor, select the language, and
                      click &quot;Analyze Code&quot; to get started.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
