import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  constructor(private readonly requestsRepo: RequestsRepository) {}

  async requestBlood(user: RequestedUser, createRequestDto: CreateRequestDto) {
    if (!user.hospital_id) {
      throw new BadRequestException(
        'Hospital ID is required to create a blood request',
      );
    }

    const hospitalId = user.hospital_id;
    const existingRequest =
      await this.requestsRepo.findPendingRequestByUserAndHospital(
        user.id,
        hospitalId,
      );

    if (existingRequest) {
      throw new BadRequestException(
        'You already have a pending request! Wait for approval',
      );
    }

    const blood_request_code = generateRequestCode();

    try {
      const request = await this.requestsRepo.create({
        ...createRequestDto,
        user: {
          connect: {
            id: user.id,
          },
        },
        hospital: {
          connect: {
            id: hospitalId,
          },
        },
        blood_request_code,
      });

      return {
        message: 'Blood request created successfully',
        data: request,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'You already have a pending request! Wait for approval',
        );
      }
      throw error;
    }
  }

  async remove(id: string, hospitalId?: string) {
    const existing = await this.requestsRepo.findByIdWithoutSelect(id);
    if (!existing || (hospitalId && existing.hospital_id !== hospitalId)) {
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

  async findOne(id: string, hospitalId?: string) {
    const request = await this.requestsRepo.findById(id);

    if (!request || (hospitalId && request.hospital_id !== hospitalId)) {
      throw new NotFoundException('Blood request not found');
    }

    return {
      message: 'Request fetched successfully',
      data: request,
    };
  }

  async findAll(query: RequestsQueryDto, hospitalId?: string) {
    const { page, limit } = query;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.BloodRequestWhereInput = {
      ...(hospitalId && { hospital_id: hospitalId }),
    };

    const [data, total] = await Promise.all([
      this.requestsRepo.findManyByCriteria(where, skip, take),
      this.requestsRepo.count(where),
    ]);

    return {
      message: 'All requests fetched successfully',
      data: paginatedResult(data, total, page, limit),
    };
  }

  async updateStatus(
    id: string,
    adminId: string,
    dto: UpdateRequestStatusDto,
    hospitalId?: string,
  ) {
    if (!['approved', 'rejected'].includes(dto.status)) {
      throw new BadRequestException(
        'Only approved or rejected statuses are allowed',
      );
    }

    // filter approved request to add admin id and approved at
    const isApproved = dto.status === RequestStatus.approved;
    const request = await this.requestsRepo.updateStatusIfPending(
      id,
      {
        status: dto.status,
        ...(isApproved
          ? { approved_by: adminId, approved_at: new Date() }
          : {}),
      },
      hospitalId,
    );

    if (request === 0) {
      const existingRequest = await this.requestsRepo.findByIdWithoutSelect(id);

      if (
        !existingRequest ||
        (hospitalId && existingRequest.hospital_id !== hospitalId)
      ) {
        throw new NotFoundException('Blood request not found');
      }

      if (existingRequest.status !== RequestStatus.pending) {
        throw new BadRequestException(
          'Request is already approved or rejected',
        );
      }
    }

    const updatedRequest = await this.requestsRepo.findById(id);
    return {
      message: `Request status updated to ${dto.status} successfully`,
      data: updatedRequest,
    };
  }
}
