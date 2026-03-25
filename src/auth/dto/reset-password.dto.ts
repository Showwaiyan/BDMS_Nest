import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'your-reset-token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'new_password_123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
