import Redis from "ioredis";

interface RedisCache {
  client: Redis | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _redisCache: RedisCache | undefined;
}

const cached: RedisCache = global._redisCache ?? { client: null };
global._redisCache = cached;

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;

  if (!cached.client) {
    try {
      cached.client = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
      });

      cached.client.on("error", (err) => {
        console.warn("Redis error:", err.message);
      });
    } catch {
      cached.client = null;
    }
  }

  return cached.client;
}
