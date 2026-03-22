import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HospitalsService } from './hospitals.service';

@ApiTags('hospitals')
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @ApiOperation({ summary: 'Get a list of all active hospitals' })
  @ApiResponse({ status: 200, description: 'Return all hospitals' })
  @Get()
  async findAll() {
    return this.hospitalsService.findAll();
  }
}
