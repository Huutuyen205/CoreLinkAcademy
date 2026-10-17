import { Controller, Post, Get, Body, Param, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatbotService, ChatDto } from './chatbot.service';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hội thoại với Chatbot tư vấn tuyển sinh (AI-12, FR-103, S03)' })
  @ApiResponse({ status: 200, description: 'Phản hồi từ AI hoặc câu trả lời guardrail an toàn' })
  async chat(@Body() dto: ChatDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.chatbotService.handleChat(dto, userId);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Lấy lịch sử hội thoại của phiên chat' })
  async getSessionHistory(@Param('id') id: string) {
    return this.chatbotService.getSessionHistory(id);
  }
}
