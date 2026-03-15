import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { RequestsQueryDto } from './dto/query/requests.dto';
import { RequestStatus, BloodGroup, UrgencyLevel } from 'prisma/generated/client';
import { RequestedUser } from '../common/interfaces/requested-user.interface';

describe('RequestsController', () => {
  let controller: RequestsController;
  let service: RequestsService;

  const mockRequestsService = {
    requestBlood: jest.fn(),
    findMyRequests: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser: RequestedUser = {
    id: 'user-1',
    user_name: 'test',
    role: 'HOSPITAL',
    permissions: [],
    hospital_id: 'hosp-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        {
          provide: RequestsService,
          useValue: mockRequestsService,
        },
      ],
    }).compile();

    controller = module.get<RequestsController>(RequestsController);
    service = module.get<RequestsService>(RequestsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestBlood', () => {
    it('should throw ForbiddenException if user has no hospital_id', () => {
      const dto = {} as CreateRequestDto;
      const userWithoutHospital = { ...mockUser, hospital_id: undefined };
      expect(() => controller.requestBlood(userWithoutHospital, dto)).toThrow(ForbiddenException);
    });

    it('should create a request if user has hospital_id', async () => {
      const dto: CreateRequestDto = {
        patient_name: 'John',
        blood_group: BloodGroup.A_POS,
        units_required: 2,
        contact_phone: '123',
        urgency: UrgencyLevel.high,
        required_date: new Date().toISOString(),
        reason: 'Surgery',
      };
      mockRequestsService.requestBlood.mockResolvedValue({ message: 'Success', data: { id: 'req-1' } });
      expect(await controller.requestBlood(mockUser, dto)).toEqual({ message: 'Success', data: { id: 'req-1' } });
      expect(service.requestBlood).toHaveBeenCalledWith(mockUser, dto);
    });
  });

  describe('Role Guards Metadata', () => {
    it('should restrict findOne to ADMIN and STAFF', () => {
      const roles = Reflect.getMetadata('roles', controller.findOne);
      expect(roles).toEqual(['ADMIN', 'STAFF']);
    });

    it('should restrict updateStatus to ADMIN and STAFF', () => {
      const roles = Reflect.getMetadata('roles', controller.updateStatus);
      expect(roles).toEqual(['ADMIN', 'STAFF']);
    });

    it('should restrict findAll to ADMIN and STAFF', () => {
      const roles = Reflect.getMetadata('roles', controller.findAll);
      expect(roles).toEqual(['ADMIN', 'STAFF']);
    });

    it('should restrict remove to ADMIN', () => {
      const roles = Reflect.getMetadata('roles', controller.remove);
      expect(roles).toEqual(['ADMIN']);
    });
  });

  describe('findAll and findMyRequests', () => {
    it('should return all requests filtered by hospital', async () => {
      const query = new RequestsQueryDto();
      mockRequestsService.findAll.mockResolvedValue({ message: 'Success', data: [] });
      expect(await controller.findAll(query, mockUser)).toEqual({ message: 'Success', data: [] });
      expect(service.findAll).toHaveBeenCalledWith(query, 'hosp-1');
    });

    it('should return user requests', async () => {
      const query = new RequestsQueryDto();
      mockRequestsService.findMyRequests.mockResolvedValue({ message: 'Success', data: [] });
      expect(await controller.findMyRequests(mockUser, query)).toEqual({ message: 'Success', data: [] });
    });
  });

  describe('updateStatus', () => {
    it('should update request status with hospital scope', async () => {
      const dto: UpdateRequestStatusDto = { status: RequestStatus.approved };
      mockRequestsService.updateStatus.mockResolvedValue({ message: 'Updated', data: { id: 'req-1' } });
      expect(await controller.updateStatus(mockUser, 'req-1', dto)).toEqual({ message: 'Updated', data: { id: 'req-1' } });
      expect(service.updateStatus).toHaveBeenCalledWith('req-1', 'user-1', dto, 'hosp-1');
    });
  });
});
