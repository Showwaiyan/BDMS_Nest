import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'New username (optional, minimum 3 characters)',
    example: 'jane_doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  user_name?: string;

  @ApiProperty({
    description: 'New email address (optional)',
    example: 'jane@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
