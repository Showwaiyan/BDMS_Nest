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

  async findPendingRequestByUserAndHospital(
    userId: string,
    hospitalId: string,
  ) {
    return this.prisma.bloodRequest.findFirst({
      where: {
        user_id: userId,
        status: RequestStatus.pending,
        hospital_id: hospitalId,
        deleted_at: null,
      },
    });
  }

  async create(data: Prisma.BloodRequestCreateInput) {
    return this.prisma.bloodRequest.create({
      data,
      select: this.selectRequest,
    });
  }

  async findById(id: string) {
    return this.prisma.bloodRequest.findFirst({
      where: { id, deleted_at: null },
      select: this.selectRequest,
    });
  }

  async findByIdWithoutSelect(id: string) {
    return this.prisma.bloodRequest.findFirst({
      where: { id, deleted_at: null },
    });
  }

  async delete(id: string) {
    return this.prisma.bloodRequest.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async findManyByCriteria(
    where: Prisma.BloodRequestWhereInput,
    skip?: number,
    take?: number,
  ) {
    return this.prisma.bloodRequest.findMany({
      where: { ...where, deleted_at: null },
      select: this.selectRequest,
      skip,
      take,
      orderBy: { created_at: 'desc' },
    });
  }

  async count(where?: Prisma.BloodRequestWhereInput) {
    return this.prisma.bloodRequest.count({
      where: { ...where, deleted_at: null },
    });
  }

  async updateStatus(id: string, data: Prisma.BloodRequestUpdateInput) {
    return this.prisma.bloodRequest.update({
      where: { id },
      data,
      select: this.selectRequest,
    });
  }

  async updateStatusIfPending(
    id: string,
    data: Prisma.BloodRequestUncheckedUpdateInput,
    hospitalId?: string,
    userId?: string,
  ) {
    const updated = await this.prisma.bloodRequest.updateMany({
      where: {
        id,
        status: RequestStatus.pending,
        hospital_id: hospitalId,
        user_id: userId,
      },
      data,
    });
    // number of rows updated
    return updated.count;
  }

  async updateStatusIfApproved(
    id: string,
    data: Prisma.BloodRequestUncheckedUpdateInput,
    hospitalId?: string,
  ) {
    const updated = await this.prisma.bloodRequest.updateMany({
      where: {
        id,
        status: RequestStatus.approved,
        hospital_id: hospitalId,
      },
      data,
    });
    // number of rows updated
    return updated.count;
  }
}
