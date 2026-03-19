import { Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/client';
import { DatabaseService } from '../database/database.service';
import {
  USER_ID_ONLY_SELECT,
  USER_BASIC_SELECT,
  USER_ME_PROFILE_SELECT,
  USER_AUTH_INTERNAL_SELECT,
} from './selects/user.select';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: DatabaseService) {}

  // Lean selects
  private readonly selectIdOnly = USER_ID_ONLY_SELECT;

  // API response selects
  private readonly selectBasic = USER_BASIC_SELECT;
  private readonly selectMeProfile = USER_ME_PROFILE_SELECT;

  // Internal selects
  private readonly selectAuthInternal = USER_AUTH_INTERNAL_SELECT;

  async findRoleByName(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async findByUsername(user_name: string) {
    return this.prisma.user.findFirst({
      where: {
        user_name,
        deleted_at: null,
      },
      select: this.selectAuthInternal,
    });
  }

  async findById(id: string) {
    return this.prisma.user.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: this.selectAuthInternal,
    });
  }

  async findProfileById(id: string) {
    return this.prisma.user.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: this.selectBasic,
    });
  }

  async findMeProfile(id: string) {
    return this.prisma.user.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: this.selectMeProfile,
    });
  }

  async checkExistsByUsername(user_name: string, excludeId?: string) {
    return this.prisma.user.findFirst({
      where: {
        user_name,
        deleted_at: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: this.selectIdOnly,
    });
  }

  async checkExistsByEmail(email: string, excludeId?: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        deleted_at: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: this.selectIdOnly,
    });
  }

  async create(data: Prisma.UserUncheckedCreateInput) {
    return this.prisma.user.create({
      data,
      select: this.selectBasic,
    });
  }

  async findManyByCriteria(
    where: Prisma.UserWhereInput,
    skip: number,
    take: number,
  ) {
    return this.prisma.user.findMany({
      where: {
        ...where,
        deleted_at: null,
      },
      select: this.selectBasic,
      skip,
      take,
      orderBy: { created_at: 'desc' },
    });
  }

  async count(where: Prisma.UserWhereInput) {
    return this.prisma.user.count({
      where: {
        ...where,
        deleted_at: null,
      },
    });
  }

  async updateById(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: this.selectBasic,
    });
  }

  async updatePassword(id: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deleted_at: new Date() },
      select: this.selectIdOnly,
    });
  }
}
