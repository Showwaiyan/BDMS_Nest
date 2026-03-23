import {
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BloodGroup, UrgencyLevel } from 'prisma/generated/client';

import { IsFutureDate } from 'src/common/decorators/is-future-date.decorator';

export class CreateRequestDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the patient needing blood',
  })
  @IsString()
  @IsNotEmpty()
  patient_name: string;

  @ApiProperty({
    enum: BloodGroup,
    example: BloodGroup.O_POS,
    description: 'Required blood group',
  })
  @IsEnum(BloodGroup)
  @IsNotEmpty()
  blood_group: BloodGroup;

  @ApiProperty({ example: 2, description: 'Number of blood units required' })
  @IsInt()
  @Min(1)
  @Max(50)
  @IsNotEmpty()
  units_required: number;

  @ApiProperty({ example: '+1234567890', description: 'Contact phone number' })
  @IsString()
  @IsNotEmpty()
  contact_phone: string;

  @ApiProperty({
    enum: UrgencyLevel,
    example: UrgencyLevel.high,
    description: 'Urgency level of the request',
  })
  @IsEnum(UrgencyLevel)
  @IsNotEmpty()
  urgency: UrgencyLevel;

  @ApiProperty({
    example: '2026-03-20T10:00:00Z',
    description: 'Date by which the blood is required',
  })
  @IsDateString()
  @IsFutureDate()
  @IsNotEmpty()
  required_date: string; // or Date

  @ApiProperty({
    example: 'Surgery requirement',
    description: 'Reason for the blood request',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
