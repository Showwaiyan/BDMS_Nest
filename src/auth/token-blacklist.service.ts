import { Injectable, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { AppConfigService } from '../config/config.helper';

@Injectable()
export class TokenBlacklistService {
  private redis: Redis | null = null;
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly BLACKLIST_PREFIX = 'blacklist:';
  private readonly BLACKLIST_TTL_BUFFER = 10; // Extra seconds to keep token after exp

  constructor(private appConfig: AppConfigService) {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    try {
      const redisUrl = this.appConfig.upstashRedisRestUrl;
      const redisToken = this.appConfig.upstashRedisRestToken;

      if (!redisUrl || !redisToken) {
        this.logger.warn(
          'UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured. Token blacklist will not persist.',
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

  /**
   * Add a token to the blacklist
   * @param token JWT token to blacklist
   * @param expiresAt Token expiration timestamp (in seconds, from JWT exp claim)
   */
  async blacklist(token: string, expiresAt: number): Promise<void> {
    if (!this.redis) {
      this.logger.warn(
        'Upstash Redis not initialized. Token blacklist failed.',
      );
      return;
    }

    const key = `${this.BLACKLIST_PREFIX}${token}`;
    const ttl =
      expiresAt - Math.floor(Date.now() / 1000) + this.BLACKLIST_TTL_BUFFER;

    // Only set if TTL is positive
    if (ttl > 0) {
      await this.redis.setex(key, ttl, 'revoked');
    }
  }

  /**
   * Check if a token is blacklisted
   * @param token JWT token to check
   * @returns true if token is blacklisted, false otherwise
   */
  async isBlacklisted(token: string): Promise<boolean> {
    if (!this.redis) {
      // Fail open: if Redis is not configured, allow the request
      // (safer than blocking all requests)
      this.logger.warn(
        'Upstash Redis not initialized. Allowing token (fail-open).',
      );
      return false;
    }

    const key = `${this.BLACKLIST_PREFIX}${token}`;

    try {
      const result = await this.redis.get(key);
      return result !== null;
    } catch (error) {
      this.logger.error('Error checking blacklist via Upstash REST:', error);
      // Fail open
      return false;
    }
  }

  /**
   * Get statistics about the blacklist (for monitoring)
   */
  getStats(): { configured: boolean } {
    return {
      configured: this.redis !== null,
    };
  }
}
