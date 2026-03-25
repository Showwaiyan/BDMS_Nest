import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HospitalsService } from './hospitals.service';

@ApiTags('hospitals')
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @ApiOperation({ summary: 'Get all hospitals' })
  @Get()
  findAll() {
    return this.hospitalsService.findAll();
  }

  @ApiOperation({ summary: 'Get hospital by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hospitalsService.findOne(id);
  }
}
