import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
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

export class UserStatsResponseDto {
  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    example: {
      ADMIN: 2,
      STAFF: 10,
      USER: 33,
    },
  })
  by_role: Record<string, number>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    example: {
      active: 40,
      inactive: 5,
    },
  })
  by_status: Record<string, number>;
}

export class UserStatsByRoleResponseDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        role: { example: 'ADMIN' },
        active: { example: 2 },
        inactive: { example: 0 },
        total: { example: 2 },
      },
    },
  })
  roles: Array<{
    role: string;
    active: number;
    inactive: number;
    total: number;
  }>;
}

export class UserListItemDto {
  @ApiProperty({ example: 'uuid-user-id' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  user_name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'ADMIN' })
  role: string;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({
    example: 'uuid-hospital-id',
    nullable: true,
  })
  hospital_id?: string;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({
    type: 'array',
    items: { $ref: '#/components/schemas/UserListItemDto' },
  })
  data: UserListItemDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}
