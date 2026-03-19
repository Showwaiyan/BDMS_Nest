import {
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsString,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsUUID()
  blood_request_id: string;

  @IsNotEmpty()
  @IsUUID()
  hospital_id: string;

  @IsNotEmpty()
  @IsDateString()
  appointment_date: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, {
    message: 'appointment_time must be in HH:MM format',
  })
  appointment_time: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
