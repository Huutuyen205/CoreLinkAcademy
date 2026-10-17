import { Module } from '@nestjs/common';
import { SmartCurriculumService } from './smart-curriculum.service';
import { SmartCurriculumController } from './smart-curriculum.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SmartCurriculumController],
  providers: [SmartCurriculumService],
  exports: [SmartCurriculumService],
})
export class SmartCurriculumModule {}
