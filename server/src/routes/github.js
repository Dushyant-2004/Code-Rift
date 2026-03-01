const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { analyzeCode } = require("../services/groqService");
const {
  exchangeCodeForToken,
  getGitHubUser,
  listRepos,
  getRepoTree,
  getFileContent,
} = require("../services/githubService");
const User = require("../models/User");

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || "http://localhost:5000/api/github/callback";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

/* ─── GET /api/github/auth-url ─── */
/* Returns the GitHub OAuth URL for the client to redirect to */
router.get("/auth-url", authenticate, (req, res) => {
  try {
    if (!GITHUB_CLIENT_ID) {
      return res.status(500).json({ error: "GitHub OAuth not configured" });
    }

    const redirectUri = GITHUB_CALLBACK_URL;
    const state = req.user._id.toString(); // pass userId as state to link after callback

    const url =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${GITHUB_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=repo,read:user` +
      `&state=${state}`;

    res.json({ url });
  } catch (err) {
    console.error("[GitHub] auth-url error:", err);
    res.status(500).json({ error: "Failed to generate GitHub auth URL" });
  }
});

/* ─── GET /api/github/callback ─── */
/* GitHub redirects here after user approves; exchanges code for token */
router.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error("[GitHub] OAuth denied:", error);
    return res.redirect(`${CLIENT_URL}/github?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${CLIENT_URL}/github?error=no_code`);
  }

  try {
    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(code);

    // Get GitHub username
    const ghUser = await getGitHubUser(accessToken);

    // Save token + username to user (state = userId)
    if (state) {
      await User.findByIdAndUpdate(state, {
        githubAccessToken: accessToken,
        githubUsername: ghUser.login,
      });
    }

    // Redirect back to client with success
    res.redirect(`${CLIENT_URL}/github?connected=true`);
  } catch (err) {
    console.error("[GitHub] callback error:", err);
    res.redirect(
      `${CLIENT_URL}/github?error=${encodeURIComponent(err.message || "auth_failed")}`
    );
  }
});

/* ─── GET /api/github/status ─── */
/* Check if the user has connected their GitHub account */
router.get("/status", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("githubAccessToken githubUsername");
    res.json({
      connected: !!user?.githubAccessToken,
      username: user?.githubUsername || null,
    });
  } catch (err) {
    console.error("[GitHub] status error:", err);
    res.status(500).json({ error: "Failed to check GitHub status" });
  }
});

/* ─── POST /api/github/disconnect ─── */
/* Remove the stored GitHub token */
router.post("/disconnect", authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      githubAccessToken: null,
      githubUsername: null,
    });
    res.json({ success: true });
  } catch (err) {
    console.error("[GitHub] disconnect error:", err);
    res.status(500).json({ error: "Failed to disconnect GitHub" });
  }
});

/* ─── GET /api/github/repos ─── */
/* List user's GitHub repositories */
router.get("/repos", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("githubAccessToken");
    if (!user?.githubAccessToken) {
      return res.status(401).json({ error: "GitHub not connected" });
    }

    const page = parseInt(req.query.page) || 1;
    const sort = req.query.sort || "updated";
    const repos = await listRepos(user.githubAccessToken, page, 30, sort);

    // Optional search filter
    const search = (req.query.search || "").toLowerCase();
    const filtered = search
      ? repos.filter(
          (r) =>
            r.name.toLowerCase().includes(search) ||
            (r.description || "").toLowerCase().includes(search)
        )
      : repos;

    res.json({ repos: filtered });
  } catch (err) {
    console.error("[GitHub] repos error:", err);
    if (err.message.includes("401")) {
      return res.status(401).json({ error: "GitHub token expired. Please reconnect." });
    }
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

/* ─── GET /api/github/repos/:owner/:repo/tree ─── */
/* Fetch the file tree of a repository */
router.get("/repos/:owner/:repo/tree", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("githubAccessToken");
    if (!user?.githubAccessToken) {
      return res.status(401).json({ error: "GitHub not connected" });
    }

    const { owner, repo } = req.params;
    const branch = req.query.branch || "main";
    const tree = await getRepoTree(user.githubAccessToken, owner, repo, branch);

    res.json({ tree });
  } catch (err) {
    console.error("[GitHub] tree error:", err);
    res.status(500).json({ error: "Failed to fetch repository tree" });
  }
});

/* ─── GET /api/github/repos/:owner/:repo/file ─── */
/* Fetch the raw content of a single file from a repository */
router.get("/repos/:owner/:repo/file", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("githubAccessToken");
    if (!user?.githubAccessToken) {
      return res.status(401).json({ error: "GitHub not connected" });
    }

    const { owner, repo } = req.params;
    const filePath = req.query.path;

    if (!filePath) {
      return res.status(400).json({ error: "path query parameter is required" });
    }

    const content = await getFileContent(user.githubAccessToken, owner, repo, filePath);

    // Detect language from file extension
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const langMap = {
      js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
      ts: "typescript", tsx: "typescript",
      py: "python", pyw: "python",
      java: "java", kt: "kotlin", kts: "kotlin",
      go: "go",
      rs: "rust",
      rb: "ruby", erb: "ruby",
      php: "php",
      c: "c", h: "c",
      cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp",
      cs: "csharp",
      swift: "swift",
      dart: "dart",
      html: "html", htm: "html",
      css: "css", scss: "scss", sass: "sass", less: "less",
      json: "json",
      yaml: "yaml", yml: "yaml",
      toml: "toml",
      xml: "xml",
      md: "markdown",
      sql: "sql",
      sh: "shell", bash: "shell", zsh: "shell",
      dockerfile: "dockerfile",
      lua: "lua",
      r: "r",
      scala: "scala",
      vue: "vue",
      svelte: "svelte",
    };

    const language = langMap[ext] || ext || "text";

    res.json({ content, language, path: filePath });
  } catch (err) {
    console.error("[GitHub] file content error:", err);
    if (err.message.includes("401")) {
      return res.status(401).json({ error: "GitHub token expired. Please reconnect." });
    }
    res.status(500).json({ error: err.message || "Failed to fetch file content" });
  }
});

/* ─── POST /api/github/analyze ─── */
/* Analyze a single file from a GitHub repo using the existing code review AI */
router.post("/analyze", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("githubAccessToken");
    if (!user?.githubAccessToken) {
      return res.status(401).json({ error: "GitHub not connected" });
    }

    const { owner, repo, path: filePath, branch } = req.body;
    if (!owner || !repo || !filePath) {
      return res.status(400).json({ error: "owner, repo, and path are required" });
    }

    // 1. Fetch the file content from GitHub
    const content = await getFileContent(
      user.githubAccessToken,
      owner,
      repo,
      filePath
    );

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "File is empty or could not be read" });
    }

    // Truncate very large files to stay within token limits (max ~12k chars ≈ 3k tokens)
    const MAX_CHARS = 12000;
    const truncated = content.length > MAX_CHARS;
    const codeToAnalyze = truncated ? content.substring(0, MAX_CHARS) : content;

    // 2. Detect language from file extension
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const langMap = {
      js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
      ts: "typescript", tsx: "typescript",
      py: "python", pyw: "python",
      java: "java", kt: "kotlin", kts: "kotlin",
      go: "go", rs: "rust", rb: "ruby",
      php: "php", c: "c", h: "c",
      cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp",
      cs: "csharp", swift: "swift", dart: "dart",
      html: "html", css: "css", scss: "scss",
      json: "json", yaml: "yaml", yml: "yaml",
      sql: "sql", sh: "shell", bash: "shell",
      vue: "vue", svelte: "svelte",
    };
    const language = langMap[ext] || ext || "text";

    // 3. Run through existing code review AI
    const analysis = await analyzeCode(codeToAnalyze, language);

    res.json({
      ...analysis,
      meta: {
        owner,
        repo,
        path: filePath,
        language,
        truncated,
        originalLength: content.length,
      },
    });
  } catch (err) {
    console.error("[GitHub] analyze error:", err);
    if (err.message.includes("401")) {
      return res.status(401).json({ error: "GitHub token expired. Please reconnect." });
    }
    res.status(500).json({ error: err.message || "Failed to analyze file" });
  }
});

module.exports = router;
