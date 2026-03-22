import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { AppConfigService } from '../config/config.helper';

@Injectable()
export class TokenBlacklistService implements OnModuleInit, OnModuleDestroy {
  private redis: RedisClientType | null = null;
  private isConnected = false;
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly BLACKLIST_PREFIX = 'blacklist:';
  private readonly BLACKLIST_TTL_BUFFER = 10; // Extra seconds to keep token after exp

  constructor(private appConfig: AppConfigService) {}

  async onModuleInit() {
    await this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = this.appConfig.redisUrl;

      if (!redisUrl) {
        this.logger.warn(
          'REDIS_URL not configured. Token blacklist will not persist across restarts.',
        );
        return;
      }

      this.redis = createClient({
        url: redisUrl,
      });

      this.redis.on('error', (err) => {
        this.logger.error('Redis connection error:', err);
        this.isConnected = false;
      });

      this.redis.on('connect', () => {
        this.logger.log('Connected to Redis');
        this.isConnected = true;
      });

      await this.redis.connect();
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * Add a token to the blacklist
   * @param token JWT token to blacklist
   * @param expiresAt Token expiration timestamp (in seconds, from JWT exp claim)
   */
  async blacklist(token: string, expiresAt: number): Promise<void> {
    if (!this.redis || !this.isConnected) {
      this.logger.warn('Redis not connected. Token blacklist failed.');
      return;
    }

    const key = `${this.BLACKLIST_PREFIX}${token}`;
    const ttl =
      expiresAt - Math.floor(Date.now() / 1000) + this.BLACKLIST_TTL_BUFFER;

    // Only set if TTL is positive
    if (ttl > 0) {
      await this.redis.setEx(key, ttl, 'revoked');
    }
  }

  /**
   * Check if a token is blacklisted
   * @param token JWT token to check
   * @returns true if token is blacklisted, false otherwise
   */
  async isBlacklisted(token: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      // Fail open: if Redis is down, allow the request
      // (safer than blocking all requests)
      this.logger.warn('Redis not connected. Allowing token (fail-open).');
      return false;
    }

    const key = `${this.BLACKLIST_PREFIX}${token}`;

    try {
      const result = await this.redis.get(key);
      return result !== null;
    } catch (error) {
      this.logger.error('Error checking blacklist:', error);
      // Fail open
      return false;
    }
  }

  /**
   * Get statistics about the blacklist (for monitoring)
   */
  getStats(): { connected: boolean; redisUrl?: string } {
    return {
      connected: this.isConnected,
      redisUrl: this.appConfig.redisUrl ? '***' : undefined,
    };
  }

  /**
   * Clean up Redis connection on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.redis && this.isConnected) {
      await this.redis.disconnect();
      this.logger.log('Disconnected from Redis');
    }
  }
}
