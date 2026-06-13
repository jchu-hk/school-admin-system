/**
 * ABAC Cache Service — 增强型缓存服务
 *
 * 提供:
 * - 分层缓存（内存 + 可选 Redis）
 * - 缓存命中率监控
 * - 缓存失效策略
 * - 性能指标收集
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 缓存统计指标
 */
interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  currentSize: number;
}

/**
 * 缓存配置
 */
interface CacheConfig {
  memoryEnabled: boolean;
  memoryMaxSize: number;
  memoryTtlMs: number;
  redisEnabled: boolean;
  redisTtlMs: number;
  redisKeyPrefix: string;
}

/**
 * 缓存条目
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class AbacCacheService<T = any> {
  private readonly logger = new Logger(AbacCacheService.name);

  // 内存缓存
  private memoryCache = new Map<string, CacheEntry<T>>();

  // 缓存统计
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    currentSize: 0,
  };

  // 缓存配置
  private config: CacheConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      memoryEnabled:
        this.configService.get<boolean>('ABAC_CACHE_MEMORY_ENABLED') ?? true,
      memoryMaxSize:
        this.configService.get<number>('ABAC_CACHE_MEMORY_MAX_SIZE') ?? 1000,
      memoryTtlMs:
        this.configService.get<number>('ABAC_CACHE_MEMORY_TTL_MS') ?? 30_000,
      redisEnabled:
        this.configService.get<boolean>('ABAC_CACHE_REDIS_ENABLED') ?? false,
      redisTtlMs:
        this.configService.get<number>('ABAC_CACHE_REDIS_TTL_MS') ?? 60_000,
      redisKeyPrefix:
        this.configService.get<string>('ABAC_CACHE_REDIS_PREFIX') ?? 'abac:',
    };

    this.logger.log(
      `[ABAC Cache] 初始化: memory=${this.config.memoryEnabled}, ` +
        `maxSize=${this.config.memoryMaxSize}, ttl=${this.config.memoryTtlMs}ms`,
    );
  }

  /**
   * 获取缓存值
   */
  async get(key: string): Promise<T | null> {
    // 先从内存缓存获取
    if (this.config.memoryEnabled) {
      const memoryResult = this.getFromMemory(key);
      if (memoryResult !== null) {
        this.metrics.hits++;
        this.metrics.currentSize = this.memoryCache.size;
        return memoryResult;
      }
    }

    // 内存未命中，尝试 Redis（如果启用）
    if (this.config.redisEnabled) {
      const redisResult = await this.getFromRedis(key);
      if (redisResult !== null) {
        this.metrics.hits++;
        // 回填到内存缓存
        if (this.config.memoryEnabled) {
          this.setToMemory(key, redisResult);
        }
        return redisResult;
      }
    }

    this.metrics.misses++;
    return null;
  }

  /**
   * 设置缓存值
   */
  async set(key: string, value: T): Promise<void> {
    // 设置到内存缓存
    if (this.config.memoryEnabled) {
      this.setToMemory(key, value);
    }

    // 设置到 Redis（如果启用）
    if (this.config.redisEnabled) {
      await this.setToRedis(key, value);
    }

    this.metrics.sets++;
    this.metrics.currentSize = this.memoryCache.size;
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<void> {
    // 从内存删除
    if (this.config.memoryEnabled) {
      this.memoryCache.delete(key);
    }

    // 从 Redis 删除（如果启用）
    if (this.config.redisEnabled) {
      await this.delFromRedis(key);
    }

    this.metrics.deletes++;
    this.metrics.currentSize = this.memoryCache.size;
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (this.config.redisEnabled) {
      await this.clearRedis();
    }

    this.metrics.currentSize = 0;
    this.logger.log('[ABAC Cache] 缓存已清空');
  }

  /**
   * 获取缓存统计
   */
  getMetrics(): CacheMetrics & { hitRate: number } {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? this.metrics.hits / total : 0;

    return {
      ...this.metrics,
      hitRate,
    };
  }

  /**
   * 重置统计
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      currentSize: this.memoryCache.size,
    };
  }

  /**
   * 从内存缓存获取
   */
  private getFromMemory(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      return null;
    }

    // 检查过期
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * 设置到内存缓存
   */
  private setToMemory(key: string, value: T): void {
    // 检查大小限制
    if (this.memoryCache.size >= this.config.memoryMaxSize) {
      // LRU 淘汰：删除第一个条目
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
        this.metrics.evictions++;
      }
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + this.config.memoryTtlMs,
    });
  }

  /**
   * 从 Redis 获取（占位实现，后续可集成 Redis）
   */
  private async getFromRedis(key: string): Promise<T | null> {
    // TODO: 集成 Redis
    // const redisKey = `${this.config.redisKeyPrefix}${key}`;
    // const value = await this.redisClient.get(redisKey);
    // return value ? JSON.parse(value) : null;
    return null;
  }

  /**
   * 设置到 Redis（占位实现）
   */
  private async setToRedis(key: string, value: T): Promise<void> {
    // TODO: 集成 Redis
    // const redisKey = `${this.config.redisKeyPrefix}${key}`;
    // await this.redisClient.setex(
    //   redisKey,
    //   Math.floor(this.config.redisTtlMs / 1000),
    //   JSON.stringify(value)
    // );
  }

  /**
   * 从 Redis 删除（占位实现）
   */
  private async delFromRedis(key: string): Promise<void> {
    // TODO: 集成 Redis
    // const redisKey = `${this.config.redisKeyPrefix}${key}`;
    // await this.redisClient.del(redisKey);
  }

  /**
   * 清空 Redis（占位实现）
   */
  private async clearRedis(): Promise<void> {
    // TODO: 集成 Redis
    // const pattern = `${this.config.redisKeyPrefix}*`;
    // const keys = await this.redisClient.keys(pattern);
    // if (keys.length > 0) {
    //   await this.redisClient.del(...keys);
    // }
  }
}
