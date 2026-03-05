async function getToken(): Promise<string | null> {
  const { auth } = await import("./firebase");
  const { onAuthStateChanged } = await import("firebase/auth");

  // If currentUser is already available, use it directly
  if (auth.currentUser) {
    return auth.currentUser.getIdToken();
  }

  // Otherwise wait for Firebase auth to resolve (first load / page refresh)
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 5000); // 5s safety timeout
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      unsubscribe();
      if (user) {
        user.getIdToken().then(resolve).catch(() => resolve(null));
      } else {
        resolve(null);
      }
    });
  });
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  syncUser: () => apiRequest("/auth/sync", { method: "POST" }),
  getMe: () => apiRequest("/auth/me"),

  // Code Review
  analyzeCode: (code: string, language: string, fileName?: string) =>
    apiRequest("/review/analyze", {
      method: "POST",
      body: JSON.stringify({ code, language, fileName }),
    }),
  getReview: (id: string) => apiRequest(`/review/${id}`),

  // Dashboard
  getReviews: (params: Record<string, string | number>) => {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    return apiRequest(`/dashboard/reviews?${query}`);
  },
  getStats: () => apiRequest("/dashboard/stats"),
  getLanguages: () => apiRequest("/dashboard/languages"),

  // GitHub
  getGitHubAuthUrl: () => apiRequest("/github/auth-url"),
  getGitHubStatus: () => apiRequest("/github/status"),
  disconnectGitHub: () => apiRequest("/github/disconnect", { method: "POST" }),
  getGitHubRepos: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    return apiRequest(`/github/repos?${query}`);
  },
  getRepoTree: (owner: string, repo: string, branch?: string) => {
    const query = branch ? `?branch=${branch}` : "";
    return apiRequest(`/github/repos/${owner}/${repo}/tree${query}`);
  },
  getGitHubFileContent: (owner: string, repo: string, path: string) =>
    apiRequest(`/github/repos/${owner}/${repo}/file?path=${encodeURIComponent(path)}`),
  analyzeGitHubFile: (owner: string, repo: string, path: string, branch?: string) =>
    apiRequest("/github/analyze", {
      method: "POST",
      body: JSON.stringify({ owner, repo, path, branch }),
    }),
};
