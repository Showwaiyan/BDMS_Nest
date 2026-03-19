import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { AppointmentStatus } from 'prisma/generated/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryAppointmentDto extends PaginationDto {
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
