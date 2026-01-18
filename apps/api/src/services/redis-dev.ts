/**
 * Development-friendly Redis Service
 * Simplified Redis client that fails gracefully without retries
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Simple Redis configuration without retries
const redisOptions = {
  lazyConnect: true,
  maxRetriesPerRequest: 0,
  retryDelayOnFailover: 0,
  enableReadyCheck: false,
  connectTimeout: 1000,
  commandTimeout: 1000
};

// Create Redis client (will be null if connection fails)
let redis: Redis | null = null;
let isRedisAvailable = false;

/**
 * Connect to Redis with single attempt (no retries)
 */
export async function connectRedis(): Promise<void> {
  try {
    console.log('🔌 Connecting to Redis...');
    
    redis = new Redis(REDIS_URL, redisOptions);
    
    // Set up single error handler
    redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error.message);
      isRedisAvailable = false;
    });
    
    redis.on('connect', () => {
      console.log('✅ Connected to Redis');
      isRedisAvailable = true;
    });
    
    redis.on('close', () => {
      console.log('⚠️ Redis connection closed');
      isRedisAvailable = false;
    });
    
    // Try to connect (will fail fast if Redis is not available)
    await redis.connect();
    await redis.ping();
    
    console.log('🏓 Redis ping successful');
    isRedisAvailable = true;
    
  } catch (error) {
    console.log('⚠️ Redis not available - running without caching');
    redis = null;
    isRedisAvailable = false;
  }
}

/**
 * Disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  try {
    if (redis) {
      await redis.quit();
      console.log('✅ Disconnected from Redis');
    }
  } catch (error) {
    console.error('❌ Error disconnecting from Redis:', error);
  }
}

/**
 * Cache Helper Functions with fallback
 */

// Set cache with TTL (fail gracefully if Redis unavailable)
export async function setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  if (!redis || !isRedisAvailable) return; // Silently fail
  
  try {
    const serializedValue = JSON.stringify(value);
    await redis.setex(key, ttlSeconds, serializedValue);
  } catch (error) {
    console.warn('Cache set failed (Redis unavailable)');
  }
}

// Get cache (return null if Redis unavailable)
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis || !isRedisAvailable) return null;
  
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}

// Delete cache
export async function deleteCache(key: string): Promise<void> {
  if (!redis || !isRedisAvailable) return;
  
  try {
    await redis.del(key);
  } catch (error) {
    console.warn('Cache delete failed (Redis unavailable)');
  }
}

// Clear cache pattern
export async function clearCachePattern(pattern: string): Promise<void> {
  if (!redis || !isRedisAvailable) return;
  
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn('Cache pattern clear failed (Redis unavailable)');
  }
}

/**
 * Session Management with fallback
 */
export async function setSession(sessionId: string, userData: any, ttlSeconds: number = 86400): Promise<void> {
  const key = `session:${sessionId}`;
  await setCache(key, userData, ttlSeconds);
}

export async function getSession(sessionId: string): Promise<any | null> {
  const key = `session:${sessionId}`;
  return await getCache(key);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const key = `session:${sessionId}`;
  await deleteCache(key);
}

/**
 * Cultural Data Caching (UAE-specific) with fallback
 */

// Cache prayer times
export async function cachePrayerTimes(city: string, date: string, times: any): Promise<void> {
  const key = `prayer:${city}:${date}`;
  await setCache(key, times, 86400); // Cache for 24 hours
}

// Get cached prayer times
export async function getCachedPrayerTimes(city: string, date: string): Promise<any | null> {
  const key = `prayer:${city}:${date}`;
  return await getCache(key);
}

// Cache UAE holidays
export async function cacheUAEHolidays(year: number, holidays: any[]): Promise<void> {
  const key = `uae:holidays:${year}`;
  await setCache(key, holidays, 31536000); // Cache for 1 year
}

// Get cached UAE holidays
export async function getCachedUAEHolidays(year: number): Promise<any[] | null> {
  const key = `uae:holidays:${year}`;
  return await getCache(key);
}

/**
 * Health Check
 */
export async function getRedisHealth() {
  if (!redis || !isRedisAvailable) {
    return {
      status: 'unavailable',
      message: 'Redis is not connected'
    };
  }
  
  try {
    const ping = await redis.ping();
    const info = await redis.info();
    
    return {
      status: ping === 'PONG' ? 'healthy' : 'unhealthy',
      info: {
        connected_clients: info.split('\n').find(line => line.startsWith('connected_clients:'))?.split(':')[1]?.trim(),
        used_memory_human: info.split('\n').find(line => line.startsWith('used_memory_human:'))?.split(':')[1]?.trim(),
        uptime_in_seconds: info.split('\n').find(line => line.startsWith('uptime_in_seconds:'))?.split(':')[1]?.trim(),
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Check if Redis is available
export function isRedisConnected(): boolean {
  return isRedisAvailable;
}