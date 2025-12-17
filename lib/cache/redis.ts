import { Redis } from "@upstash/redis";

// Validate Redis configuration
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Only create Redis client when both env vars are present
const redis: Redis | null =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

export const isRedisConfigured = redis !== null;

if (!isRedisConfigured) {
  console.warn(
    "Redis not configured: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. Cache operations will be disabled."
  );
}

// Cache key prefixes
const CACHE_KEYS = {
  ALL_METERS: "meters:all",
  METER_DETAILS: "meters:details:",
} as const;

// Default TTL values (in seconds)
const TTL = {
  ALL_METERS: 60 * 5, // 5 minutes
  METER_DETAILS: 60 * 10, // 10 minutes
} as const;

/**
 * Get all meter serial numbers from cache
 */
export async function getCachedMeters(): Promise<string[] | null> {
  if (!isRedisConfigured || !redis) return null;

  try {
    const cached = await redis.get<string[]>(CACHE_KEYS.ALL_METERS);
    return cached;
  } catch (error) {
    console.error("Redis get error (meters):", error);
    return null;
  }
}

/**
 * Set all meter serial numbers in cache
 */
export async function setCachedMeters(meters: string[]): Promise<void> {
  if (!isRedisConfigured || !redis) return;

  try {
    await redis.set(CACHE_KEYS.ALL_METERS, meters, { ex: TTL.ALL_METERS });
  } catch (error) {
    console.error("Redis set error (meters):", error);
  }
}

/**
 * Get meter details from cache
 */
export async function getCachedMeterDetails<T>(
  serialNumber: string
): Promise<T | null> {
  if (!isRedisConfigured || !redis) return null;

  try {
    const cached = await redis.get<T>(
      `${CACHE_KEYS.METER_DETAILS}${serialNumber}`
    );
    return cached;
  } catch (error) {
    console.error("Redis get error (meter details):", error);
    return null;
  }
}

/**
 * Set meter details in cache
 */
export async function setCachedMeterDetails<T>(
  serialNumber: string,
  details: T
): Promise<void> {
  if (!isRedisConfigured || !redis) return;

  try {
    await redis.set(`${CACHE_KEYS.METER_DETAILS}${serialNumber}`, details, {
      ex: TTL.METER_DETAILS,
    });
  } catch (error) {
    console.error("Redis set error (meter details):", error);
  }
}

/**
 * Clear all meters cache
 */
export async function clearMetersRedisCache(): Promise<void> {
  if (!isRedisConfigured || !redis) return;

  try {
    // Delete the all meters cache
    await redis.del(CACHE_KEYS.ALL_METERS);

    // For meter details, we need to scan and delete matching keys
    // Using a pattern match to find all meter detail keys
    let cursor = "0";
    let done = false;

    while (!done) {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: `${CACHE_KEYS.METER_DETAILS}*`,
        count: 100,
      });
      cursor = String(nextCursor);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      done = cursor === "0";
    }
  } catch (error) {
    console.error("Redis clear error:", error);
  }
}

/**
 * Delete a specific meter's cached details
 */
export async function deleteCachedMeterDetails(
  serialNumber: string
): Promise<void> {
  if (!isRedisConfigured || !redis) return;

  try {
    await redis.del(`${CACHE_KEYS.METER_DETAILS}${serialNumber}`);
  } catch (error) {
    console.error("Redis delete error (meter details):", error);
  }
}

export { redis };
