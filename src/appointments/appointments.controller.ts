import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decortor';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import * as requestedUserInterface from '../common/interfaces/requested-user.interface';

@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles('ADMIN', 'STAFF')
  @Permissions('appointment.create')
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @Permissions('appointment.access')
  findAll(@Query() query: QueryAppointmentDto) {
    return this.appointmentsService.findAppointments(query);
  }

  @Get('my')
  @Permissions('appointment.view')
  findMyAppointments(
    @CurrentUser() user: requestedUserInterface.RequestedUser,
    @Query() query: QueryAppointmentDto,
  ) {
    return this.appointmentsService.findMyAppointments(user.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: requestedUserInterface.RequestedUser,
    @Param('id') id: string,
  ) {
    return this.appointmentsService.findOne(user, id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'STAFF')
  @Permissions('appointment.update')
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Patch(':id/confirm')
  @Roles('ADMIN', 'STAFF')
  @Permissions('appointment.update')
  confirm(@Param('id') id: string) {
    return this.appointmentsService.confirmAppointment(id);
  }

  @Patch(':id/cancel')
  @Roles('ADMIN', 'STAFF')
  @Permissions('appointment.update')
  cancel(@Param('id') id: string) {
    return this.appointmentsService.cancelAppointment(id);
  }

  @Patch(':id/complete')
  @Roles('ADMIN', 'STAFF')
  @Permissions('appointment.update')
  complete(@Param('id') id: string) {
    return this.appointmentsService.completeAppointment(id);
  }

  @Delete(':id')
  @Roles('ADMIN', 'STAFF')
  @Permissions('appointment.delete')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
