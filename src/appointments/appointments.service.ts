import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateAppointmentDto,
  AppointmentType,
} from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';

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

  create(createAppointmentDto: CreateAppointmentDto) {
    return 'This action adds a new appointment';
  }

  async findAppointments(query: QueryAppointmentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { hospital_id, status, from_date, to_date } = query;

    const where: any = { deleted_at: null };

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

<<<<<<< HEAD
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    return `This action updates a #${id} appointment`;
=======
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
        appointment_time: dto.appointment_time,
        remarks: dto.remarks,
      },
    });

    return {
      message: 'Appointment updated successfully',
      data: updated,
    };
>>>>>>> 9a19064 (feat(appointments): implement findAppointments with pagination, findOne, update, updateStatus, remove)
  }

  async updateStatus(id: string, dto: { status: string }) {
    const appointment = await this.database.appointment.findUnique({
      where: { id, deleted_at: null },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with id ${id} not found`);
    }

    const updated = await this.database.appointment.update({
      where: { id },
      data: { status: dto.status as any },
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
