import crypto from "crypto";

export function hashCode(code: string, language: string): string {
  return crypto
    .createHash("sha256")
    .update(`${language}:${code.trim()}`)
    .digest("hex");
}

export async function getCachedAnalysis(_codeHash: string) {
  return null;
}

export async function setCachedAnalysis(_codeHash: string, _data: any) {
  // no-op without Redis
}

export async function checkRateLimit(
  _userId: string,
  maxRequests = 20,
) {
  return { allowed: true, remaining: maxRequests, resetIn: 0 };
}

export async function setJobState(_jobId: string, _state: any) {
  // no-op without Redis
}
