import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { RequestStatus } from 'prisma/generated/client';

export class UpdateRequestStatusDto {
  @ApiProperty({ enum: RequestStatus, example: RequestStatus.approved, description: 'The new status of the request' })
  @IsEnum(RequestStatus)
  @IsNotEmpty()
  status: RequestStatus;
}
