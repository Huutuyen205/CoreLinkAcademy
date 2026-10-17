import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  MethodNotAllowedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CommunicationService } from './communication.service';

@Controller('communication')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Get('conversations')
  async getUserConversations(@Req() req: any) {
    return this.communicationService.getUserConversations(req.user.id || req.user.sub);
  }

  @Post('conversations')
  async createConversation(
    @Req() req: any,
    @Body()
    body: {
      recipientId: string;
      kind: 'guardian_teacher' | 'student_teacher' | 'guardian_staff';
      studentId?: string;
    },
  ) {
    return this.communicationService.getOrCreateConversation(req.user.id || req.user.sub, body);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
    @Query('keyword') keyword?: string,
    @Query('hasAttachments') hasAttachments?: string,
  ) {
    return this.communicationService.getMessages(req.user.id || req.user.sub, conversationId, {
      limit: limit ? parseInt(limit, 10) : 50,
      before,
      keyword,
      hasAttachments: hasAttachments === 'true',
    });
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Body()
    body: {
      body?: string;
      attachments?: Array<{ name: string; url: string; size: number; mimeType?: string; durationSeconds?: number }>;
      isUrgent?: boolean;
    },
  ) {
    return this.communicationService.sendMessage(req.user.id || req.user.sub, conversationId, body);
  }

  @Patch('messages/:id')
  async editMessage(
    @Req() req: any,
    @Param('id') messageId: string,
    @Body() body: { body: string },
  ) {
    return this.communicationService.editMessage(req.user.id || req.user.sub, messageId, body.body);
  }

  @Delete('messages/:id')
  async deleteMessage() {
    // TC-112, FR-902: Tuyệt đối không cho phép xóa tin nhắn
    throw new MethodNotAllowedException('Hệ thống CoreLink Academy không cho phép xóa tin nhắn theo quy định bảo mật');
  }

  @Post('conversations/:id/read')
  async markRead(@Req() req: any, @Param('id') conversationId: string) {
    return this.communicationService.markAsRead(req.user.id || req.user.sub, conversationId);
  }

  @Post('messages/:id/report')
  async reportMessage(
    @Req() req: any,
    @Param('id') messageId: string,
    @Body() body: { reason: string },
  ) {
    return this.communicationService.reportMessage(req.user.id || req.user.sub, messageId, body.reason);
  }

  @Post('admin/conversations/:id/lock')
  @Roles('admin', 'academic_staff')
  async lockConversation(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Body() body: { locked: boolean; reason?: string },
  ) {
    return this.communicationService.lockConversation(req.user.id || req.user.sub, conversationId, body.locked, body.reason);
  }

  @Post('chat-access-requests')
  @Roles('guardian')
  async requestChatAccess(
    @Req() req: any,
    @Body() body: { studentId: string; conversationId: string; reason: string },
  ) {
    return this.communicationService.requestChatAccess(req.user.id || req.user.sub, body);
  }

  @Post('admin/chat-access-requests/:id/decide')
  @Roles('admin', 'academic_staff')
  async decideChatAccess(
    @Req() req: any,
    @Param('id') requestId: string,
    @Body() body: { approved: boolean; note?: string },
  ) {
    return this.communicationService.decideChatAccessRequest(req.user.id || req.user.sub, requestId, body);
  }

  // Bảng tin lớp học (Announcements)
  @Post('classes/:classId/announcements')
  @Roles('admin', 'academic_staff', 'teacher')
  async createAnnouncement(
    @Req() req: any,
    @Param('classId') classId: string,
    @Body()
    body: {
      title: string;
      body: string;
      attachments?: Array<{ name: string; url: string; size: number }>;
    },
  ) {
    return this.communicationService.createClassAnnouncement(req.user.id || req.user.sub, classId, body);
  }

  @Get('classes/:classId/announcements')
  async getAnnouncements(@Req() req: any, @Param('classId') classId: string) {
    return this.communicationService.getClassAnnouncements(req.user.id || req.user.sub, classId);
  }

  @Post('announcements/:id/read')
  async readAnnouncement(@Req() req: any, @Param('id') id: string) {
    return this.communicationService.markAnnouncementAsRead(req.user.id || req.user.sub, id);
  }

  @Get('announcements/:id/readers')
  @Roles('admin', 'academic_staff', 'teacher')
  async getReaders(@Param('id') id: string) {
    return this.communicationService.getAnnouncementReaders(id);
  }

  @Post('announcements/:id/remind')
  @Roles('admin', 'academic_staff', 'teacher')
  async remindUnread(@Req() req: any, @Param('id') id: string) {
    return this.communicationService.remindUnreadAnnouncement(req.user.id || req.user.sub, id);
  }
}
