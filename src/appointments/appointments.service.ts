import dayjs from 'dayjs';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentStatus, Prisma } from '@prisma/client';
import * as requestedUserInterface from '../common/interfaces/requested-user.interface';

@Injectable()
export class AppointmentsService {
  constructor(private database: DatabaseService) {}

  private validateFutureDateTime(date: string, time: string): boolean {
    const appointmentDateTime = dayjs(`${date}T${time}:00`);
    return appointmentDateTime.isAfter(dayjs());
  }

  private async getUserIdFromBloodRequest(requestId: string): Promise<string> {
    const request = await this.database.bloodRequest.findUnique({
      where: { id: requestId },
      select: { user_id: true },
    });
    if (!request) {
      throw new NotFoundException(
        `Blood request with id ${requestId} not found`,
      );
    }
    return request.user_id;
  }

  private async handleBloodInventoryTx(
    tx: Prisma.TransactionClient,
    bloodRequestId: string,
  ): Promise<string> {
    const bloodRequest = await tx.bloodRequest.findUnique({
      where: { id: bloodRequestId },
      select: {
        blood_group: true,
        units_required: true,
        hospital_id: true,
      },
    });

    if (!bloodRequest) {
      throw new NotFoundException(
        `Blood request with id ${bloodRequestId} not found`,
      );
    }

    const inventory = await tx.bloodInventory.findFirst({
      where: {
        hospital_id: bloodRequest.hospital_id,
        blood_group: bloodRequest.blood_group,
        status: 'available',
        deleted_at: null,
        expired_at: { gt: new Date() },
      },
      orderBy: { expired_at: 'asc' },
    });

    if (!inventory) {
      throw new BadRequestException(
        `No available blood inventory found for blood group ${bloodRequest.blood_group}`,
      );
    }

    return inventory.id;
  }

  async create(dto: CreateAppointmentDto) {
    const userIdFromRecord = await this.getUserIdFromBloodRequest(
      dto.blood_request_id,
    );

    if (
      !this.validateFutureDateTime(dto.appointment_date, dto.appointment_time)
    ) {
      throw new BadRequestException(
        'Appointment date and time must be in the future',
      );
    }

    const appointment = await this.database.$transaction(async (tx) => {
      const inventoryId = await this.handleBloodInventoryTx(
        tx,
        dto.blood_request_id,
      );

      await tx.bloodInventory.update({
        where: { id: inventoryId },
        data: {
          status: 'used',
          blood_request_id: dto.blood_request_id,
        },
      });

      await tx.bloodRequest.update({
        where: { id: dto.blood_request_id },
        data: { status: 'fulfilled' },
      });

      return tx.appointment.create({
        data: {
          user_id: userIdFromRecord,
          hospital_id: dto.hospital_id,
          blood_request_id: dto.blood_request_id,
          appointment_date: dayjs(dto.appointment_date).toDate(),
          appointment_time: dayjs(
            `${dto.appointment_date}T${dto.appointment_time}:00`,
          ).toDate(),
          remarks: dto.remarks,
          status: 'scheduled',
        },
      });
    });

    return {
      message: 'Appointment created successfully',
      data: appointment,
    };
  }

  async findAppointments(query: QueryAppointmentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { hospital_id, status, from_date, to_date } = query;

    const where: {
      deleted_at: null;
      hospital_id?: string;
      status?: AppointmentStatus;
      appointment_date?: { gte?: Date; lte?: Date };
    } = { deleted_at: null };

    if (hospital_id) where.hospital_id = hospital_id;
    if (status) where.status = status;

    if (from_date || to_date) {
      where.appointment_date = {};
      if (from_date) where.appointment_date.gte = dayjs(from_date).toDate();
      if (to_date) where.appointment_date.lte = dayjs(to_date).toDate();
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [appointments, total] = await Promise.all([
      this.database.appointment.findMany({
        where,
        skip,
        take,
        orderBy: { appointment_date: 'asc' },
      }),
      this.database.appointment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Appointments retrieved successfully',
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findMyAppointments(userId: string, query: QueryAppointmentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = {
      deleted_at: null,
      user_id: userId,
    };

    const skip = (page - 1) * limit;
    const take = limit;

    const [appointments, total] = await Promise.all([
      this.database.appointment.findMany({
        where,
        skip,
        take,
        orderBy: { appointment_date: 'asc' },
      }),
      this.database.appointment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Appointments retrieved successfully',
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(user: requestedUserInterface.RequestedUser, id: string) {
    const appointment = await this.database.appointment.findUnique({
      where: { id, deleted_at: null },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with id ${id} not found`);
    }

    const isAdminOrStaff = user.role === 'ADMIN' || user.role === 'STAFF';
    const isOwner = appointment.user_id === user.id;

    if (!isAdminOrStaff && !isOwner) {
      throw new ForbiddenException(
        'You do not have permission to view this appointment',
      );
    }

    return {
      message: 'Appointment retrieved successfully',
      data: appointment,
    };
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.database.appointment.findUnique({
      where: { id, deleted_at: null },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with id ${id} not found`);
    }

    const dateToValidate =
      dto.appointment_date ||
      dayjs(appointment.appointment_date).format('YYYY-MM-DD');
    const timeToValidate =
      dto.appointment_time ||
      dayjs(appointment.appointment_time).format('HH:mm');

    if (
      (dto.appointment_date || dto.appointment_time) &&
      !this.validateFutureDateTime(dateToValidate, timeToValidate)
    ) {
      throw new BadRequestException(
        'Appointment date and time must be in the future',
      );
    }

    const updated = await this.database.appointment.update({
      where: { id },
      data: {
        appointment_date: dto.appointment_date
          ? dayjs(dto.appointment_date).toDate()
          : undefined,
        appointment_time: dto.appointment_time
          ? dayjs(
              `${
                dto.appointment_date ||
                dayjs(appointment.appointment_date).format('YYYY-MM-DD')
              }T${dto.appointment_time}:00`,
            ).toDate()
          : undefined,
        remarks: dto.remarks,
      },
    });

    return {
      message: 'Appointment updated successfully',
      data: updated,
    };
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto) {
    const appointment = await this.database.appointment.findUnique({
      where: { id, deleted_at: null },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with id ${id} not found`);
    }

    const updated = await this.database.appointment.update({
      where: { id },
      data: { status: dto.status },
    });

    return {
      message: 'Appointment status updated successfully',
      data: updated,
    };
  }

  async confirmAppointment(id: string) {
    const appointment = await this.database.appointment.findUnique({
      where: { id, deleted_at: null },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with id ${id} not found`);
    }

    if (appointment.status !== 'scheduled') {
      throw new BadRequestException(
        'Only scheduled appointments can be confirmed',
      );
    }

    const updated = await this.database.appointment.update({
      where: { id },
      data: { status: 'confirmed' },
    });

    return {
      message: 'Appointment confirmed successfully',
      data: updated,
    };
  }

  async cancelAppointment(id: string) {
    const appointment = await this.database.appointment.findUnique({
      where: { id, deleted_at: null },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with id ${id} not found`);
    }

    if (appointment.status === 'cancelled') {
      throw new BadRequestException('Appointment is already cancelled');
    }

    if (appointment.status === 'completed') {
      throw new BadRequestException('Cannot cancel a completed appointment');
    }

    await this.database.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id },
        data: { status: 'cancelled' },
      });

      if (appointment.blood_request_id) {
        await tx.bloodInventory.updateMany({
          where: {
            blood_request_id: appointment.blood_request_id,
            status: 'used',
          },
          data: {
            status: 'available',
            blood_request_id: null,
          },
        });

        await tx.bloodRequest.update({
          where: { id: appointment.blood_request_id },
          data: { status: 'approved' },
        });
      }
    });

    return {
      message: 'Appointment cancelled successfully',
      data: null,
    };
  }

  async completeAppointment(id: string) {
    const appointment = await this.database.appointment.findUnique({
      where: { id, deleted_at: null },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with id ${id} not found`);
    }

    if (appointment.status === 'completed') {
      throw new BadRequestException('Appointment is already completed');
    }

    if (appointment.status === 'cancelled') {
      throw new BadRequestException('Cannot complete a cancelled appointment');
    }

    const updated = await this.database.appointment.update({
      where: { id },
      data: { status: 'completed' },
    });

    return {
      message: 'Appointment completed successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    const appointment = await this.database.appointment.findUnique({
      where: { id, deleted_at: null },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with id ${id} not found`);
    }

    await this.database.appointment.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return {
      message: 'Appointment deleted successfully',
      data: null,
    };
  }
}
