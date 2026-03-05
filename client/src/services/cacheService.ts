import { getRedis } from "@/lib/redis";
import crypto from "crypto";

const CACHE_TTL = parseInt(process.env.CACHE_TTL || "3600");

export function hashCode(code: string, language: string): string {
  return crypto
    .createHash("sha256")
    .update(`${language}:${code.trim()}`)
    .digest("hex");
}

export async function getCachedAnalysis(codeHash: string) {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const cached = await redis.get(`analysis:${codeHash}`);
    return cached ? JSON.parse(cached) : null;
  } catch (err: any) {
    console.warn("Cache read error:", err.message);
    return null;
  }
}

export async function setCachedAnalysis(codeHash: string, data: any) {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(`analysis:${codeHash}`, JSON.stringify(data), "EX", CACHE_TTL);
  } catch (err: any) {
    console.warn("Cache write error:", err.message);
  }
}

export async function checkRateLimit(
  userId: string,
  maxRequests = 20,
  windowSeconds = 900
) {
  const redis = getRedis();
  if (!redis) return { allowed: true, remaining: maxRequests, resetIn: 0 };

  const key = `ratelimit:${userId}`;
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);
    const remaining = Math.max(0, maxRequests - current);

    return { allowed: current <= maxRequests, remaining, resetIn: ttl };
  } catch (err: any) {
    console.warn("Rate limit error:", err.message);
    return { allowed: true, remaining: maxRequests, resetIn: 0 };
  }
}

export async function setJobState(jobId: string, state: any) {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(`job:${jobId}`, JSON.stringify(state), "EX", 300);
  } catch (err: any) {
    console.warn("Job state error:", err.message);
  }
}
