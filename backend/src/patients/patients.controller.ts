import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { UserRole } from '@prisma/client';

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get()
  search(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    return this.patients.search(user.clinicId, q);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.RECEPTIONIST, UserRole.DISPENSER)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePatientDto) {
    return this.patients.create(user, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.patients.findOne(user.clinicId, id);
  }

  @Get(':id/history')
  history(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.patients.history(user.clinicId, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.RECEPTIONIST)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patients.update(user, id, dto);
  }
}
