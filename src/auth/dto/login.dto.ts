import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin_hospitalA' })
  @IsNotEmpty()
  @IsString()
  user_name: string;

  @ApiProperty({ example: 'admin123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ example: 'd01f62e0-31b5-4e65-8586-661ddecc8d42' })
  @IsNotEmpty()
  @IsString()
  hospital_id: string;
}
