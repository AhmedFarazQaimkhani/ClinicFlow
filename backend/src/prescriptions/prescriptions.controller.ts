import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { SaveConsultationDto } from './dto/prescription.dto';

@ApiTags('prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService) {}

  @Get('latest')
  latest(@CurrentUser() user: AuthUser, @Query('patientId') patientId: string) {
    return this.prescriptions.latestForPatient(user.clinicId, patientId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.prescriptions.findOne(user.clinicId, id);
  }

  @Post('visits/:visitId/send')
  @Roles(UserRole.DOCTOR, UserRole.OWNER)
  saveAndSend(
    @CurrentUser() user: AuthUser,
    @Param('visitId') visitId: string,
    @Body() dto: SaveConsultationDto,
  ) {
    return this.prescriptions.saveAndSend(user, visitId, dto);
  }
}
