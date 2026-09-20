import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenStatus, UserRole } from '@prisma/client';
import { TokensService } from './tokens.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateTokenDto } from './dto/token.dto';
import { IsIn } from 'class-validator';
import { karachiToday } from '../common/utils/domain';

class StatusDto {
  @IsIn(['WAITING', 'CALLED', 'CONSULTING', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
  status!: TokenStatus;
}

@ApiTags('tokens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokens: TokensService) {}

  @Get('by-day')
  byDay(
    @CurrentUser() user: AuthUser,
    @Query('date') date?: string,
    @Query('token') token?: string,
  ) {
    const day =
      date?.trim() ||
      karachiToday().toISOString().slice(0, 10);
    return this.tokens.byDay(user.clinicId, day, token);
  }

  @Get('preview')
  preview(@CurrentUser() user: AuthUser) {
    return this.tokens.preview(user.clinicId);
  }

  @Get('today')
  today(@CurrentUser() user: AuthUser, @Query('doctorId') doctorId?: string) {
    return this.tokens.today(user.clinicId, doctorId);
  }

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.tokens.stats(user.clinicId);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.RECEPTIONIST)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTokenDto) {
    return this.tokens.create(user, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: StatusDto,
  ) {
    return this.tokens.updateStatus(user, id, dto.status);
  }
}
