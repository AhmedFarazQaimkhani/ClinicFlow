import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { TokensController } from './tokens.controller';
import { QueueController } from '../queue/queue.controller';

@Module({
  controllers: [TokensController, QueueController],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
