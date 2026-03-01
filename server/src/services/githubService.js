const GITHUB_API = "https://api.github.com";

/**
 * Exchange OAuth code for an access token
 */
async function exchangeCodeForToken(code) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub token exchange failed: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

/**
 * Fetch the authenticated GitHub user's profile
 */
async function getGitHubUser(accessToken) {
  const res = await fetch(`${GITHUB_API}/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch GitHub user: ${res.status}`);
  }

  return res.json();
}

/**
 * List repositories for the authenticated user
 */
async function listRepos(accessToken, page = 1, perPage = 30, sort = "updated") {
  const res = await fetch(
    `${GITHUB_API}/user/repos?page=${page}&per_page=${perPage}&sort=${sort}&affiliation=owner,collaborator,organization_member`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch repos: ${res.status}`);
  }

  const repos = await res.json();
  return repos.map((r) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    owner: r.owner.login,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    forks: r.forks_count,
    updatedAt: r.updated_at,
    isPrivate: r.private,
    defaultBranch: r.default_branch,
    htmlUrl: r.html_url,
  }));
}

/**
 * Fetch the repo file tree (recursive)
 */
async function getRepoTree(accessToken, owner, repo, branch = "main") {
  // Try the given branch first, then fall back to master
  let res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!res.ok && branch === "main") {
    // Retry with 'master' branch
    res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/git/trees/master?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch repo tree: ${res.status}`);
  }

  const data = await res.json();

  // Build a nested tree structure
  return (data.tree || [])
    .filter((item) => item.type === "blob" || item.type === "tree")
    .map((item) => ({
      path: item.path,
      type: item.type === "blob" ? "file" : "folder",
      size: item.size || 0,
    }));
}

/**
 * Get contents of a specific file
 */
async function getFileContent(accessToken, owner, repo, path) {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch file ${path}: ${res.status}`);
  }

  const data = await res.json();

  if (data.encoding === "base64" && data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  return data.content || "";
}

/**
 * Get contents of a directory listing
 */
async function getDirContents(accessToken, owner, repo, path = "") {
  const url = path
    ? `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`
    : `${GITHUB_API}/repos/${owner}/${repo}/contents`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch directory ${path}: ${res.status}`);
  }

  return res.json();
}

/**
 * Gather key files for AI analysis (README, config, entry points)
 * Respects a max total size to stay within token limits
 */
async function gatherKeyFiles(accessToken, owner, repo, tree, subPath = "") {
  const MAX_TOTAL_CHARS = 25000; // ~6k tokens for Groq
  let totalChars = 0;
  const files = [];

  // Priority file patterns (order matters)
  const priorityPatterns = [
    /^readme\.md$/i,
    /^readme$/i,
    /^package\.json$/,
    /^requirements\.txt$/,
    /^pyproject\.toml$/,
    /^cargo\.toml$/,
    /^go\.mod$/,
    /^pom\.xml$/,
    /^build\.gradle$/,
    /^\.env\.example$/,
    /^docker-compose\.ya?ml$/,
    /^dockerfile$/i,
    /^tsconfig\.json$/,
    /^next\.config\.\w+$/,
    /^vite\.config\.\w+$/,
    /^webpack\.config\.\w+$/,
    /^tailwind\.config\.\w+$/,
  ];

  // Filter tree items within the subPath
  const relevant = tree.filter((item) => {
    if (item.type !== "file") return false;
    if (subPath && !item.path.startsWith(subPath + "/") && item.path !== subPath) return false;
    return true;
  });

  // Score files by priority
  const scored = relevant
    .map((item) => {
      const name = item.path.split("/").pop();
      const relPath = subPath ? item.path.replace(subPath + "/", "") : item.path;
      let score = 0;

      for (let i = 0; i < priorityPatterns.length; i++) {
        if (priorityPatterns[i].test(name)) {
          score = 100 - i;
          break;
        }
      }

      // Entry point files get moderate priority
      if (/^(index|main|app|server|src\/index|src\/main|src\/app)\.\w+$/.test(relPath)) {
        score = Math.max(score, 50);
      }

      // Skip huge files, binaries, lockfiles
      if (item.size > 50000) score = -1;
      if (/\.(lock|sum|min\.js|min\.css|map)$/.test(item.path)) score = -1;
      if (/node_modules|\.git\/|dist\/|build\/|vendor\//.test(item.path)) score = -1;

      return { ...item, score };
    })
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score);

  // Fetch top priority files
  for (const item of scored.slice(0, 12)) {
    if (totalChars >= MAX_TOTAL_CHARS) break;

    try {
      const content = await getFileContent(accessToken, owner, repo, item.path);
      const trimmed = content.substring(0, MAX_TOTAL_CHARS - totalChars);
      totalChars += trimmed.length;
      files.push({ path: item.path, content: trimmed });
    } catch (err) {
      console.warn(`Skipping file ${item.path}: ${err.message}`);
    }
  }

  return files;
}

module.exports = {
  exchangeCodeForToken,
  getGitHubUser,
  listRepos,
  getRepoTree,
  getFileContent,
  getDirContents,
  gatherKeyFiles,
};
