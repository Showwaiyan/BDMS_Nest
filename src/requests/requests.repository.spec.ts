import { Test, TestingModule } from '@nestjs/testing';
import { RequestsRepository } from './requests.repository';
import { DatabaseService } from '../database/database.service';
import {
  RequestStatus,
  BloodGroup,
  UrgencyLevel,
} from 'prisma/generated/client';

describe('RequestsRepository', () => {
  let repository: RequestsRepository;
  let dbService: DatabaseService;

  const mockDbService = {
    bloodRequest: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsRepository,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    repository = module.get<RequestsRepository>(RequestsRepository);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findPendingRequestByUserAndHospital', () => {
    it('should find a pending request matching user and hospital', async () => {
      const expectedQuery = {
        where: {
          user_id: 'user-1',
          status: RequestStatus.pending,
          hospital_id: 'hosp-1',
          deleted_at: null,
        },
      };
      mockDbService.bloodRequest.findFirst.mockResolvedValue({ id: 'req-1' });

      const result = await repository.findPendingRequestByUserAndHospital(
        'user-1',
        'hosp-1',
      );

      expect(dbService.bloodRequest.findFirst).toHaveBeenCalledWith(
        expectedQuery,
      );
      expect(result).toEqual({ id: 'req-1' });
    });
  });

  describe('create', () => {
    it('should create a request and return selected fields', async () => {
      const inputData = {
        user_id: '1',
        hospital_id: '2',
        blood_group: BloodGroup.A_POS,
        urgency: UrgencyLevel.high,
        patient_name: 'test',
        units_required: 1,
        contact_phone: '1',
        required_date: new Date(),
        reason: 'test',
      };
      mockDbService.bloodRequest.create.mockResolvedValue({ id: 'req-2' });

      await repository.create(inputData);

      expect(dbService.bloodRequest.create).toHaveBeenCalledWith({
        data: inputData,
        select: repository.selectRequest,
      });
    });
  });

  describe('findById', () => {
    it('should find a specific request with strict selects', async () => {
      mockDbService.bloodRequest.findFirst.mockResolvedValue({ id: 'req-1' });

      await repository.findById('req-1');

      expect(dbService.bloodRequest.findFirst).toHaveBeenCalledWith({
        where: { id: 'req-1', deleted_at: null },
        select: repository.selectRequest,
      });
    });
  });

  describe('findByIdWithoutSelect', () => {
    it('should find a request without select masking', async () => {
      mockDbService.bloodRequest.findFirst.mockResolvedValue({ id: 'req-1' });

      await repository.findByIdWithoutSelect('req-1');

      expect(dbService.bloodRequest.findFirst).toHaveBeenCalledWith({
        where: { id: 'req-1', deleted_at: null },
      });
    });
  });

  describe('delete', () => {
    it('should issue a soft-delete (update) command to Prisma', async () => {
      mockDbService.bloodRequest.update.mockResolvedValue({ id: 'req-1' });

      await repository.delete('req-1');

      expect(dbService.bloodRequest.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: { deleted_at: expect.any(Date) as Date },
      });
    });
  });

  describe('findManyByCriteria', () => {
    it('should search many requests with pagination options', async () => {
      mockDbService.bloodRequest.findMany.mockResolvedValue([{ id: 'req-1' }]);

      await repository.findManyByCriteria({ user_id: 'user-1' }, 10, 5);

      expect(dbService.bloodRequest.findMany).toHaveBeenCalledWith({
        where: { user_id: 'user-1', deleted_at: null },
        select: repository.selectRequest,
        skip: 10,
        take: 5,
        orderBy: { created_at: 'desc' },
      });
    });
  });

  describe('count', () => {
    it('should return a db count', async () => {
      mockDbService.bloodRequest.count.mockResolvedValue(100);

      const count = await repository.count({ user_id: 'user-1' });

      expect(dbService.bloodRequest.count).toHaveBeenCalledWith({
        where: { user_id: 'user-1', deleted_at: null },
      });
      expect(count).toBe(100);
    });
  });

  describe('updateStatus', () => {
    it('should execute an update on the db', async () => {
      mockDbService.bloodRequest.update.mockResolvedValue({ id: 'req-1' });
      const updateData = { status: RequestStatus.approved };

      await repository.updateStatus('req-1', updateData);

      expect(dbService.bloodRequest.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: updateData,
        select: repository.selectRequest,
      });
    });
  });
});
