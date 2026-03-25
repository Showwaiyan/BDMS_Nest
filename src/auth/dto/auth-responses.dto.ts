import { ApiProperty } from '@nestjs/swagger';

export class AuthUserLoginResponseDataDto {
  @ApiProperty({ example: 'uuid-user-id' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  user_name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'ADMIN' })
  role: string;

  @ApiProperty({
    example: 'uuid-hospital-id',
    nullable: true,
  })
  hospital_id?: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J...',
  })
  access_token: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J...',
  })
  refresh_token: string;
}

export class AuthRegisterResponseDataDto {
  @ApiProperty({ example: 'uuid-user-id' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  user_name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'USER' })
  role: string;

  @ApiProperty({ example: false })
  is_active: boolean;

  @ApiProperty({
    example: 'uuid-hospital-id',
    nullable: true,
  })
  hospital_id?: string;
}

export class AuthTokenResponseDataDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J...',
  })
  access_token: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J...',
  })
  refresh_token: string;
}

export class AuthUserProfileResponseDataDto {
  @ApiProperty({ example: 'uuid-user-id' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  user_name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'ADMIN' })
  role: string;

  @ApiProperty({
    example: [
      'user.access',
      'user.view',
      'user.update',
      'role.update',
      'user.delete',
    ],
  })
  permissions: string[];

  @ApiProperty({
    example: 'uuid-hospital-id',
    nullable: true,
  })
  hospital_id?: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;
}
