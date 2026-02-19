const { getRedis } = require("../config/redis");
const crypto = require("crypto");

const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 3600;

function hashCode(code, language) {
  return crypto
    .createHash("sha256")
    .update(`${language}:${code.trim()}`)
    .digest("hex");
}

async function getCachedAnalysis(codeHash) {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const cached = await redis.get(`analysis:${codeHash}`);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn("Cache read error:", err.message);
    return null;
  }
}

async function setCachedAnalysis(codeHash, data) {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(`analysis:${codeHash}`, JSON.stringify(data), "EX", CACHE_TTL);
  } catch (err) {
    console.warn("Cache write error:", err.message);
  }
}

async function checkRateLimit(userId, maxRequests = 20, windowSeconds = 900) {
  const redis = getRedis();
  if (!redis) return { allowed: true, remaining: maxRequests };

  const key = `ratelimit:${userId}`;
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);
    const remaining = Math.max(0, maxRequests - current);

    return {
      allowed: current <= maxRequests,
      remaining,
      resetIn: ttl,
    };
  } catch (err) {
    console.warn("Rate limit error:", err.message);
    return { allowed: true, remaining: maxRequests };
  }
}

async function setJobState(jobId, state) {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(`job:${jobId}`, JSON.stringify(state), "EX", 300);
  } catch (err) {
    console.warn("Job state error:", err.message);
  }
}

async function getJobState(jobId) {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get(`job:${jobId}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
}

module.exports = {
  hashCode,
  getCachedAnalysis,
  setCachedAnalysis,
  checkRateLimit,
  setJobState,
  getJobState,
};
