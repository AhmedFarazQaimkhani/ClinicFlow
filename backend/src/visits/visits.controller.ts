import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { VisitsService } from './visits.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { UpdateVisitDto } from './dto/visit.dto';

@ApiTags('visits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visits')
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Get('doctor-today')
  @Roles(UserRole.DOCTOR, UserRole.OWNER)
  doctorToday(@CurrentUser() user: AuthUser, @Query('doctorId') doctorId?: string) {
    return this.visits.doctorToday(user, doctorId ?? '');
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.visits.findOne(user.clinicId, id);
  }

  @Post(':id/start')
  @Roles(UserRole.DOCTOR, UserRole.OWNER)
  start(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.visits.start(user, id);
  }

  @Patch(':id')
  @Roles(UserRole.DOCTOR, UserRole.OWNER)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateVisitDto,
  ) {
    return this.visits.update(user, id, dto);
  }
}
