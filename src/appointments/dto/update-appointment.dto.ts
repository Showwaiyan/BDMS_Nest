import { IsOptional, IsDateString, IsString, Matches } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  appointment_date?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, {
    message: 'appointment_time must be in HH:MM format',
  })
  appointment_time?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
