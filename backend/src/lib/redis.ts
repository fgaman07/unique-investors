import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let redisClient: Redis | null = null;

if (env.REDIS_URL) {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      logger.info('[Redis] Successfully connected to Cache Layer.');
    });

    redisClient.on('error', (err: Error) => {
      logger.error(`[Redis] Connection Error: ${err.message}`);
    });
  } catch (err) {
    logger.error('[Redis] Failed to initialize Redis Client. Running without cache.');
    logger.error('Redis Initialization Error:', err);
  }
} else {
  logger.info('[Cache] No REDIS_URL found. Using native Node.js Memory Cache fallback.');
}

// Fallback Memory Cache
const localCache = new Map<string, { data: string, expiry: number }>();

/**
 * Attempts to retrieve data from Redis Cache or local memory cache.
 * Returns null if cache miss or Redis/cache is unavailable.
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  if (redisClient) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error(`[Redis] GET Error: ${err}`);
      return null;
    }
  } else {
    // Memory cache fallback
    const record = localCache.get(key);
    if (!record) return null;
    if (Date.now() > record.expiry) {
      localCache.delete(key);
      return null;
    }
    return JSON.parse(record.data);
  }
};

/**
 * Attempts to save data to Redis Cache or local memory cache.
 * Fails silently if Redis is unavailable.
 * @param key Cache key string
 * @param value Data to cache
 * @param ttlSeconds Time to live in seconds (default: 3600 = 1 hour)
 */
export const setCache = async (key: string, value: any, ttlSeconds: number = 3600): Promise<void> => {
  if (redisClient) {
    try {
      const stringValue = JSON.stringify(value);
      await redisClient.set(key, stringValue, 'EX', ttlSeconds);
    } catch (err) {
      logger.error(`[Redis] SET Error: ${err}`);
    }
  } else {
    // Memory cache fallback
    localCache.set(key, {
      data: JSON.stringify(value),
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }
};

/**
 * Invalidates a specific cache key or keys matching a pattern.
 */
export const invalidateCache = async (pattern: string): Promise<void> => {
  if (redisClient) {
    try {
      // If exact key
      if (!pattern.includes('*')) {
        await redisClient.del(pattern);
        return;
      }

      // If pattern (e.g., 'inventory:*')
      const stream = redisClient.scanStream({
        match: pattern,
        count: 100,
      });

      stream.on('data', async (keys: string[]) => {
        if (keys.length) {
          const pipeline = redisClient!.pipeline();
          keys.forEach((key) => pipeline.del(key));
          await pipeline.exec();
        }
      });
    } catch (error) {
      logger.error(`[Redis] Invalidate Error for pattern ${pattern}:`, error);
    }
  } else {
    // Memory cache fallback
    let count = 0;
    if (!pattern.includes('*')) {
      if (localCache.delete(pattern)) count++;
    } else {
      const prefix = pattern.replace(/\*/g, '');
      for (const key of localCache.keys()) {
        if (key.startsWith(prefix) || key.includes(prefix)) {
          localCache.delete(key);
          count++;
        }
      }
    }
    if (count > 0) logger.info(`[Cache] Invalidated ${count} local memory keys for pattern: ${pattern}`);
  }
};

export { redisClient };
