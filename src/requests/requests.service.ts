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
import { RequestFindOptions } from './interfaces/request-find-options.interface';

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
    const request = await this.findRequestOrThrow(id, { hospitalId });

    if (request.status === RequestStatus.fulfilled) {
      throw new BadRequestException('Fulfilled requests cannot be deleted.');
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

    const where = this.getSearchCriteria(query, { user_id: userId });

    const [data, total] = await Promise.all([
      this.requestsRepo.findManyByCriteria(where, skip, take),
      this.requestsRepo.count(where),
    ]);

    return {
      message: 'My requests fetched successfully',
      data: paginatedResult(data, total, page, limit),
    };
  }

  async findOne(id: string, userId: string, hospitalId: string, role: string) {
    const isAdminOrStaff = ['ADMIN', 'STAFF'].includes(role); // ADMIN and STAFF can view all requests.

    await this.findRequestOrThrow(id, {
      hospitalId,
      userId: isAdminOrStaff ? undefined : userId,
    });

    const request = await this.requestsRepo.findById(id);
    return {
      message: 'Request fetched successfully',
      data: request,
    };
  }

  async findAll(query: RequestsQueryDto, hospitalId?: string) {
    const { page, limit } = query;
    const { skip, take } = paginate(page, limit);

    const where = this.getSearchCriteria(query, {
      ...(hospitalId && { hospital_id: hospitalId }),
    });

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
      const existing = await this.findRequestOrThrow(id, { hospitalId });
      throw new BadRequestException(
        `Cannot update status. Request is already ${existing.status}`,
      );
    }

    const updatedRequest = await this.requestsRepo.findById(id);
    return {
      message: `Request status updated to ${dto.status} successfully`,
      data: updatedRequest,
    };
  }

  async approveRequest(id: string, adminId: string, hospitalId?: string) {
    // find pending, then update status to approved, add admin id and approved at
    const request = await this.requestsRepo.updateStatusIfPending(
      id,
      {
        status: RequestStatus.approved,
        approved_by: adminId,
        approved_at: new Date(),
      },
      hospitalId,
    );

    // if request is 0, it means the request is not found or not pending
    if (request === 0) {
      const existing = await this.findRequestOrThrow(id, { hospitalId });
      throw new BadRequestException(
        `Cannot approve request. It is already ${existing.status}`,
      );
    }

    const updatedRequest = await this.requestsRepo.findById(id);
    return {
      message: `Request status updated to approved successfully`,
      data: updatedRequest,
    };
  }

  async cancelRequest(id: string, userId: string, hospitalId?: string) {
    // find pending, then update status to cancelled
    const request = await this.requestsRepo.updateStatusIfPending(
      id,
      { status: RequestStatus.cancelled },
      hospitalId,
      userId,
    );

    if (request === 0) {
      const existing = await this.findRequestOrThrow(id, {
        hospitalId,
        userId,
      });
      throw new BadRequestException(
        `Cannot cancel request. It is already ${existing.status}`,
      );
    }

    const updatedRequest = await this.requestsRepo.findById(id);
    return {
      message: 'Request cancelled successfully',
      data: updatedRequest,
    };
  }

  async fulfillRequest(id: string, hospitalId?: string) {
    // find approved, then update status to fulfilled
    const request = await this.requestsRepo.updateStatusIfApproved(
      id,
      { status: RequestStatus.fulfilled },
      hospitalId,
    );

    if (request === 0) {
      const existing = await this.findRequestOrThrow(id, { hospitalId });
      throw new BadRequestException(
        `Cannot fulfill request. Status is ${existing.status}, but must be approved`,
      );
    }

    const updatedRequest = await this.requestsRepo.findById(id);
    return {
      message: 'Request fulfilled successfully',
      data: updatedRequest,
    };
  }

  private async findRequestOrThrow(
    id: string,
    options: RequestFindOptions = {},
  ) {
    // find request by id without select
    const existingRequest = await this.requestsRepo.findByIdWithoutSelect(id);
    // check if request exists and user has access
    if (
      !existingRequest ||
      (options.hospitalId &&
        existingRequest.hospital_id !== options.hospitalId) ||
      (options.userId && existingRequest.user_id !== options.userId)
    ) {
      throw new NotFoundException(
        options.notFoundMessage || 'Blood request not found',
      );
    }

    // check if request status is as expected
    if (
      options?.expectedStatus &&
      existingRequest.status !== options.expectedStatus
    ) {
      throw new BadRequestException(
        options.statusErrorMessage ||
          `Expected status: ${options.expectedStatus}, got: ${existingRequest.status}`,
      );
    }

    return existingRequest;
  }

  private getSearchCriteria(
    query: RequestsQueryDto,
    filters: Prisma.BloodRequestWhereInput,
  ): Prisma.BloodRequestWhereInput {
    const {
      status,
      urgency,
      blood_group,
      user_id,
      search,
      from_date,
      to_date,
      with_deleted,
    } = query;

    return {
      ...filters,
      status: status || RequestStatus.pending,
      ...(urgency && { urgency }),
      ...(blood_group && { blood_group }),
      ...(user_id && { user_id }),
      ...(!with_deleted && { deleted_at: null }),
      ...(search && {
        OR: [
          { patient_name: { contains: search, mode: 'insensitive' } },
          { blood_request_code: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...((from_date || to_date) && {
        required_date: {
          ...(from_date && { gte: new Date(from_date) }),
          ...(to_date && { lte: new Date(to_date) }),
        },
      }),
    };
  }
}
