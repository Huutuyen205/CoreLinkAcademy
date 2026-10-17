import { Module } from '@nestjs/common';
import { AiGradingService } from './ai-grading.service';
import { AiGradingController } from './ai-grading.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiGradingController],
  providers: [AiGradingService],
  exports: [AiGradingService],
})
export class AiGradingModule {}
