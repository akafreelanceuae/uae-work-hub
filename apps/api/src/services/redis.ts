/**
 * Redis Connection Service
 * Redis client for caching, sessions, and real-time data
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis configuration for UAE Work Hub
interface RedisConfig {
  retryDelayOnFailover: number;
  enableReadyCheck: boolean;
  maxRetriesPerRequest: number | null;
  lazyConnect: boolean;
  keepAlive: number;
  connectTimeout: number;
  commandTimeout: number;
  retryDelayOnClusterDown: number;
  retryDelayOnFailback: number;
}

const redisOptions: RedisConfig = {
  retryDelayOnFailover: 0,
  enableReadyCheck: false,
  maxRetriesPerRequest: null, // Disable all retries
  lazyConnect: true,
  keepAlive: 0,
  connectTimeout: 1000,
  commandTimeout: 1000,
  retryDelayOnClusterDown: 0,
  retryDelayOnFailback: 0
};

// Create Redis client
export const redis = new Redis(REDIS_URL, redisOptions);

// Redis Pub/Sub client for real-time features
export const redisPub = new Redis(REDIS_URL, redisOptions);
export const redisSub = new Redis(REDIS_URL, redisOptions);

/**
 * Connect to Redis with error handling
 */
export async function connectRedis(): Promise<void> {
  try {
    console.log('🔌 Connecting to Redis...');
    
    // Set up event listeners
    redis.on('connect', () => {
      console.log('✅ Connected to Redis');
    });
    
    redis.on('ready', () => {
      console.log('🚀 Redis is ready');
    });
    
    redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });
    
    redis.on('close', () => {
      console.log('⚠️ Redis connection closed');
    });
    
    redis.on('reconnecting', () => {
      console.log('🔄 Reconnecting to Redis...');
    });
    
    // Connect to Redis
    await redis.connect();
    
    console.log('✅ Redis connection established');
    
    // Test the connection
    await redis.ping();
    console.log('🏓 Redis ping successful');
    
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
}

/**
 * Disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit();
    await redisPub.quit();
    await redisSub.quit();
    console.log('✅ Disconnected from Redis');
  } catch (error) {
    console.error('❌ Error disconnecting from Redis:', error);
    throw error;
  }
}

/**
 * Cache Helper Functions
 */

// Set cache with TTL (Time To Live)
export async function setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  try {
    const serializedValue = JSON.stringify(value);
    await redis.setex(key, ttlSeconds, serializedValue);
  } catch (error) {
    console.error('Cache set error:', error);
    throw error;
  }
}

// Get cache
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

// Delete cache
export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
    throw error;
  }
}

// Clear cache pattern
export async function clearCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache pattern clear error:', error);
    throw error;
  }
}

/**
 * Session Management
 */

// Set user session
export async function setSession(sessionId: string, userData: any, ttlSeconds: number = 86400): Promise<void> {
  const key = `session:${sessionId}`;
  await setCache(key, userData, ttlSeconds);
}

// Get user session
export async function getSession(sessionId: string): Promise<any | null> {
  const key = `session:${sessionId}`;
  return await getCache(key);
}

// Delete user session
export async function deleteSession(sessionId: string): Promise<void> {
  const key = `session:${sessionId}`;
  await deleteCache(key);
}

/**
 * Cultural Data Caching (UAE-specific)
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
 * Real-time Features
 */

// Publish meeting update
export async function publishMeetingUpdate(meetingId: string, update: any): Promise<void> {
  const channel = `meeting:${meetingId}`;
  await redisPub.publish(channel, JSON.stringify(update));
}

// Subscribe to meeting updates
export function subscribeMeetingUpdates(meetingId: string, callback: (message: any) => void): void {
  const channel = `meeting:${meetingId}`;
  redisSub.subscribe(channel);
  redisSub.on('message', (receivedChannel, message) => {
    if (receivedChannel === channel) {
      try {
        const parsedMessage = JSON.parse(message);
        callback(parsedMessage);
      } catch (error) {
        console.error('Error parsing Redis message:', error);
      }
    }
  });
}

/**
 * Rate Limiting
 */

// Check rate limit
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    return current <= limit;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return true; // Allow on error
  }
}

/**
 * Health Check
 */
export async function getRedisHealth() {
  try {
    const info = await redis.info();
    const ping = await redis.ping();
    
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

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    await disconnectRedis();
  } catch (error) {
    console.error('Error during Redis shutdown:', error);
  }
});