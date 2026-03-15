/**
 * @fileoverview Unit Tests for RequestsService
 * 
 * @description
 * This test suite verifies the core business logic and database interactions of the RequestsService. 
 * It ensures that the service correctly handles data validation, error throwing, and data manipulation 
 * through the injected DatabaseService mock.
 * 
 * @coverage
 * The following critical workflows and edge cases are tested:
 * - `requestBlood`: Successful request creation and prevention of duplicate pending requests.
 * - `remove`: Successful request deletion and validation against non-existent records.
 * - `findMyRequests`: Retrieval and pagination of a specific user's blood requests.
 * - `findOne`: Single request retrieval by ID and appropriate error handling for invalid IDs.
 * - `findAll`: Administrative retrieval and pagination of all system blood requests.
 * - `updateStatus`: State transitions (e.g., 'pending' to 'approved'), preventing updates on non-existent records, and restricting updates on already processed requests.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as requestCodeHelper from '../common/helpers/request-code.helper';

import { RequestedUser } from '../common/interfaces/requested-user.interface';
import { BloodGroup, UrgencyLevel, Role, RequestStatus } from 'prisma/generated/client';

describe('RequestsService', () => {
  let service: RequestsService;
  let dbService: DatabaseService;

  const mockDbService = {
    bloodRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    dbService = module.get<DatabaseService>(DatabaseService);
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
      mockDbService.bloodRequest.findFirst.mockResolvedValue(null);
      jest.spyOn(requestCodeHelper, 'generateRequestCode').mockReturnValue('REQ-123456');

      const expectedCreatedRequest = {
        id: 'request-123',
        ...mockDto,
        user_id: mockUser.id,
        hospital_id: mockUser.hospital_id,
        blood_request_code: 'REQ-123456',
        status: RequestStatus.pending,
      };

      mockDbService.bloodRequest.create.mockResolvedValue(expectedCreatedRequest);

      const result = await service.requestBlood(mockUser, mockDto);

      expect(dbService.bloodRequest.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: mockUser.id,
          status: RequestStatus.pending,
          hospital_id: mockUser.hospital_id,
        },
      });
      expect(dbService.bloodRequest.create).toHaveBeenCalled();
      expect(result.message).toBe('Blood request created successfully');
      expect(result.data).toEqual(expectedCreatedRequest);
    });

    it('should throw BadRequestException if user already has a pending request', async () => {
      mockDbService.bloodRequest.findFirst.mockResolvedValue({ id: 'existing-request' });

      await expect(service.requestBlood(mockUser, mockDto)).rejects.toThrow(BadRequestException);
      expect(dbService.bloodRequest.create).not.toHaveBeenCalled();
    });
  });

  describe('remove request', () => {
    it('should delete a request successfully', async () => {
      mockDbService.bloodRequest.findUnique.mockResolvedValue({ id: 'request-123' });
      mockDbService.bloodRequest.delete.mockResolvedValue({ id: 'request-123' });

      const result = await service.remove('request-123');

      expect(dbService.bloodRequest.findUnique).toHaveBeenCalledWith({ where: { id: 'request-123' } });
      expect(dbService.bloodRequest.delete).toHaveBeenCalledWith({ where: { id: 'request-123' } });
      expect(result.message).toBe('Request deleted successfully');
    });

    it('should throw NotFoundException if request does not exist', async () => {
      mockDbService.bloodRequest.findUnique.mockResolvedValue(null);

      await expect(service.remove('request-123')).rejects.toThrow(NotFoundException);
      expect(dbService.bloodRequest.delete).not.toHaveBeenCalled();
    });
  });

  describe('find my requests', () => {
    it('should return paginated requests for the user', async () => {
      const mockQuery = { page: 1, limit: 10 };
      const userId = 'user-123';
      const mockData = [{ id: 'request-1' }, { id: 'request-2' }];

      mockDbService.bloodRequest.findMany.mockResolvedValue(mockData);
      mockDbService.bloodRequest.count.mockResolvedValue(2);

      const result = await service.findMyRequests(userId, mockQuery);

      expect(dbService.bloodRequest.findMany).toHaveBeenCalled();
      expect(dbService.bloodRequest.count).toHaveBeenCalledWith({ where: { user_id: userId } });
      expect(result.message).toBe('My requests fetched successfully');
      expect(result.data.data).toEqual(mockData);
      expect(result.data.meta.total).toBe(2);
    });
  });

  describe('find one', () => {
    it('should return a specific request by id', async () => {
      const mockRequest = { id: 'request-123', status: RequestStatus.pending };
      mockDbService.bloodRequest.findUnique.mockResolvedValue(mockRequest);

      const result = await service.findOne('request-123');

      expect(dbService.bloodRequest.findUnique).toHaveBeenCalled();
      expect(result.message).toBe('Request fetched successfully');
      expect(result.data).toEqual(mockRequest);
    });

    it('should throw NotFoundException if request is not found', async () => {
      mockDbService.bloodRequest.findUnique.mockResolvedValue(null);

      await expect(service.findOne('request-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('find all', () => {
    it('should return all paginated requests', async () => {
      const mockQuery = { page: 1, limit: 10 };
      const mockData = [{ id: 'request-1' }, { id: 'request-2' }, { id: 'request-3' }];

      mockDbService.bloodRequest.findMany.mockResolvedValue(mockData);
      mockDbService.bloodRequest.count.mockResolvedValue(3);

      const result = await service.findAll(mockQuery);

      expect(dbService.bloodRequest.findMany).toHaveBeenCalled();
      expect(dbService.bloodRequest.count).toHaveBeenCalled();
      expect(result.message).toBe('All requests fetched successfully');
      expect(result.data.data).toEqual(mockData);
      expect(result.data.meta.total).toBe(3);
    });
  });

  describe('update status (accept or reject)', () => {
    const adminId = 'admin-123';

    it('should update status successfully if request is pending', async () => {
      const existingRequest = { id: 'request-123', status: RequestStatus.pending };
      const updatedRequest = { id: 'request-123', status: RequestStatus.approved };

      mockDbService.bloodRequest.findUnique.mockResolvedValue(existingRequest);
      mockDbService.bloodRequest.update.mockResolvedValue(updatedRequest);

      const result = await service.updateStatus('request-123', adminId, { status: RequestStatus.approved });

      expect(dbService.bloodRequest.update).toHaveBeenCalled();
      expect(result.message).toBe('Request status updated to approved successfully');
      expect(result.data).toEqual(updatedRequest);
    });

    it('should throw NotFoundException if request does not exist', async () => {
      mockDbService.bloodRequest.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus('request-123', adminId, { status: RequestStatus.approved }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if request is not pending', async () => {
      const existingRequest = { id: 'request-123', status: RequestStatus.approved };
      mockDbService.bloodRequest.findUnique.mockResolvedValue(existingRequest);

      await expect(service.updateStatus('request-123', adminId, { status: RequestStatus.rejected }))
        .rejects.toThrow(BadRequestException);
    });
  });
});
