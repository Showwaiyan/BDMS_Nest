import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate, paginatedResult } from '../common/helpers/paginate.helper';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '../../prisma/generated/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async findRoleByName(name: string) {
    return this.usersRepo.findRoleByName(name);
  }

  async findByUsername(user_name: string, hospital_id: string) {
    return this.usersRepo.findByUsername(user_name, hospital_id);
  }

  async findByProviderId(provider_id: string, hospital_id: string) {
    return this.usersRepo.findByProviderId(provider_id, hospital_id);
  }

  async findByEmailInternal(email: string, hospital_id: string) {
    return this.usersRepo.findByEmailInternal(email, hospital_id);
  }

  async linkProvider(id: string, provider: string, provider_id: string) {
    return this.usersRepo.linkProvider(id, provider, provider_id);
  }

  async createOAuthUser(data: {
    email: string;
    user_name: string;
    provider: string;
    provider_id: string;
    role_id: string;
    hospital_id: string;
  }) {
    return this.usersRepo.create({
      email: data.email,
      user_name: data.user_name,
      provider: data.provider,
      provider_id: data.provider_id,
      role_id: data.role_id,
      hospital_id: data.hospital_id,
    });
  }

  async findById(id: string) {
    const user = await this.usersRepo.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // internal use only - no response formatting or error handling here
  // for reducing db payload size
  async checkExistsByUsername(user_name: string, hospital_id: string) {
    return this.usersRepo.checkExistsByUsername(user_name, hospital_id);
  }

  async checkExistsByEmail(email: string, hospital_id: string) {
    return this.usersRepo.checkExistsByEmail(email, hospital_id);
  }

  async create(dto: CreateUserDto) {
    const existing = await this.checkExistsByUsername(
      dto.user_name,
      dto.hospital_id,
    );

    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const existingEmail = await this.checkExistsByEmail(
      dto.email,
      dto.hospital_id,
    );
    if (existingEmail) {
      throw new ConflictException('Email already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.usersRepo.create({
      ...dto,
      password: hashedPassword,
    });
  }

  // always scoped to a hospital
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
      this.usersRepo.findManyByCriteria(where, skip, take),
      this.usersRepo.count(where),
    ]);

    return {
      message: 'Staff users fetched successfully',
      data: paginatedResult(data, total, page, limit),
    };
  }

  // always scoped to a hospital
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
      this.usersRepo.findManyByCriteria(where, skip, take),
      this.usersRepo.count(where),
    ]);

    return {
      message: 'Users fetched successfully',
      data: paginatedResult(data, total, page, limit),
    };
  }

  async getMe(id: string) {
    const user = await this.usersRepo.findMeProfile(id);

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      message: 'Your profile fetched successfully',
      data: user,
    };
  }

  async findOne(id: string) {
    const user = await this.usersRepo.findProfileById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User fetched successfully',
      data: user,
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findById(id);

    if (!dto.email && !dto.user_name) {
      throw new BadRequestException('At least one field must be provided');
    }

    if (dto.user_name && dto.user_name !== user.user_name) {
      const existing = await this.usersRepo.checkExistsByUsername(
        dto.user_name,
        user.hospital_id,
        id,
      );
      if (existing) {
        throw new ConflictException('Username already taken');
      }
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepo.checkExistsByEmail(
        dto.email,
        user.hospital_id,
        id,
      );
      if (existing) {
        throw new ConflictException('Email already taken');
      }
    }

    const updateData: Prisma.UserUncheckedUpdateInput = {};

    if (dto.user_name) {
      updateData.user_name = dto.user_name;
    }

    if (dto.email) {
      updateData.email = dto.email;
    }

    const updatedUser = await this.usersRepo.updateById(id, updateData);

    return {
      message: 'User updated successfully',
      data: updatedUser,
    };
  }

  async updateById(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return this.usersRepo.updateById(id, data);
  }

  async updateUserRole(id: string, role: 'USER' | 'STAFF' | 'ADMIN') {
    await this.findById(id); // throws if not found
    const roleRecord = await this.usersRepo.findRoleByName(role);

    if (!roleRecord) {
      throw new NotFoundException('Role not found');
    }

    const user = await this.usersRepo.updateById(id, {
      role_id: roleRecord.id,
    });

    return {
      message: 'User role updated successfully',
      data: user,
    };
  }

  async updatePassword(id: string, hashedPassword: string) {
    await this.findById(id); // throws if not found

    await this.usersRepo.updatePassword(id, hashedPassword);
  }

  async toggleActive(id: string) {
    const user = await this.findById(id);

    const updated = await this.usersRepo.updateById(id, {
      is_active: !user.is_active,
    });

    return {
      message: `User ${updated.is_active ? 'activated' : 'deactivated'} successfully`,
      data: updated,
    };
  }

  async remove(id: string) {
    await this.findById(id); // throws if not found

    await this.usersRepo.softDelete(id);

    return {
      message: 'User deleted successfully',
      data: null,
    };
  }

  async getStatsSummary(hospitalId: string) {
    const stats = await this.usersRepo.getStatsSummary(hospitalId);

    return {
      message: 'User statistics fetched successfully',
      data: stats,
    };
  }

  async getStatsByRole(hospitalId: string) {
    const stats = await this.usersRepo.getStatsByRole(hospitalId);

    return {
      message: 'Statistics by role fetched successfully',
      data: stats,
    };
  }
}
