import { IsNotEmpty, IsEnum } from 'class-validator';
import { AppointmentStatus } from 'prisma/generated/client';

export class UpdateAppointmentStatusDto {
  @IsNotEmpty()
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
