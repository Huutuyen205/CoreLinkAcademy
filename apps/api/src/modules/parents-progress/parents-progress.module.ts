import { Module } from '@nestjs/common';
import { ParentsProgressController } from './parents-progress.controller';
import { ParentsProgressService } from './parents-progress.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ParentsProgressController],
  providers: [ParentsProgressService],
  exports: [ParentsProgressService],
})
export class ParentsProgressModule {}
