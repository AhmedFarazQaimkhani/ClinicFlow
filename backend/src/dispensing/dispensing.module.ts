import { Module } from '@nestjs/common';
import { DispensingService } from './dispensing.service';
import { DispensingController } from './dispensing.controller';

@Module({
  controllers: [DispensingController],
  providers: [DispensingService],
  exports: [DispensingService],
})
export class DispensingModule {}
