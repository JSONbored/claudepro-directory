/**
 * Redis Module Index
 * Exports all Redis-related functionality
 */

// Re-export schemas and types that are commonly used
export type {
  CacheInvalidationResult,
  RateLimitTracking,
  RedisConnectionStatus,
} from '../schemas/cache.schema';
// Cache service
export {
  type CacheOperationResult,
  CacheService,
  CacheServices,
  cacheService,
  createCacheService,
} from './cache';
// Core Redis client
export { isRedisHealthy, redisClient } from './client';
// High-level rate limiting service
export {
  createRateLimiter,
  getClientIdentifier,
  RateLimiter,
  RateLimiters,
  type RateLimitResult,
  RateLimitTracker,
} from './rate-limiter';
// Token bucket rate limiting
export {
  createTokenBucket,
  TokenBucket,
  TokenBuckets,
} from './token-bucket';
