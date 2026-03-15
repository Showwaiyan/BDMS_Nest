import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { RequestsQueryDto } from './dto/query/requests.dto';
import { paginate, paginatedResult } from '../common/helpers/paginate.helper';
import { Prisma, RequestStatus } from 'prisma/generated/client';
import type { RequestedUser } from '../common/interfaces/requested-user.interface';
import { generateRequestCode } from 'src/common/helpers/request-code.helper';

@Injectable()
export class RequestsService {
  constructor(private prisma: DatabaseService) { }

  // Select fields for blood request (For Response)
  private readonly selectRequest: Prisma.BloodRequestSelect = {
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
      select: { name: true, phone: true }
    },
    user: {
      select: { user_name: true, email: true }
    }
  };

  async requestBlood(user: RequestedUser, createRequestDto: CreateRequestDto) {
    const existingRequest = await this.prisma.bloodRequest.findFirst({
      where: {
        user_id: user.id,
        status: RequestStatus.pending,
        hospital_id: user.hospital_id,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('You already have a pending request! Wait for approval');
    }

    // Generate a random 6-digit code for the request (e.g., REQ-123456 -- Now For Example)
    const blood_request_code = generateRequestCode();

    const request = await this.prisma.bloodRequest.create({
      data: {
        ...createRequestDto,
        user_id: user.id,
        hospital_id: user.hospital_id!,
        blood_request_code,
      },
      select: this.selectRequest,
    });

    return {
      message: 'Blood request created successfully',
      data: request,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.bloodRequest.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Blood request not found');
    }

    await this.prisma.bloodRequest.delete({ where: { id } });

    return {
      message: 'Request deleted successfully',
      data: null,
    };
  }

  async findMyRequests(userId: string, query: RequestsQueryDto) {
    console.log(userId, query)

    const { page, limit } = query;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.BloodRequestWhereInput = {
      user_id: userId,
    };

    const [data, total] = await Promise.all([
      this.prisma.bloodRequest.findMany({
        where,
        select: this.selectRequest,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.bloodRequest.count({ where }),
    ]);

    return {
      message: 'My requests fetched successfully',
      data: paginatedResult(data, total, page, limit),
    };
  }


  async findOne(id: string) {
    const request = await this.prisma.bloodRequest.findUnique({
      where: { id },
      select: this.selectRequest,
    });

    if (!request) {
      throw new NotFoundException('Blood request not found');
    }

    return {
      message: 'Request fetched successfully',
      data: request,
    };
  }

  async findAll(query: RequestsQueryDto) {
    const { page, limit } = query;
    const { skip, take } = paginate(page, limit);

    const [data, total] = await Promise.all([
      this.prisma.bloodRequest.findMany({
        select: this.selectRequest,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.bloodRequest.count(),
    ]);

    return {
      message: 'All requests fetched successfully',
      data: paginatedResult(data, total, page, limit),
    };
  }

  async updateStatus(id: string, adminId: string, dto: UpdateRequestStatusDto) {
    const existing = await this.prisma.bloodRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Blood request not found');
    }

    if (existing.status !== RequestStatus.pending) {
      throw new BadRequestException('Request is already approved or rejected');
    }

    const request = await this.prisma.bloodRequest.update({
      where: { id },
      data: {
        status: dto.status,
        approved_by: adminId,
        approved_at: new Date(),
      },
      select: this.selectRequest,
    });

    return {
      message: `Request status updated to ${dto.status} successfully`,
      data: request,
    };
  }
}
