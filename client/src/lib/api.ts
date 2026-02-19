const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getToken(): Promise<string | null> {
  const { auth } = await import("./firebase");
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
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

  const res = await fetch(`${API_URL}${endpoint}`, {
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
};
