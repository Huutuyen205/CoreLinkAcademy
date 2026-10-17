import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

import { PublicModule } from './modules/public/public.module';
import { LeadsModule } from './modules/leads/leads.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { AiModule } from './modules/ai/ai.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { AcademicModule } from './modules/academic/academic.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    PublicModule,
    LeadsModule,
    CampaignsModule,
    AiModule,
    KnowledgeBaseModule,
    ChatbotModule,
    AcademicModule,
  ],
})
export class AppModule {}
