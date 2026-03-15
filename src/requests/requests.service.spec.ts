/**
 * @fileoverview Unit Tests for RequestsService (Repository Pattern)
 * 
 * @description
 * This test suite verifies the core business logic of the RequestsService. 
 * It ensures that the service correctly handles data validation, error throwing, and 
 * data manipulation through the injected RequestsRepository mock.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { RequestsRepository } from './requests.repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as requestCodeHelper from '../common/helpers/request-code.helper';

import { RequestedUser } from '../common/interfaces/requested-user.interface';
import { BloodGroup, UrgencyLevel, RequestStatus } from 'prisma/generated/client';

describe('RequestsService', () => {
  let service: RequestsService;
  let repo: RequestsRepository;

  const mockRequestsRepo = {
    findPendingRequestByUserAndHospital: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdWithoutSelect: jest.fn(),
    delete: jest.fn(),
    findManyByCriteria: jest.fn(),
    count: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: RequestsRepository,
          useValue: mockRequestsRepo,
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    repo = module.get<RequestsRepository>(RequestsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('request Blood', () => {
    // Mock user data
    const mockUser: RequestedUser = {
      id: 'user-123',
      hospital_id: 'hospital-123',
      user_name: 'test_user',
      role: 'HOSPITAL',
      permissions: [],
    };

    // Mock request data
    const mockDto = {
      patient_name: 'John Doe',
      blood_group: BloodGroup.A_POS,
      units_required: 2,
      contact_phone: '1234567890',
      required_date: '2026-03-20',
      urgency: UrgencyLevel.high,
      reason: 'Surgery',
    };

    it('should successfully create a new blood request', async () => {
      mockRequestsRepo.findPendingRequestByUserAndHospital.mockResolvedValue(null);
      jest.spyOn(requestCodeHelper, 'generateRequestCode').mockReturnValue('REQ-123456');

      const expectedCreatedRequest = {
        id: 'request-123',
        ...mockDto,
        user_id: mockUser.id,
        hospital_id: mockUser.hospital_id,
        blood_request_code: 'REQ-123456',
        status: RequestStatus.pending,
      };

      mockRequestsRepo.create.mockResolvedValue(expectedCreatedRequest);

      const result = await service.requestBlood(mockUser, mockDto);

      expect(repo.findPendingRequestByUserAndHospital).toHaveBeenCalledWith(mockUser.id, mockUser.hospital_id);
      expect(repo.create).toHaveBeenCalled();
      expect(result.message).toBe('Blood request created successfully');
      expect(result.data).toEqual(expectedCreatedRequest);
    });

    it('should throw BadRequestException if user already has a pending request', async () => {
      mockRequestsRepo.findPendingRequestByUserAndHospital.mockResolvedValue({ id: 'existing-request' });

      await expect(service.requestBlood(mockUser, mockDto)).rejects.toThrow(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });


  });

  describe('remove request', () => {
    it('should delete a request successfully', async () => {
      mockRequestsRepo.findByIdWithoutSelect.mockResolvedValue({ id: 'request-123', hospital_id: 'hosp-1' });
      mockRequestsRepo.delete.mockResolvedValue({ id: 'request-123' });

      const result = await service.remove('request-123', 'hosp-1');

      expect(repo.findByIdWithoutSelect).toHaveBeenCalledWith('request-123');
      expect(repo.delete).toHaveBeenCalledWith('request-123');
      expect(result.message).toBe('Request deleted successfully');
    });

    it('should throw NotFoundException if request does not exist', async () => {
      mockRequestsRepo.findByIdWithoutSelect.mockResolvedValue(null);

      await expect(service.remove('request-123', 'hosp-1')).rejects.toThrow(NotFoundException);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if request belongs to another hospital', async () => {
      mockRequestsRepo.findByIdWithoutSelect.mockResolvedValue({ id: 'request-123', hospital_id: 'hosp-2' });

      await expect(service.remove('request-123', 'hosp-1')).rejects.toThrow(NotFoundException);
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });

  describe('find my requests', () => {
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

  describe('find one', () => {
    it('should return a specific request by id', async () => {
      const mockRequest = { id: 'request-123', status: RequestStatus.pending, hospital_id: 'hosp-1' };
      mockRequestsRepo.findById.mockResolvedValue(mockRequest);

      const result = await service.findOne('request-123', 'hosp-1');

      expect(repo.findById).toHaveBeenCalledWith('request-123');
      expect(result.message).toBe('Request fetched successfully');
      expect(result.data).toEqual(mockRequest);
    });

    it('should throw NotFoundException if request is not found', async () => {
      mockRequestsRepo.findById.mockResolvedValue(null);

      await expect(service.findOne('request-123', 'hosp-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if request belongs to another hospital', async () => {
      const mockRequest = { id: 'request-123', status: RequestStatus.pending, hospital_id: 'hosp-2' };
      mockRequestsRepo.findById.mockResolvedValue(mockRequest);

      await expect(service.findOne('request-123', 'hosp-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('find all', () => {
    it('should return all paginated requests scoped to hospital', async () => {
      const mockQuery = { page: 1, limit: 10 };
      const mockData = [{ id: 'request-1' }, { id: 'request-2' }];

      mockRequestsRepo.findManyByCriteria.mockResolvedValue(mockData);
      mockRequestsRepo.count.mockResolvedValue(2);

      const result = await service.findAll(mockQuery, 'hosp-1');

      const expectedWhere = { hospital_id: 'hosp-1' };

      expect(repo.findManyByCriteria).toHaveBeenCalledWith(expectedWhere, 0, 10);
      expect(repo.count).toHaveBeenCalledWith(expectedWhere);
      expect(result.message).toBe('All requests fetched successfully');
      expect(result.data.data).toEqual(mockData);
      expect(result.data.meta.total).toBe(2);
    });
  });

  describe('update status (accept or reject)', () => {
    const adminId = 'admin-123';

    it('should update status successfully if request is pending', async () => {
      const existingRequest = { id: 'request-123', status: RequestStatus.pending };
      const updatedRequest = { id: 'request-123', status: RequestStatus.approved };

      mockRequestsRepo.findByIdWithoutSelect.mockResolvedValue(existingRequest);
      mockRequestsRepo.updateStatus.mockResolvedValue(updatedRequest);

      const result = await service.updateStatus('request-123', adminId, { status: RequestStatus.approved });

      expect(repo.updateStatus).toHaveBeenCalled();
      expect(result.message).toBe('Request status updated to approved successfully');
      expect(result.data).toEqual(updatedRequest);
    });

    it('should throw NotFoundException if request does not exist', async () => {
      mockRequestsRepo.findByIdWithoutSelect.mockResolvedValue(null);

      await expect(service.updateStatus('request-123', adminId, { status: RequestStatus.approved }, 'hosp-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if request belongs to another hospital', async () => {
      mockRequestsRepo.findByIdWithoutSelect.mockResolvedValue({ id: 'request-123', hospital_id: 'hosp-2' });

      await expect(service.updateStatus('request-123', adminId, { status: RequestStatus.approved }, 'hosp-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if request is not pending', async () => {
      const existingRequest = { id: 'request-123', status: RequestStatus.approved };
      mockRequestsRepo.findByIdWithoutSelect.mockResolvedValue(existingRequest);

      await expect(service.updateStatus('request-123', adminId, { status: RequestStatus.rejected }))
        .rejects.toThrow(BadRequestException);
    });

    it('should only update status when rejecting a request (no approved_by fields set)', async () => {
      const existingRequest = { id: 'request-123', status: RequestStatus.pending };
      const rejectedRequest = { id: 'request-123', status: RequestStatus.rejected };

      mockRequestsRepo.findByIdWithoutSelect.mockResolvedValue(existingRequest);
      mockRequestsRepo.updateStatus.mockResolvedValue(rejectedRequest);

      const result = await service.updateStatus('request-123', adminId, { status: RequestStatus.rejected });

      expect(repo.updateStatus).toHaveBeenCalledWith('request-123', {
        status: RequestStatus.rejected,
      });
      expect(result.message).toBe('Request status updated to rejected successfully');
    });
  });
});
