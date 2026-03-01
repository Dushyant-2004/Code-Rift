"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RepoTree from "@/components/RepoTree";
import GitHubResultsPanel from "@/components/GitHubResultsPanel";
import MagneticButton from "@/components/MagneticButton";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import {
  Github,
  Search,
  Loader2,
  Sparkles,
  ArrowLeft,
  Star,
  GitFork,
  Lock,
  Globe,
  FolderTree,
  ChevronRight,
  Unplug,
  RefreshCw,
  AlertTriangle,
  FileCode,
  Eye,
} from "lucide-react";

interface Repo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
  isPrivate: boolean;
  defaultBranch: string;
  htmlUrl: string;
}

interface TreeItem {
  path: string;
  type: "file" | "folder";
  size: number;
}

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

const LANG_COLORS: Record<string, string> = {
  JavaScript: "bg-yellow-400",
  TypeScript: "bg-blue-400",
  Python: "bg-green-400",
  Java: "bg-red-400",
  Go: "bg-cyan-400",
  Rust: "bg-orange-400",
  Ruby: "bg-red-500",
  PHP: "bg-purple-400",
  "C++": "bg-pink-400",
  C: "bg-gray-400",
  "C#": "bg-purple-500",
  Swift: "bg-orange-500",
  Kotlin: "bg-purple-300",
  Dart: "bg-sky-400",
  HTML: "bg-orange-300",
  CSS: "bg-blue-300",
  Shell: "bg-green-300",
};

export default function GitHubPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  // Connection state
  const [connected, setConnected] = useState(false);
  const [ghUsername, setGhUsername] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Repo list state
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected repo state
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [tree, setTree] = useState<TreeItem[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);

  // Single file state
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLanguage, setFileLanguage] = useState<string>("text");
  const [loadingFile, setLoadingFile] = useState(false);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Check connection status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const status = await api.getGitHubStatus();
        setConnected(status.connected);
        setGhUsername(status.username);
        if (status.connected) {
          fetchRepos();
        }
      } catch (err) {
        console.error("Failed to check GitHub status:", err);
      } finally {
        setCheckingStatus(false);
      }
    }
    if (user && !authLoading) checkStatus();
    else if (!authLoading && !user) setCheckingStatus(false);
  }, [user, authLoading]);

  // Handle callback query params
  useEffect(() => {
    const connectedParam = searchParams.get("connected");
    const errorParam = searchParams.get("error");

    if (connectedParam === "true") {
      setConnected(true);
      toast.success("GitHub connected successfully!");
      fetchRepos();
      window.history.replaceState({}, "", "/github");
    }
    if (errorParam) {
      toast.error(`GitHub connection failed: ${errorParam}`);
      window.history.replaceState({}, "", "/github");
    }
  }, [searchParams]);

  const fetchRepos = useCallback(async () => {
    try {
      setLoadingRepos(true);
      const data = await api.getGitHubRepos({ search: searchQuery });
      setRepos(data.repos || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch repos");
    } finally {
      setLoadingRepos(false);
    }
  }, [searchQuery]);

  const handleConnect = useCallback(async () => {
    try {
      const data = await api.getGitHubAuthUrl();
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to start GitHub connection");
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    try {
      await api.disconnectGitHub();
      setConnected(false);
      setGhUsername(null);
      setRepos([]);
      setSelectedRepo(null);
      setTree([]);
      setSelectedFile(null);
      setFileContent(null);
      setAnalysisResult(null);
      toast.success("GitHub disconnected");
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect");
    }
  }, []);

  const handleSelectRepo = useCallback(async (repo: Repo) => {
    setSelectedRepo(repo);
    setTree([]);
    setSelectedFile(null);
    setFileContent(null);
    setAnalysisResult(null);

    try {
      setLoadingTree(true);
      const data = await api.getRepoTree(repo.owner, repo.name, repo.defaultBranch);
      setTree(data.tree || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load repo tree");
    } finally {
      setLoadingTree(false);
    }
  }, []);

  // When a file is selected in the tree, fetch its content for preview
  const handleTreeSelect = useCallback(
    async (path: string, type: "file" | "folder") => {
      // Only allow selecting files
      if (type !== "file" || !selectedRepo) return;

      // Toggle off if same file clicked again
      if (selectedFile === path) {
        setSelectedFile(null);
        setFileContent(null);
        setAnalysisResult(null);
        return;
      }

      setSelectedFile(path);
      setFileContent(null);
      setAnalysisResult(null);

      try {
        setLoadingFile(true);
        const data = await api.getGitHubFileContent(
          selectedRepo.owner,
          selectedRepo.name,
          path
        );
        setFileContent(data.content);
        setFileLanguage(data.language || "text");
      } catch (err: any) {
        toast.error(err.message || "Failed to load file");
        setSelectedFile(null);
      } finally {
        setLoadingFile(false);
      }
    },
    [selectedRepo, selectedFile]
  );

  // Analyze the currently selected file
  const handleAnalyze = useCallback(async () => {
    if (!selectedRepo || !selectedFile) return;

    try {
      setAnalyzing(true);
      setAnalysisResult(null);
      const data = await api.analyzeGitHubFile(
        selectedRepo.owner,
        selectedRepo.name,
        selectedFile,
        selectedRepo.defaultBranch
      );
      setAnalysisResult(data);
      toast.success("File analysis complete!");
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [selectedRepo, selectedFile]);

  const handleBack = useCallback(() => {
    setSelectedRepo(null);
    setTree([]);
    setSelectedFile(null);
    setFileContent(null);
    setAnalysisResult(null);
  }, []);

  const handleCloseResults = useCallback(() => {
    setAnalysisResult(null);
  }, []);

  const filteredRepos = searchQuery
    ? repos.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : repos;

  // Loading state
  if (checkingStatus) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
          <span className="text-sm text-gray-400">Checking GitHub connection...</span>
        </div>
      </div>
    );
  }

  // Not connected — show connect screen
  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Github className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Connect Your GitHub
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto mb-8">
            Link your GitHub account to browse repositories and get AI-powered
            code review on any file — select a file, analyze it, and get instant
            feedback with scores, issues, and suggestions.
          </p>
          <MagneticButton
            onClick={handleConnect}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm sm:text-base shadow-lg"
          >
            <Github className="h-5 w-5" />
            Connect with GitHub
          </MagneticButton>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Secure OAuth
            </div>
            <div className="flex items-center gap-1.5">
              <FolderTree className="h-3.5 w-3.5" />
              Browse repos & files
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered code review
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Connected — show repo list or repo detail
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <AnimatePresence mode="wait">
          {selectedRepo ? (
            /* ─── REPO DETAIL VIEW ─── */
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to repos
                </button>
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    {selectedRepo.isPrivate ? (
                      <Lock className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <Globe className="h-4 w-4 text-green-400" />
                    )}
                    {selectedRepo.fullName}
                  </h1>
                  {selectedRepo.description && (
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">
                      {selectedRepo.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Selected file info bar */}
              {selectedFile && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-sm text-brand-300 flex items-center gap-2">
                  <FileCode className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate flex-1">
                    Selected: <strong>{selectedFile}</strong>
                    <span className="text-brand-400/60 ml-2">({fileLanguage})</span>
                  </span>
                  <MagneticButton
                    onClick={handleAnalyze}
                    disabled={analyzing || loadingFile}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-lg text-white font-semibold text-xs shadow-lg shadow-brand-500/20 transition-all ml-auto flex-shrink-0"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Analyze File
                      </>
                    )}
                  </MagneticButton>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setFileContent(null);
                      setAnalysisResult(null);
                    }}
                    className="text-xs text-brand-400 hover:text-brand-300 flex-shrink-0"
                  >
                    Clear
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left: File Tree */}
                <div className="rounded-xl border border-white/5 bg-surface-800/50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 bg-surface-900/50 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <FolderTree className="h-4 w-4 text-brand-400" />
                      Select a File to Analyze
                    </h3>
                    <span className="text-xs text-gray-500">
                      {tree.filter((i) => i.type === "file").length} files
                    </span>
                  </div>
                  <div className="p-2">
                    {loadingTree ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 text-brand-400 animate-spin" />
                      </div>
                    ) : (
                      <RepoTree
                        items={tree}
                        selectedPath={selectedFile}
                        onSelect={handleTreeSelect}
                      />
                    )}
                  </div>
                </div>

                {/* Right: File Preview or Analysis Results */}
                <div className="min-h-[400px]">
                  <AnimatePresence mode="wait">
                    {/* Analyzing spinner */}
                    {analyzing && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl border border-white/5 bg-surface-800/50 p-6"
                      >
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                          <div className="relative">
                            <div className="h-16 w-16 rounded-full border-2 border-brand-500/20" />
                            <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-transparent border-t-brand-500 animate-spin" />
                            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-brand-400" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-white">
                              Analyzing {selectedFile?.split("/").pop()}...
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Running AI code review
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Analysis results — reuse ResultsPanel */}
                    {!analyzing && analysisResult && (
                      <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        {analysisResult.meta?.truncated && (
                          <div className="mb-3 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300 flex items-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                            File was truncated for analysis ({Math.round((analysisResult.meta.originalLength || 0) / 1024)}KB original).
                            Results cover the first portion.
                          </div>
                        )}
                        <GitHubResultsPanel
                          result={analysisResult}
                          onClose={handleCloseResults}
                          fileName={selectedFile || undefined}
                        />
                      </motion.div>
                    )}

                    {/* File content preview */}
                    {!analyzing && !analysisResult && selectedFile && (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl border border-white/5 bg-surface-800/50 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-white/5 bg-surface-900/50 flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Eye className="h-4 w-4 text-brand-400" />
                            File Preview
                          </h3>
                          <span className="text-xs text-gray-500 font-mono">
                            {selectedFile.split("/").pop()}
                          </span>
                        </div>
                        <div className="p-4">
                          {loadingFile ? (
                            <div className="flex items-center justify-center py-12">
                              <Loader2 className="h-6 w-6 text-brand-400 animate-spin" />
                            </div>
                          ) : fileContent !== null ? (
                            <pre className="text-xs text-gray-300 font-mono leading-relaxed overflow-auto max-h-[500px] whitespace-pre-wrap break-all custom-scrollbar">
                              {fileContent.length > 5000
                                ? fileContent.substring(0, 5000) + "\n\n... (truncated for preview)"
                                : fileContent}
                            </pre>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-8">
                              Could not load file content.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Empty state */}
                    {!analyzing && !analysisResult && !selectedFile && (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-xl border border-white/5 bg-surface-800/50 flex items-center justify-center min-h-[400px]"
                      >
                        <div className="text-center py-12 px-4">
                          <div className="h-14 w-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
                            <FileCode className="h-7 w-7 text-brand-400" />
                          </div>
                          <h3 className="text-base font-medium text-gray-300 mb-2">
                            Select a File
                          </h3>
                          <p className="text-xs text-gray-500 max-w-xs mx-auto">
                            Click any file in the tree to preview it, then hit
                            &quot;Analyze File&quot; for an AI-powered code review
                            with scores, issues, and suggestions.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ─── REPO LIST VIEW ─── */
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -30 }}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
                    <Github className="h-6 w-6 sm:h-7 sm:w-7" />
                    GitHub Repositories
                  </h1>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">
                    Connected as{" "}
                    <span className="text-brand-400 font-medium">@{ghUsername}</span>
                    {" · "}Select a repository, then pick a file to analyze
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <MagneticButton
                    onClick={fetchRepos}
                    disabled={loadingRepos}
                    className="flex items-center gap-1.5 px-3 py-2 bg-surface-800 border border-white/10 hover:border-white/20 rounded-xl text-xs sm:text-sm text-gray-300 hover:text-white transition-all"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${loadingRepos ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </MagneticButton>
                  <MagneticButton
                    onClick={handleDisconnect}
                    className="flex items-center gap-1.5 px-3 py-2 bg-surface-800 border border-white/10 hover:border-red-500/30 rounded-xl text-xs sm:text-sm text-gray-400 hover:text-red-400 transition-all"
                  >
                    <Unplug className="h-3.5 w-3.5" />
                    Disconnect
                  </MagneticButton>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-800 border border-white/10 focus:border-brand-500/50 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors"
                />
              </div>

              {/* Repo Grid */}
              {loadingRepos ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-36 rounded-xl bg-surface-800/50 border border-white/5 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="text-center py-16">
                  <AlertTriangle className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    {searchQuery ? "No repos match your search." : "No repositories found."}
                  </p>
                </div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.04 } },
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {filteredRepos.map((repo) => (
                    <motion.button
                      key={repo.id}
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0 },
                      }}
                      onClick={() => handleSelectRepo(repo)}
                      className="text-left p-4 rounded-xl bg-surface-800/40 border border-white/5 hover:border-brand-500/30 hover:bg-surface-800/60 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors truncate flex-1">
                          {repo.name}
                        </h3>
                        <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-brand-400 transition-colors flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[2rem]">
                        {repo.description || "No description"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {repo.language && (
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`h-2.5 w-2.5 rounded-full ${
                                LANG_COLORS[repo.language] || "bg-gray-400"
                              }`}
                            />
                            {repo.language}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {repo.stars}
                        </div>
                        <div className="flex items-center gap-1">
                          <GitFork className="h-3 w-3" />
                          {repo.forks}
                        </div>
                        {repo.isPrivate && <Lock className="h-3 w-3 text-yellow-500/60" />}
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
