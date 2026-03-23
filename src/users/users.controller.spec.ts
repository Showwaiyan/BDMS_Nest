import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    findAllPatients: jest.Mock;
    getMe: jest.Mock;
    getStatsSummary: jest.Mock;
    getStatsByRole: jest.Mock;
    findStaffByHospital: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    updateUserRole: jest.Mock;
    toggleActive: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findAllPatients: jest.fn(),
      getMe: jest.fn(),
      getStatsSummary: jest.fn(),
      getStatsByRole: jest.fn(),
      findStaffByHospital: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateUserRole: jest.fn(),
      toggleActive: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should throw when current user has no hospital', () => {
    expect(() =>
      controller.findAll({ id: 'u1' } as any, { page: 1, limit: 10 }),
    ).toThrow(ForbiddenException);
  });

  it('findAll should call service with hospital scope', async () => {
    await controller.findAll({ id: 'u1', hospital_id: 'h1' } as any, {
      page: 1,
      limit: 10,
    });

    expect(usersService.findAllPatients).toHaveBeenCalledWith(
      { page: 1, limit: 10 },
      'h1',
    );
  });

  it('getMe should call usersService.getMe', async () => {
    await controller.getMe({ id: 'u1' } as any);
    expect(usersService.getMe).toHaveBeenCalledWith('u1');
  });

  it('updateRole should call service with hospital and role', async () => {
    await controller.updateRole(
      { id: 'admin-1', hospital_id: 'h1' } as any,
      'u2',
      { role: 'STAFF' },
    );

    expect(usersService.updateUserRole).toHaveBeenCalledWith(
      'u2',
      'h1',
      'STAFF',
    );
  });

  it('remove should call service with hospital scope', async () => {
    await controller.remove({ id: 'admin-1', hospital_id: 'h1' } as any, 'u2');

    expect(usersService.remove).toHaveBeenCalledWith('u2', 'h1');
  });
});
