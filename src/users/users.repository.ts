import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  async findByUsername(user_name: string, hospital_id: string) {
    return this.prisma.user.findFirst({
      where: {
        user_name,
        hospital_id,
        deleted_at: null,
      },
      select: this.selectAuthInternal,
    });
  }

  async findByEmailInternal(email: string, hospital_id: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        hospital_id,
        deleted_at: null,
      },
      select: this.selectAuthInternal,
    });
  }

  async findByProviderId(provider_id: string, hospital_id: string) {
    return this.prisma.user.findFirst({
      where: {
        provider_id,
        hospital_id,
        deleted_at: null,
      },
      select: this.selectAuthInternal,
    });
  }

  async linkProvider(id: string, provider: string, provider_id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { provider, provider_id },
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

  async checkExistsByUsername(
    user_name: string,
    hospital_id: string,
    excludeId?: string,
  ) {
    return this.prisma.user.findFirst({
      where: {
        user_name,
        hospital_id,
        deleted_at: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: this.selectIdOnly,
    });
  }

  async checkExistsByEmail(
    email: string,
    hospital_id: string,
    excludeId?: string,
  ) {
    return this.prisma.user.findFirst({
      where: {
        email,
        hospital_id,
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

  async getStatsSummary(hospitalId: string) {
    const total = await this.prisma.user.count({
      where: { deleted_at: null, hospital_id: hospitalId },
    });

    const byRole = await this.prisma.user.groupBy({
      by: ['role_id'],
      where: { deleted_at: null, hospital_id: hospitalId },
      _count: true,
    });

    const byStatus = await this.prisma.user.groupBy({
      by: ['is_active'],
      where: { deleted_at: null, hospital_id: hospitalId },
      _count: true,
    });

    // Map role IDs to role names
    const roleStats: Record<string, number> = {};
    for (const stat of byRole) {
      const role = await this.prisma.role.findUnique({
        where: { id: stat.role_id },
      });
      if (role) {
        roleStats[role.name] = stat._count;
      }
    }

    const statusStats = {
      active: byStatus.find((s) => s.is_active)?._count || 0,
      inactive: byStatus.find((s) => !s.is_active)?._count || 0,
    };

    return {
      total,
      by_role: roleStats,
      by_status: statusStats,
    };
  }

  async getStatsByRole(hospitalId: string) {
    const stats = await this.prisma.user.groupBy({
      by: ['role_id'],
      where: { deleted_at: null, hospital_id: hospitalId },
      _count: true,
    });

    const result: Record<
      string,
      { count: number; active: number; inactive: number }
    > = {};

    for (const stat of stats) {
      const role = await this.prisma.role.findUnique({
        where: { id: stat.role_id },
      });

      if (role) {
        const activeCount = await this.prisma.user.count({
          where: {
            role_id: stat.role_id,
            is_active: true,
            deleted_at: null,
            hospital_id: hospitalId,
          },
        });

        const inactiveCount = stat._count - activeCount;

        result[role.name] = {
          count: stat._count,
          active: activeCount,
          inactive: inactiveCount,
        };
      }
    }

    return result;
  }
}
