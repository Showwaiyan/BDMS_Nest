import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../common/services/redis.service';

@Injectable()
export class HospitalsService {
  private readonly logger = new Logger(HospitalsService.name);
  private readonly CACHE_KEY = 'hospitals:list';
  private readonly CACHE_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async findAll() {
    // 1. Check cache
    try {
      const cachedStr = await this.redis.get(this.CACHE_KEY);
      if (cachedStr) {
        this.logger.debug('Returning hospitals from cache');
        return JSON.parse(cachedStr);
      }
    } catch (e) {
      this.logger.warn('Failed to read hospitals from cache', e);
    }

    // 2. Fetch from DB
    this.logger.log('Fetching hospitals from database');
    const hospitals = await this.db.hospital.findMany({
      where: {
        is_active: true,
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // 3. Save to cache
    try {
      await this.redis.set(
        this.CACHE_KEY,
        JSON.stringify(hospitals),
        this.CACHE_TTL,
      );
    } catch (e) {
      this.logger.warn('Failed to save hospitals to cache', e);
    }

    return hospitals;
  }
}
