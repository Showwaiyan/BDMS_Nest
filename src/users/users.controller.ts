import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decortor';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import {
  UserProfileResponseDto,
  UserStatsResponseDto,
  UserStatsByRoleResponseDto,
  PaginatedUsersResponseDto,
} from './dto/user-responses.dto';
import * as requestedUserInterface from '../common/interfaces/requested-user.interface';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth('access-token')
@ApiExtraModels(
  ApiResponseDto,
  UserProfileResponseDto,
  UserStatsResponseDto,
  UserStatsByRoleResponseDto,
  PaginatedUsersResponseDto,
)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      properties: {
        success: { example: true },
        statusCode: { example: 200 },
        message: { example: 'Request successful' },
        data: { $ref: getSchemaPath(PaginatedUsersResponseDto) },
        timestamp: { example: '2026-03-22T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user not assigned to hospital',
  })
  @Permissions('user.access')
  @Get()
  findAll(
    @CurrentUser() user: requestedUserInterface.RequestedUser,
    @Query() dto: PaginationDto,
  ) {
    if (!user.hospital_id) {
      throw new ForbiddenException('You are not assigned to any hospital');
    }
    return this.usersService.findAllPatients(dto, user.hospital_id);
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      properties: {
        success: { example: true },
        statusCode: { example: 200 },
        message: { example: 'Request successful' },
        data: { $ref: getSchemaPath(UserProfileResponseDto) },
        timestamp: { example: '2026-03-22T10:30:00.000Z' },
      },
    },
  })
  @Get('me')
  getMe(@CurrentUser() user: requestedUserInterface.RequestedUser) {
    return this.usersService.getMe(user.id);
  }

  @ApiOperation({ summary: 'Get user statistics summary (ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'Statistics summary retrieved successfully',
    schema: {
      properties: {
        success: { example: true },
        statusCode: { example: 200 },
        message: { example: 'Request successful' },
        data: { $ref: getSchemaPath(UserStatsResponseDto) },
        timestamp: { example: '2026-03-22T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('stats/summary')
  getStatsSummary(@CurrentUser() user: requestedUserInterface.RequestedUser) {
    if (!user.hospital_id) {
      throw new ForbiddenException('You are not assigned to any hospital');
    }
    return this.usersService.getStatsSummary(user.hospital_id);
  }

  @ApiOperation({ summary: 'Get user statistics by role (ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'Statistics by role retrieved successfully',
    schema: {
      properties: {
        success: { example: true },
        statusCode: { example: 200 },
        message: { example: 'Request successful' },
        data: { $ref: getSchemaPath(UserStatsByRoleResponseDto) },
        timestamp: { example: '2026-03-22T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('stats/by-role')
  getStatsByRole(@CurrentUser() user: requestedUserInterface.RequestedUser) {
    if (!user.hospital_id) {
      throw new ForbiddenException('You are not assigned to any hospital');
    }
    return this.usersService.getStatsByRole(user.hospital_id);
  }

  @ApiOperation({ summary: 'Get all staff members (ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'Staff members retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Permissions('user.access')
  @Get('staff')
  findStaff(
    @CurrentUser() user: requestedUserInterface.RequestedUser,
    @Query() dto: PaginationDto,
  ) {
    if (!user.hospital_id) {
      throw new ForbiddenException('You are not assigned to any hospital');
    }
    return this.usersService.findStaffByHospital(user.hospital_id, dto);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires user.view permission',
  })
  @UseGuards(RolesGuard)
  @Roles('ADMIN, STAFF')
  @Permissions('user.view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires user.update permission',
  })
  @Permissions('user.update')
  @Patch('me')
  updateMe(
    @CurrentUser() user: requestedUserInterface.RequestedUser,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, dto);
  }

  @ApiOperation({ summary: 'Update user role (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires role.update permission',
  })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Permissions('role.update')
  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateUserRole(id, dto.role);
  }

  @ApiOperation({ summary: 'Toggle user active status (ADMIN/STAFF)' })
  @ApiResponse({
    status: 200,
    description: 'User active status toggled successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires user.update permission',
  })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Permissions('user.update')
  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  @ApiOperation({ summary: 'Delete user (soft delete, ADMIN only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires user.delete permission',
  })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Permissions('user.delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
