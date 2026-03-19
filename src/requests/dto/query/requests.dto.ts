import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import {
  BloodGroup,
  RequestStatus,
  UrgencyLevel,
} from 'prisma/generated/client';

export class RequestsQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: RequestStatus,
    description: 'Filter by request status',
    default: RequestStatus.pending,
  })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({
    enum: UrgencyLevel,
    description: 'Filter by urgency level',
  })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

  @ApiPropertyOptional({
    enum: BloodGroup,
    example: BloodGroup.O_POS,
    description: 'Filter by blood group',
  })
  @IsOptional()
  @IsEnum(BloodGroup)
  blood_group?: BloodGroup;

  @ApiPropertyOptional({
    description: 'Filter by creator user ID',
  })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({
    example: '2026-03-19',
    description: 'Filter required_date from this date',
  })
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiPropertyOptional({
    example: '2026-03-25',
    description: 'Filter required_date to this date',
  })
  @IsOptional()
  @IsDateString()
  to_date?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Include soft-deleted records',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  with_deleted?: boolean = false;
}
