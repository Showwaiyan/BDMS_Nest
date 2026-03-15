import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { RequestsRepository } from './requests.repository';

@Module({
  controllers: [RequestsController],
  providers: [RequestsService, RequestsRepository],
})
export class RequestsModule {}
