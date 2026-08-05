import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: (times) => {
    if (times > 3) return null; // Stop retrying after 3 attempts
    return Math.min(times * 100, 1000);
  },
  tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.warn('Redis non-fatal connection warning:', err.message);
});

export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn(`Cache miss/get error for key ${key}:`, err);
    return null;
  }
};

export const setCachedData = async (key: string, data: any, ttlSeconds: number = 3600): Promise<void> => {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    console.warn(`Cache set error for key ${key}:`, err);
  }
};

export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn(`Cache invalidate error for pattern ${pattern}:`, err);
  }
};

export default redis;
