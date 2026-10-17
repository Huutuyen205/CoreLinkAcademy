import { Module } from '@nestjs/common';
import { VideoCurriculumService } from './video-curriculum.service';
import { VideoCurriculumController } from './video-curriculum.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VideoCurriculumController],
  providers: [VideoCurriculumService],
  exports: [VideoCurriculumService],
})
export class VideoCurriculumModule {}
