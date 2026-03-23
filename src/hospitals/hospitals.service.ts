import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HospitalsService {
  constructor(private readonly prisma: DatabaseService) {}

  async findAll() {
    const hospitals = await this.prisma.hospital.findMany({
      where: { deleted_at: null },
    });
    return {
      message: 'Hospitals fetched successfully',
      data: hospitals,
    };
  }

  async findOne(id: string) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id },
    });
    return {
      message: 'Hospital fetched successfully',
      data: hospital,
    };
  }
}
