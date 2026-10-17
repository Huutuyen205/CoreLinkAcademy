import { Module } from '@nestjs/common';
import { AdminSystemService } from './admin-system.service';
import { AdminSystemController } from './admin-system.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminSystemController],
  providers: [AdminSystemService],
  exports: [AdminSystemService],
})
export class AdminSystemModule {}
