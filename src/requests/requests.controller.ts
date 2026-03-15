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


@ApiTags('requests')
@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new blood request', description: 'Allows a registered hospital user to submit a new blood request.' })
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
  @ApiOperation({ summary: 'Get user specific blood requests', description: 'A registered hospital user can get user specific blood requests using this endpoint.' })
  @Permissions('request.access')
  findMyRequests(
    @CurrentUser() user: RequestedUser,
    @Query() query: RequestsQueryDto,
  ) {
    return this.requestsService.findMyRequests(user.id, query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get a blood request by ID (Admin & Staff only)', description: 'Admin or Staff can get a blood request by ID using this endpoint.' })
  @Permissions('request.access')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.requestsService.findOne(id);
  }

  // Accept or Reject blood request
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Patch(':id')
  @ApiOperation({ summary: 'Update blood request status (Admin & Staff only)', description: 'Admin or Staff can accept or reject a blood request using this endpoint.' })
  @Permissions('request.update')
  updateStatus(
    @CurrentUser() user: RequestedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRequestStatusDto: UpdateRequestStatusDto,
  ) {
    return this.requestsService.updateStatus(id, user.id, updateRequestStatusDto);
  }

  @UseGuards(RolesGuard)
  @Permissions('request.access')
  @Roles('ADMIN', 'STAFF')
  @Get()
  @ApiOperation({ summary: 'Get all blood requests (Admin & Staff only)', description: 'Admin or Staff can get all blood requests using this endpoint.' })
  findAll(@Query() query: RequestsQueryDto) {
    return this.requestsService.findAll(query);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a blood request (Admin only)', description: 'Admin can delete a blood request using this endpoint.' })
  @Permissions('request.delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.requestsService.remove(id);
  }
}
