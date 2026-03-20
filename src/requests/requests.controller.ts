import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { RequestsQueryDto } from './dto/query/requests.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decortor';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestedUser } from '../common/interfaces/requested-user.interface';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@ApiTags('requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new blood request',
    description:
      'Allows a registered hospital user to submit a new blood request.',
  })
  @Permissions('request.create')
  requestBlood(
    @CurrentUser() user: RequestedUser,
    @Body() createRequestDto: CreateRequestDto,
  ) {
    if (!user.hospital_id) {
      throw new ForbiddenException('You are not assigned to any hospital');
    }
    return this.requestsService.requestBlood(user, createRequestDto);
  }

  @Get('my-requests')
  @ApiOperation({
    summary: 'Get user specific blood requests',
    description:
      'A registered hospital user can get user specific blood requests using this endpoint.',
  })
  @Permissions('request.view')
  findMyRequests(
    @CurrentUser() user: RequestedUser,
    @Query() query: RequestsQueryDto,
  ) {
    return this.requestsService.findMyRequests(user.id, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a blood request by ID',
    description:
      'Get a specific blood request by its ID. Requires request.view permission.',
  })
  @Permissions('request.view')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestedUser,
  ) {
    if (!user.hospital_id) {
      throw new ForbiddenException('You are not assigned to any hospital');
    }
    return this.requestsService.findOne(
      id,
      user.id,
      user.hospital_id,
      user.role,
    );
  }

  // Accept or Reject blood request
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Patch(':id')
  @ApiOperation({
    summary: 'Update blood request status (Admin & Staff only)',
    description:
      'Admin or Staff can accept or reject a blood request using this endpoint.',
  })
  @Permissions('request.update')
  updateStatus(
    @CurrentUser() user: RequestedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRequestStatusDto: UpdateRequestStatusDto,
  ) {
    return this.requestsService.updateStatus(
      id,
      user.id,
      updateRequestStatusDto,
      user.hospital_id,
    );
  }

  // Approve a pending blood request
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve a pending blood request (Admin & Staff only)',
    description:
      'Admin or Staff can approve a pending blood request using this endpoint.',
  })
  @Permissions('request.update')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestedUser,
  ) {
    return this.requestsService.approveRequest(id, user.id, user.hospital_id);
  }

  // Fulfill an approved blood request
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Patch(':id/fulfill')
  @ApiOperation({
    summary: 'Fulfill an approved blood request (Admin & Staff only)',
    description:
      'Admin or Staff can mark an approved blood request as fulfilled.',
  })
  @Permissions('request.update')
  fulfill(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestedUser,
  ) {
    return this.requestsService.fulfillRequest(id, user.hospital_id);
  }

  // Cancel a pending blood request (user cancels own request)
  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel a pending blood request',
    description:
      'A user can cancel their own pending blood request using this endpoint.',
  })
  @Permissions('request.update')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestedUser,
  ) {
    return this.requestsService.cancelRequest(id, user.id, user.hospital_id);
  }

  @UseGuards(RolesGuard)
  @Permissions('request.access')
  @Roles('ADMIN', 'STAFF')
  @Get()
  @ApiOperation({
    summary: 'Get all blood requests (Admin & Staff only)',
    description:
      'Admin or Staff can get all blood requests using this endpoint.',
  })
  findAll(
    @Query() query: RequestsQueryDto,
    @CurrentUser() user: RequestedUser,
  ) {
    if (!user.hospital_id) {
      throw new ForbiddenException('You are not assigned to any hospital');
    }
    return this.requestsService.findAll(query, user.hospital_id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a blood request (Admin only)',
    description: 'Admin can delete a blood request using this endpoint.',
  })
  @Permissions('request.delete')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestedUser,
  ) {
    return this.requestsService.remove(id, user.hospital_id);
  }
}
