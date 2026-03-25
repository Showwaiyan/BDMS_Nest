import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;

  const mockService = {
    create: jest.fn(),
    findAppointments: jest.fn(),
    findMyAppointments: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    confirmAppointment: jest.fn(),
    cancelAppointment: jest.fn(),
    completeAppointment: jest.fn(),
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
      const result = {
        message: 'Appointment created successfully',
        data: { id: 'apt-1' },
      };

      mockService.create.mockResolvedValue(result);

      expect(await controller.create(dto)).toBe(result);
      expect(mockService.create).toHaveBeenCalledWith(dto);
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

  describe('findMyAppointments', () => {
    it('should return user appointments', async () => {
      const user = {
        id: 'user-123',
        user_name: 'test',
        role: 'USER',
        permissions: ['appointment.view'],
      };
      const query = { page: 1, limit: 10 };
      const result = {
        message: 'Appointments retrieved successfully',
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };

      mockService.findMyAppointments.mockResolvedValue(result);

      expect(await controller.findMyAppointments(user, query)).toBe(result);
      expect(mockService.findMyAppointments).toHaveBeenCalledWith(
        'user-123',
        query,
      );
    });
  });

  describe('findOne', () => {
    it('should return appointment for owner', async () => {
      const user = {
        id: 'user-123',
        user_name: 'test',
        role: 'USER',
        permissions: ['appointment.view'],
      };
      const result = {
        message: 'Appointment retrieved successfully',
        data: { id: 'apt-1', user_id: 'user-123' },
      };

      mockService.findOne.mockResolvedValue(result);

      expect(await controller.findOne(user, 'apt-1')).toBe(result);
      expect(mockService.findOne).toHaveBeenCalledWith(user, 'apt-1');
    });
  });

  describe('confirm', () => {
    it('should confirm appointment', async () => {
      const result = {
        message: 'Appointment confirmed successfully',
        data: { id: 'apt-1', status: 'confirmed' },
      };

      mockService.confirmAppointment.mockResolvedValue(result);

      expect(await controller.confirm('apt-1')).toBe(result);
      expect(mockService.confirmAppointment).toHaveBeenCalledWith('apt-1');
    });
  });

  describe('cancel', () => {
    it('should cancel appointment', async () => {
      const result = {
        message: 'Appointment cancelled successfully',
        data: null,
      };

      mockService.cancelAppointment.mockResolvedValue(result);

      expect(await controller.cancel('apt-1')).toBe(result);
      expect(mockService.cancelAppointment).toHaveBeenCalledWith('apt-1');
    });
  });

  describe('complete', () => {
    it('should complete appointment', async () => {
      const result = {
        message: 'Appointment completed successfully',
        data: { id: 'apt-1', status: 'completed' },
      };

      mockService.completeAppointment.mockResolvedValue(result);

      expect(await controller.complete('apt-1')).toBe(result);
      expect(mockService.completeAppointment).toHaveBeenCalledWith('apt-1');
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
