import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatus } from 'prisma/generated/client';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;

  const mockService = {
    create: jest.fn(),
    findAppointments: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [{ provide: AppointmentsService, useValue: mockService }],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create appointment', async () => {
      const dto = {
        blood_request_id: 'blood-request-123',
        hospital_id: 'hospital-123',
        appointment_date: '2026-04-15',
        appointment_time: '14:30',
        remarks: 'Test appointment',
      };
      const user = {
        id: 'staff-user-123',
        user_name: 'staff',
        role: 'STAFF',
        permissions: [],
      };
      const result = {
        message: 'Appointment created successfully',
        data: { id: 'apt-1' },
      };

      mockService.create.mockResolvedValue(result);

      expect(await controller.create(user, dto)).toBe(result);
      expect(mockService.create).toHaveBeenCalledWith('staff-user-123', dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated appointments', async () => {
      const query = { page: 1, limit: 10 };
      const result = {
        message: 'Appointments retrieved successfully',
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };

      mockService.findAppointments.mockResolvedValue(result);

      expect(await controller.findAll(query)).toBe(result);
      expect(mockService.findAppointments).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return appointment by id', async () => {
      const result = {
        message: 'Appointment retrieved successfully',
        data: { id: 'apt-1' },
      };

      mockService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('apt-1')).toBe(result);
      expect(mockService.findOne).toHaveBeenCalledWith('apt-1');
    });
  });

  describe('update', () => {
    it('should update appointment', async () => {
      const dto = { remarks: 'Updated remarks' };
      const result = {
        message: 'Appointment updated successfully',
        data: { id: 'apt-1', remarks: 'Updated remarks' },
      };

      mockService.update.mockResolvedValue(result);

      expect(await controller.update('apt-1', dto)).toBe(result);
      expect(mockService.update).toHaveBeenCalledWith('apt-1', dto);
    });
  });

  describe('updateStatus', () => {
    it('should update appointment status', async () => {
      const dto = { status: 'confirmed' as AppointmentStatus };
      const result = {
        message: 'Appointment status updated successfully',
        data: { id: 'apt-1', status: 'confirmed' },
      };

      mockService.updateStatus.mockResolvedValue(result);

      expect(await controller.updateStatus('apt-1', dto)).toBe(result);
      expect(mockService.updateStatus).toHaveBeenCalledWith('apt-1', dto);
    });
  });

  describe('remove', () => {
    it('should delete appointment', async () => {
      const result = {
        message: 'Appointment deleted successfully',
        data: null,
      };

      mockService.remove.mockResolvedValue(result);

      expect(await controller.remove('apt-1')).toBe(result);
      expect(mockService.remove).toHaveBeenCalledWith('apt-1');
    });
  });
});
