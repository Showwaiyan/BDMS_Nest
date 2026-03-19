import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateAppointmentDto,
  AppointmentType,
} from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentStatus } from 'prisma/generated/client';

@Injectable()
export class AppointmentsService {
  constructor(private database: DatabaseService) {}

  private validateFutureDateTime(date: string, time: string): boolean {
    const dateTimeStr = `${date}T${time}:00`;
    const appointmentDateTime = new Date(dateTimeStr);
    return appointmentDateTime > new Date();
  }

  private async getUserIdFromDonation(donationId: string): Promise<string> {
    const donation = await this.database.donation.findUnique({
      where: { id: donationId },
      include: { donor: true },
    });
    if (!donation) {
      throw new NotFoundException(`Donation with id ${donationId} not found`);
    }
    return donation.donor.user_id;
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

  private async handleBloodInventory(bloodRequestId: string): Promise<void> {
    const bloodRequest = await this.database.bloodRequest.findUnique({
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

    const inventory = await this.database.bloodInventory.findFirst({
      where: {
        hospital_id: bloodRequest.hospital_id,
        blood_group: bloodRequest.blood_group,
        status: 'available',
        deleted_at: null,
        expired_at: { gt: new Date() },
      },
      orderBy: { expired_at: 'asc' },
    });

    if (inventory) {
      await this.database.bloodInventory.update({
        where: { id: inventory.id },
        data: {
          status: 'used',
          blood_request_id: bloodRequestId,
        },
      });
    }
  }

  private async updateBloodRequestStatus(
    bloodRequestId: string,
  ): Promise<void> {
    await this.database.bloodRequest.update({
      where: { id: bloodRequestId },
      data: { status: 'fulfilled' },
    });
  }

  async create(userId: string, dto: CreateAppointmentDto) {
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

    await this.handleBloodInventory(dto.blood_request_id);
    await this.updateBloodRequestStatus(dto.blood_request_id);

    const appointment = await this.database.appointment.create({
      data: {
        user_id: userIdFromRecord,
        hospital_id: dto.hospital_id,
        blood_request_id: dto.blood_request_id,
        appointment_date: new Date(dto.appointment_date),
        appointment_time: new Date(
          `${dto.appointment_date}T${dto.appointment_time}:00`,
        ),
        remarks: dto.remarks,
        status: 'scheduled',
      },
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
      if (from_date) where.appointment_date.gte = new Date(from_date);
      if (to_date) where.appointment_date.lte = new Date(to_date);
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

  async findOne(id: string) {
    const appointment = await this.database.appointment.findUnique({
      where: { id, deleted_at: null },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with id ${id} not found`);
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
      appointment.appointment_date.toISOString().split('T')[0];
    const timeToValidate =
      dto.appointment_time ||
      (typeof appointment.appointment_time === 'string'
        ? appointment.appointment_time
        : appointment.appointment_time.toISOString().split('T')[1].slice(0, 5));

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
          ? new Date(dto.appointment_date)
          : undefined,
        appointment_time: dto.appointment_time
          ? new Date(
              `${dto.appointment_date || appointment.appointment_date.toISOString().split('T')[0]}T${dto.appointment_time}:00`,
            )
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
