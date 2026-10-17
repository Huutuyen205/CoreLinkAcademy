import { Module } from '@nestjs/common';
import { CompetencyService } from './competency.service';
import { CompetencyController } from './competency.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CompetencyController],
  providers: [CompetencyService],
  exports: [CompetencyService],
})
export class CompetencyModule {}
