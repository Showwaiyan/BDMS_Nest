import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { AppConfigService } from '../../config/config.helper';

@Injectable()
export class RedisService implements OnModuleInit {
  private redis: Redis | null = null;
  private readonly logger = new Logger(RedisService.name);

  constructor(private appConfig: AppConfigService) {}

  onModuleInit() {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    try {
      const redisUrl = this.appConfig.upstashRedisRestUrl;
      const redisToken = this.appConfig.upstashRedisRestToken;

      if (!redisUrl || !redisToken) {
        this.logger.warn(
          'UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured. Redis features will not work.',
        );
        return;
      }

      this.redis = new Redis({
        url: redisUrl,
        token: redisToken,
      });

      this.logger.log('Upstash Redis initialized via REST');
    } catch (error) {
      this.logger.error('Failed to initialize Upstash Redis REST:', error);
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.redis) return;
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.redis) return null;
    return this.redis.get<string>(key);
  }

  async del(key: string): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(key);
  }
}
