import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
  })
  @IsNotEmpty()
  @IsString()
  user_name: string;

  @ApiProperty({
    description: 'Password',
    example: 'password123',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
