import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate, paginatedResult } from '../common/helpers/paginate.helper';
import * as bcrypt from 'bcryptjs';
import { Prisma } from 'prisma/generated/client';

@Injectable()
export class UsersService {
  constructor(private prisma: DatabaseService) {}

  // currently selecting for general usage
  // can be optimized further for specific cases if needed
  private readonly selectUser: Prisma.UserSelect = {
    id: true,
    user_name: true,
    email: true,
    role_id: true,
    hospital_id: true,
    is_active: true,
    created_at: true,
    updated_at: true,
    role: {
      select: {
        id: true,
        name: true,
        role_permissions: {
          select: {
            permission: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    },
    password: false,
  };

  async findRoleByName(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async findByUsername(user_name: string) {
    return this.prisma.user.findUnique({
      where: { user_name },
      include: {
        role: {
          include: {
            role_permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            role_permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // internal use only - no response formatting or error handling here
  // for reducing db payload size
  async checkExistsByUsername(user_name: string) {
    return this.prisma.user.findUnique({
      where: { user_name },
      select: { id: true },
    });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.checkExistsByUsername(dto.user_name);

    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
      select: this.selectUser,
    });
  }

  // admin: find all STAFF users in their hospital
  async findStaffByHospital(hospitalId: string, dto: PaginationDto) {
    const { page, limit, search } = dto;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.UserWhereInput = {
      hospital_id: hospitalId,
      role: { name: 'STAFF' },
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { user_name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: this.selectUser,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      message: 'Staff users fetched successfully',
      data: paginatedResult(data, total, page, limit),
    };
  }

  // used by controller — always scoped to a hospital
  async findAllPatients(dto: PaginationDto, hospitalId: string) {
    const { page, limit, search } = dto;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.UserWhereInput = {
      hospital_id: hospitalId,
      role: { name: 'USER' },
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { user_name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: this.selectUser,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      message: 'Users fetched successfully',
      data: paginatedResult(data, total, page, limit),
    };
  }

  async findOne(id: string) {
    const user = await this.findById(id);

    return {
      message: 'User fetched successfully',
      data: user,
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id); // throws if not found

    const updateData: any = { ...dto };

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: this.selectUser,
    });

    return {
      message: 'User updated successfully',
      data: user,
    };
  }

  async toggleActive(id: string) {
    const user = await this.findById(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { is_active: !user.is_active },
      select: this.selectUser,
    });

    return {
      message: `User ${updated.is_active ? 'activated' : 'deactivated'} successfully`,
      data: updated,
    };
  }

  async remove(id: string) {
    await this.findById(id); // throws if not found

    await this.prisma.user.delete({ where: { id } });

    return {
      message: 'User deleted successfully',
      data: null,
    };
  }
}
