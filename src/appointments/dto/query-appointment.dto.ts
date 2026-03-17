import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { AppointmentStatus } from 'prisma/generated/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AppointmentType } from './create-appointment.dto';

export class QueryAppointmentDto extends PaginationDto {
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @IsOptional()
  @IsUUID()
  hospital_id?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsDateString()
  from_date?: string;

  @IsOptional()
  @IsDateString()
  to_date?: string;
}
