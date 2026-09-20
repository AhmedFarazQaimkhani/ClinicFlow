import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { MedicinesService } from './medicines.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { UpsertMedicineDto } from './dto/medicine.dto';

@ApiTags('medicines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medicines')
export class MedicinesController {
  constructor(private readonly medicines: MedicinesService) {}

  @Get()
  search(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    return this.medicines.search(user.clinicId, q);
  }

  @Get('all')
  @Roles(UserRole.OWNER, UserRole.DISPENSER, UserRole.RECEPTIONIST, UserRole.DOCTOR)
  listAll(@CurrentUser() user: AuthUser) {
    return this.medicines.listAll(user.clinicId);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.RECEPTIONIST, UserRole.DISPENSER, UserRole.DOCTOR)
  create(@CurrentUser() user: AuthUser, @Body() dto: UpsertMedicineDto) {
    return this.medicines.create(user, dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.RECEPTIONIST, UserRole.DISPENSER, UserRole.DOCTOR)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpsertMedicineDto,
  ) {
    return this.medicines.update(user, id, dto);
  }

  @Get('favorites/:doctorId')
  favorites(@CurrentUser() user: AuthUser, @Param('doctorId') doctorId: string) {
    return this.medicines.favorites(user.clinicId, doctorId);
  }

  @Post('favorites/:doctorId/:medicineId')
  addFavorite(
    @CurrentUser() user: AuthUser,
    @Param('doctorId') doctorId: string,
    @Param('medicineId') medicineId: string,
  ) {
    return this.medicines.addFavorite(user, doctorId, medicineId);
  }

  @Delete('favorites/:doctorId/:medicineId')
  removeFavorite(
    @CurrentUser() user: AuthUser,
    @Param('doctorId') doctorId: string,
    @Param('medicineId') medicineId: string,
  ) {
    return this.medicines.removeFavorite(user.clinicId, doctorId, medicineId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.RECEPTIONIST, UserRole.DISPENSER, UserRole.DOCTOR)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.medicines.remove(user, id);
  }
}
