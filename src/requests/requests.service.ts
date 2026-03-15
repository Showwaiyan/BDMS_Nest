import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RequestsRepository } from './requests.repository';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { RequestsQueryDto } from './dto/query/requests.dto';
import { paginate, paginatedResult } from '../common/helpers/paginate.helper';
import { Prisma, RequestStatus } from 'prisma/generated/client';
import type { RequestedUser } from '../common/interfaces/requested-user.interface';
import { generateRequestCode } from 'src/common/helpers/request-code.helper';

@Injectable()
export class RequestsService {
  constructor(private readonly requestsRepo: RequestsRepository) { }


  async requestBlood(user: RequestedUser, createRequestDto: CreateRequestDto) {
    const existingRequest = await this.requestsRepo.findPendingRequestByUserAndHospital(user.id, user.hospital_id!);

    if (existingRequest) {
      throw new BadRequestException('You already have a pending request! Wait for approval');
    }

    // Generate a random 6-digit code for the request (e.g., REQ-123456 -- Now For Example)
    const blood_request_code = generateRequestCode();

    const request = await this.requestsRepo.create({
      ...createRequestDto,
      user_id: user.id,
      hospital_id: user.hospital_id!,
      blood_request_code,
    });

    return {
      message: 'Blood request created successfully',
      data: request,
    };
  }

  async remove(id: string) {
    const existing = await this.requestsRepo.findByIdWithoutSelect(id);
    if (!existing) {
      throw new NotFoundException('Blood request not found');
    }

    await this.requestsRepo.delete(id);

    return {
      message: 'Request deleted successfully',
      data: null,
    };
  }

  async findMyRequests(userId: string, query: RequestsQueryDto) {
    const { page, limit } = query;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.BloodRequestWhereInput = {
      user_id: userId,
    };

    const [data, total] = await Promise.all([
      this.requestsRepo.findManyByCriteria(where, skip, take),
      this.requestsRepo.count(where),
    ]);

    return {
      message: 'My requests fetched successfully',
      data: paginatedResult(data, total, page, limit),
    };
  }


  async findOne(id: string) {
    const request = await this.requestsRepo.findById(id);

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
      this.requestsRepo.findManyByCriteria({}, skip, take),
      this.requestsRepo.count(),
    ]);

    return {
      message: 'All requests fetched successfully',
      data: paginatedResult(data, total, page, limit),
    };
  }

  async updateStatus(id: string, adminId: string, dto: UpdateRequestStatusDto) {
    const existing = await this.requestsRepo.findByIdWithoutSelect(id);

    if (!existing) {
      throw new NotFoundException('Blood request not found');
    }

    if (existing.status !== RequestStatus.pending) {
      throw new BadRequestException('Request is already approved or rejected');
    }

    const isApproved = dto.status === RequestStatus.approved;

    const request = await this.requestsRepo.updateStatus(id, {
      status: dto.status,
      ...(isApproved ? { approved_by: adminId, approved_at: new Date() } : {}),
    });

    return {
      message: `Request status updated to ${dto.status} successfully`,
      data: request,
    };
  }
}
