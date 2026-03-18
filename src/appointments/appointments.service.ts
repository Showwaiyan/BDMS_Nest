import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateAppointmentDto,
  AppointmentType,
} from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

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

  findAll() {
    return `This action returns all appointments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} appointment`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    return `This action updates a #${id} appointment`;
  }

  remove(id: number) {
    return `This action removes a #${id} appointment`;
  }
}
