const Redis = require("ioredis");

let redis = null;

async function connectRedis() {
  try {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.warn("⚠️ Redis unavailable, running without cache");
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    redis.on("connect", () => console.log("✅ Redis connected"));
    redis.on("error", (err) => console.warn("⚠️ Redis error:", err.message));

    await redis.ping();
  } catch (err) {
    console.warn("⚠️ Redis connection failed, running without cache:", err.message);
    redis = null;
  }
}

function getRedis() {
  return redis;
}

module.exports = { connectRedis, getRedis };
