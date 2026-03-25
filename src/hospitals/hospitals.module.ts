import { Module } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { HospitalsController } from './hospitals.controller';
import { DatabaseModule } from '../database/database.module';
import { RedisService } from '../common/services/redis.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HospitalsController],
  providers: [HospitalsService, RedisService],
})
export class HospitalsModule {}
