import { Module } from '@nestjs/common';
import { FinalIntegrationController } from './final-integration.controller';
import { FinalIntegrationService } from './final-integration.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FinalIntegrationController],
  providers: [FinalIntegrationService],
  exports: [FinalIntegrationService],
})
export class FinalIntegrationModule {}
