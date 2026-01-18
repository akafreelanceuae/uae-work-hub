/**
 * Redis Client Selector
 * Chooses the appropriate Redis implementation based on environment
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';
const REDIS_MODE = process.env.REDIS_MODE || (isProd ? 'prod' : 'dev');

// Dynamically select implementation
let impl: any;
if (REDIS_MODE === 'none') {
  impl = await import('./no-redis.js');
} else if (REDIS_MODE === 'dev') {
  impl = await import('./redis-dev.js');
} else {
  // Default to production-grade Redis client
  impl = await import('./redis.js');
}

// Re-export commonly used APIs
export const connectRedis = impl.connectRedis;
export const disconnectRedis = impl.disconnectRedis ?? (async () => {});
export const setCache = impl.setCache ?? (async () => {});
export const getCache = impl.getCache ?? (async () => null);
export const deleteCache = impl.deleteCache ?? (async () => {});
export const clearCachePattern = impl.clearCachePattern ?? (async () => {});

export const setSession = impl.setSession ?? (async () => {});
export const getSession = impl.getSession ?? (async () => null);
export const deleteSession = impl.deleteSession ?? (async () => {});

export const cachePrayerTimes = impl.cachePrayerTimes ?? (async () => {});
export const getCachedPrayerTimes = impl.getCachedPrayerTimes ?? (async () => null);
export const cacheUAEHolidays = impl.cacheUAEHolidays ?? (async () => {});
export const getCachedUAEHolidays = impl.getCachedUAEHolidays ?? (async () => null);

export const getRedisHealth = impl.getRedisHealth ?? (async () => ({ status: 'disabled' }));
export const isRedisConnected = impl.isRedisConnected ?? (() => false);

// Optionally re-export pub/sub and rate limit helpers if available
export const publishMeetingUpdate = impl.publishMeetingUpdate ?? (async () => {});
export const subscribeMeetingUpdates = impl.subscribeMeetingUpdates ?? (() => {});
export const checkRateLimit = impl.checkRateLimit ?? (async () => true);
