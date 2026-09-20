import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { UpdateDoctorFeeDto } from './dto/doctor.dto';

@ApiTags('doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctors: DoctorsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.doctors.list(user.clinicId);
  }

  @Get('me')
  @Roles(UserRole.DOCTOR, UserRole.OWNER)
  me(@CurrentUser() user: AuthUser) {
    return this.doctors.me(user);
  }

  @Patch('me/fee')
  @Roles(UserRole.DOCTOR, UserRole.OWNER)
  updateMyFee(@CurrentUser() user: AuthUser, @Body() dto: UpdateDoctorFeeDto) {
    return this.doctors.updateMyFee(user, dto);
  }

  @Patch(':id/fee')
  @Roles(UserRole.OWNER)
  updateFee(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDoctorFeeDto,
  ) {
    return this.doctors.updateFee(user, id, dto);
  }
}
