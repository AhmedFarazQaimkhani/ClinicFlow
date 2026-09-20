import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokensService } from '../tokens/tokens.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('queue')
export class QueueController {
  constructor(private readonly tokens: TokensService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('doctorId') doctorId?: string) {
    return this.tokens.today(user.clinicId, doctorId);
  }
}
