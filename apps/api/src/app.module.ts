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
import { AttendanceModule } from './modules/attendance/attendance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { ParentsProgressModule } from './modules/parents-progress/parents-progress.module';
import { FinanceModule } from './modules/finance/finance.module';
import { AdminSystemModule } from './modules/admin-system/admin-system.module';

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
    AttendanceModule,
    NotificationsModule,
    CommunicationModule,
    AssessmentModule,
    CurriculumModule,
    ParentsProgressModule,
    FinanceModule,
    AdminSystemModule,
  ],
})
export class AppModule {}
