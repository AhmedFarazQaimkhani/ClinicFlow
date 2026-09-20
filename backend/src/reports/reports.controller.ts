import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('daily')
  daily(@CurrentUser() user: AuthUser) {
    return this.reports.daily(user.clinicId);
  }

  @Get('monthly')
  monthly(
    @CurrentUser() user: AuthUser,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const now = new Date();
    return this.reports.monthly(
      user.clinicId,
      Number(year) || now.getUTCFullYear(),
      Number(month) || now.getUTCMonth() + 1,
    );
  }

  @Get('medicines')
  medicines(@CurrentUser() user: AuthUser) {
    return this.reports.medicines(user.clinicId);
  }

  @Get('owner-today')
  @Roles(UserRole.OWNER)
  ownerToday(@CurrentUser() user: AuthUser) {
    return this.reports.ownerToday(user.clinicId);
  }
}
