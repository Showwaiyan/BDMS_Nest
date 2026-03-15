import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prisma, RequestStatus } from 'prisma/generated/client';

@Injectable()
export class RequestsRepository {
  constructor(private readonly prisma: DatabaseService) {}

  // Select fields for blood request (For Response)
  public readonly selectRequest: Prisma.BloodRequestSelect = {
    id: true,
    user_id: true,
    hospital_id: true,
    blood_request_code: true,
    patient_name: true,
    blood_group: true,
    units_required: true,
    contact_phone: true,
    urgency: true,
    required_date: true,
    status: true,
    reason: true,
    created_at: true,
    hospital: {
      select: { name: true, phone: true },
    },
    user: {
      select: { user_name: true, email: true },
    },
  };

  async findPendingRequestByUserAndHospital(userId: string, hospitalId: string) {
    return this.prisma.bloodRequest.findFirst({
      where: {
        user_id: userId,
        status: RequestStatus.pending,
        hospital_id: hospitalId,
      },
    });
  }

  async create(data: Prisma.BloodRequestUncheckedCreateInput) {
    return this.prisma.bloodRequest.create({
      data,
      select: this.selectRequest,
    });
  }

  async findById(id: string) {
    return this.prisma.bloodRequest.findUnique({
      where: { id },
      select: this.selectRequest,
    });
  }

  async findByIdWithoutSelect(id: string) {
    return this.prisma.bloodRequest.findUnique({
      where: { id },
    });
  }

  async delete(id: string) {
    return this.prisma.bloodRequest.delete({
      where: { id },
    });
  }

  async findManyByCriteria(
    where: Prisma.BloodRequestWhereInput,
    skip?: number,
    take?: number,
  ) {
    return this.prisma.bloodRequest.findMany({
      where,
      select: this.selectRequest,
      skip,
      take,
      orderBy: { created_at: 'desc' },
    });
  }

  async count(where?: Prisma.BloodRequestWhereInput) {
    return this.prisma.bloodRequest.count({ where });
  }

  async updateStatus(
    id: string,
    data: Prisma.BloodRequestUncheckedUpdateInput,
  ) {
    return this.prisma.bloodRequest.update({
      where: { id },
      data,
      select: this.selectRequest,
    });
  }
}
