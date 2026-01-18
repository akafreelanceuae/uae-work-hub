/**
 * No-Redis Service for Development
 * Completely bypasses Redis - no connection attempts, no errors
 */

/**
 * Connect to Redis (no-op for development)
 */
export async function connectRedis(): Promise<void> {
  console.log('⚠️ Redis disabled for development - running without caching');
  // Do nothing - no connection attempt
}

/**
 * Disconnect from Redis (no-op)
 */
export async function disconnectRedis(): Promise<void> {
  // Do nothing
}

/**
 * Cache Helper Functions - all no-ops that silently fail
 */

export async function setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  // Silently do nothing
}

export async function getCache<T>(key: string): Promise<T | null> {
  return null; // Always return null (cache miss)
}

export async function deleteCache(key: string): Promise<void> {
  // Silently do nothing
}

export async function clearCachePattern(pattern: string): Promise<void> {
  // Silently do nothing
}

/**
 * Session Management - all no-ops
 */
export async function setSession(sessionId: string, userData: any, ttlSeconds: number = 86400): Promise<void> {
  // Silently do nothing
}

export async function getSession(sessionId: string): Promise<any | null> {
  return null; // Always return null
}

export async function deleteSession(sessionId: string): Promise<void> {
  // Silently do nothing
}

/**
 * Cultural Data Caching - all no-ops
 */
export async function cachePrayerTimes(city: string, date: string, times: any): Promise<void> {
  // Silently do nothing
}

export async function getCachedPrayerTimes(city: string, date: string): Promise<any | null> {
  return null; // Always return null (cache miss)
}

export async function cacheUAEHolidays(year: number, holidays: any[]): Promise<void> {
  // Silently do nothing
}

export async function getCachedUAEHolidays(year: number): Promise<any[] | null> {
  return null; // Always return null (cache miss)
}

/**
 * Health Check
 */
export async function getRedisHealth() {
  return {
    status: 'disabled',
    message: 'Redis is disabled for development'
  };
}

export function isRedisConnected(): boolean {
  return false; // Always return false
}