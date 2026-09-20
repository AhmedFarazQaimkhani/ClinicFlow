import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { DispensingService } from './dispensing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CompleteDispensingDto,
  RepeatMedicineDto,
  ReviewRepeatDto,
} from './dto/dispensing.dto';

@ApiTags('dispensing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dispensing')
export class DispensingController {
  constructor(private readonly dispensing: DispensingService) {}

  @Get('ready')
  ready(@CurrentUser() user: AuthUser) {
    return this.dispensing.readyQueue(user.clinicId);
  }

  @Get('repeat-requests')
  @Roles(UserRole.DOCTOR, UserRole.OWNER)
  pendingRepeats(@CurrentUser() user: AuthUser) {
    return this.dispensing.pendingRepeats(user.clinicId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.dispensing.findOne(user.clinicId, id);
  }

  @Post(':id/complete')
  complete(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CompleteDispensingDto,
  ) {
    return this.dispensing.complete(user, id, dto);
  }

  @Post('repeat')
  repeat(@CurrentUser() user: AuthUser, @Body() dto: RepeatMedicineDto) {
    return this.dispensing.repeat(user, dto);
  }

  @Post('repeat-requests/:id/review')
  @Roles(UserRole.DOCTOR, UserRole.OWNER)
  review(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewRepeatDto,
  ) {
    return this.dispensing.reviewRepeat(user, id, dto);
  }
}
