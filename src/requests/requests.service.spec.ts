/**
 * Unit Tests for RequestsService
 *
 * Each test follows: ARRANGE → ACT → ASSERT
 * - ARRANGE: set mock return values
 * - ACT: call the service method
 * - ASSERT: verify result or method calls
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { RequestsRepository } from './requests.repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as requestCodeHelper from '../common/helpers/request-code.helper';

import { RequestedUser } from '../common/interfaces/requested-user.interface';
import {
  BloodGroup,
  UrgencyLevel,
  RequestStatus,
} from 'prisma/generated/client';

describe('RequestsService', () => {
  let service: RequestsService;
  let repo: RequestsRepository;

  // Fake repository - each method is jest.fn() so we can control returns & verify calls
  const mockRequestsRepo = {
    findPendingRequestByUserAndHospital: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdWithoutSelect: jest.fn(),
    delete: jest.fn(),
    findManyByCriteria: jest.fn(),
    count: jest.fn(),
    updateStatus: jest.fn(),
    updateStatusIfPending: jest.fn(),
  };

  // Before each test: create module with real service + mock repo
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: RequestsRepository, useValue: mockRequestsRepo },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    repo = module.get<RequestsRepository>(RequestsRepository);
  });

  // After each test: reset mock history to prevent leaking between tests
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- requestBlood ---
  describe('request Blood', () => {
    const mockUser: RequestedUser = {
      id: 'user-123',
      hospital_id: 'hospital-123',
      user_name: 'test_user',
      role: 'HOSPITAL',
      permissions: [],
    };

    const mockDto = {
      patient_name: 'John Doe',
      blood_group: BloodGroup.A_POS,
      units_required: 2,
      contact_phone: '1234567890',
      required_date: '2026-03-20',
      urgency: UrgencyLevel.high,
      reason: 'Surgery',
    };

    // Happy path: no duplicate -> create succeeds
    it('should successfully create a new blood request', async () => {
      // ARRANGE: no existing pending request
      mockRequestsRepo.findPendingRequestByUserAndHospital.mockResolvedValue(
        null,
      );
      jest
        .spyOn(requestCodeHelper, 'generateRequestCode')
        .mockReturnValue('REQ-123456');

      const expectedCreatedRequest = {
        id: 'request-123',
        ...mockDto,
        user_id: mockUser.id,
        hospital_id: mockUser.hospital_id,
        blood_request_code: 'REQ-123456',
        status: RequestStatus.pending,
      };
      mockRequestsRepo.create.mockResolvedValue(expectedCreatedRequest);

      // ACT
      const result = await service.requestBlood(mockUser, mockDto);

      // ASSERT
      expect(repo.findPendingRequestByUserAndHospital).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.hospital_id,
      );
      expect(repo.create).toHaveBeenCalled();
      expect(result.message).toBe('Blood request created successfully');
      expect(result.data).toEqual(expectedCreatedRequest);
    });

    // Duplicate pending request -> throw
    it('should throw BadRequestException if user already has a pending request', async () => {
      // ARRANGE: pending request already exists
      mockRequestsRepo.findPendingRequestByUserAndHospital.mockResolvedValue({
        id: 'existing-request',
      });

      // ACT + ASSERT
      await expect(service.requestBlood(mockUser, mockDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  // --- remove ---
  describe('remove request', () => {
    // Happy path: request found & belongs to same hospital -> delete
    it('should delete a request successfully', async () => {
      mockRequestsRepo.findByIdWithoutSelect.mockResolvedValue({
        id: 'request-123',
        hospital_id: 'hosp-1',
      });
      mockRequestsRepo.delete.mockResolvedValue({ id: 'request-123' });

      const result = await service.remove('request-123', 'hosp-1');

      expect(repo.findByIdWithoutSelect).toHaveBeenCalledWith('request-123');
      expect(repo.delete).toHaveBeenCalledWith('request-123');
      expect(result.message).toBe('Request deleted successfully');
    });

    // Not found -> throw
    it('should throw NotFoundException if request does not exist', async () => {
      mockRequestsRepo.findByIdWithoutSelect.mockResolvedValue(null);

      await expect(service.remove('request-123', 'hosp-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });

    // Wrong hospital -> throw
    it('should throw NotFoundException if request belongs to another hospital', async () => {
      mockRequestsRepo.findByIdWithoutSelect.mockResolvedValue({
        id: 'request-123',
        hospital_id: 'hosp-2', // mismatch
      });

      await expect(service.remove('request-123', 'hosp-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });

  // --- findMyRequests ---
  describe('find my requests', () => {
    // Returns paginated results filtered by user_id
    it('should return paginated requests for the user', async () => {
      const mockQuery = { page: 1, limit: 10 };
      const userId = 'user-123';
      const mockData = [{ id: 'request-1' }, { id: 'request-2' }];

      mockRequestsRepo.findManyByCriteria.mockResolvedValue(mockData);
      mockRequestsRepo.count.mockResolvedValue(2);

      const result = await service.findMyRequests(userId, mockQuery);

      expect(repo.findManyByCriteria).toHaveBeenCalled();
      expect(repo.count).toHaveBeenCalledWith({ user_id: userId });
      expect(result.message).toBe('My requests fetched successfully');
      expect(result.data.data).toEqual(mockData);
      expect(result.data.meta.total).toBe(2);
    });
  });

  // --- findOne ---
  describe('find one', () => {
    // Happy path
    it('should return a specific request by id', async () => {
      const mockRequest = {
        id: 'request-123',
        status: RequestStatus.pending,
        hospital_id: 'hosp-1',
      };
      mockRequestsRepo.findById.mockResolvedValue(mockRequest);

      const result = await service.findOne('request-123', 'hosp-1');

      expect(repo.findById).toHaveBeenCalledWith('request-123');
      expect(result.message).toBe('Request fetched successfully');
      expect(result.data).toEqual(mockRequest);
    });

    // Not found -> throw
    it('should throw NotFoundException if request is not found', async () => {
      mockRequestsRepo.findById.mockResolvedValue(null);

      await expect(service.findOne('request-123', 'hosp-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    // Wrong hospital -> throw
    it('should throw NotFoundException if request belongs to another hospital', async () => {
      const mockRequest = {
        id: 'request-123',
        status: RequestStatus.pending,
        hospital_id: 'hosp-2', // mismatch
      };
      mockRequestsRepo.findById.mockResolvedValue(mockRequest);

      await expect(service.findOne('request-123', 'hosp-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --- findAll ---
  describe('find all', () => {
    // Returns paginated results scoped to hospital_id
    it('should return all paginated requests scoped to hospital', async () => {
      const mockQuery = { page: 1, limit: 10 };
      const mockData = [{ id: 'request-1' }, { id: 'request-2' }];

      mockRequestsRepo.findManyByCriteria.mockResolvedValue(mockData);
      mockRequestsRepo.count.mockResolvedValue(2);

      const result = await service.findAll(mockQuery, 'hosp-1');

      const expectedWhere = { hospital_id: 'hosp-1' };
      expect(repo.findManyByCriteria).toHaveBeenCalledWith(
        expectedWhere,
        0,
        10,
      );
      expect(repo.count).toHaveBeenCalledWith(expectedWhere);
      expect(result.message).toBe('All requests fetched successfully');
      expect(result.data.data).toEqual(mockData);
      expect(result.data.meta.total).toBe(2);
    });
  });

  // --- updateStatus (approve / reject) ---
  // Rules: only approved/rejected allowed, must be pending, approve sets approved_by/at
  describe('update status (accept or reject)', () => {
    const adminId = 'admin-123';

    // Happy path: approve a pending request
    it('should update status successfully if request is pending', async () => {
      const updatedRequest = {
        id: 'request-123',
        status: RequestStatus.approved,
      };

      // 1 = one row updated (success)
      mockRequestsRepo.updateStatusIfPending.mockResolvedValue(1);
      mockRequestsRepo.findById.mockResolvedValue(updatedRequest);

      const result = await service.updateStatus('request-123', adminId, {
        status: RequestStatus.approved,
      });

      expect(repo.updateStatusIfPending).toHaveBeenCalledTimes(1);
      expect(repo.updateStatusIfPending).toHaveBeenCalledWith(
        'request-123',
        {
          status: RequestStatus.approved,
          approved_by: adminId,
          approved_at: expect.any(Date) as Date,
        },
        undefined,
      );
      expect(repo.findById).toHaveBeenCalledWith('request-123');
      expect(result.message).toBe(
        'Request status updated to approved successfully',
      );
      expect(result.data).toEqual(updatedRequest);
    });

    // Not found -> throw
    it('should throw NotFoundException if request does not exist', async () => {
      // 0 = no rows updated
      mockRequestsRepo.updateStatusIfPending.mockResolvedValue(0);
      mockRequestsRepo.findByIdWithoutSelect.mockResolvedValue(null);

      await expect(
        service.updateStatus(
          'request-123',
          adminId,
          { status: RequestStatus.approved },
          'hosp-1',
        ),
      ).rejects.toThrow(NotFoundException);
      expect(repo.updateStatusIfPending).toHaveBeenCalled();
      expect(repo.findByIdWithoutSelect).toHaveBeenCalledWith('request-123');
    });

    // Wrong hospital -> throw
    it('should throw NotFoundException if request belongs to another hospital', async () => {
      mockRequestsRepo.updateStatusIfPending.mockResolvedValue(0);
      mockRequestsRepo.findByIdWithoutSelect.mockResolvedValue({
        id: 'request-123',
        hospital_id: 'hosp-2', // mismatch
      });

      await expect(
        service.updateStatus(
          'request-123',
          adminId,
          { status: RequestStatus.approved },
          'hosp-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    // Already processed (not pending) -> throw
    it('should throw BadRequestException if request is not pending', async () => {
      mockRequestsRepo.updateStatusIfPending.mockResolvedValue(0);
      mockRequestsRepo.findByIdWithoutSelect.mockResolvedValue({
        id: 'request-123',
        status: RequestStatus.approved, // already processed
      });

      await expect(
        service.updateStatus('request-123', adminId, {
          status: RequestStatus.rejected,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    // Reject -> only status is set, no approved_by/at fields
    it('should only update status when rejecting a request (no approved_by fields set)', async () => {
      const rejectedRequest = {
        id: 'request-123',
        status: RequestStatus.rejected,
      };

      mockRequestsRepo.updateStatusIfPending.mockResolvedValue(1);
      mockRequestsRepo.findById.mockResolvedValue(rejectedRequest);

      const result = await service.updateStatus('request-123', adminId, {
        status: RequestStatus.rejected,
      });

      expect(repo.updateStatusIfPending).toHaveBeenCalledWith(
        'request-123',
        { status: RequestStatus.rejected }, // no approved_by/at
        undefined,
      );
      expect(result.message).toBe(
        'Request status updated to rejected successfully',
      );
    });

    // Invalid status (e.g. "pending") -> throw
    it('should throw BadRequestException for invalid status', async () => {
      await expect(
        service.updateStatus('request-123', adminId, {
          status: RequestStatus.pending,
        }),
      ).rejects.toThrow('Only approved or rejected statuses are allowed');
    });
  });
});
