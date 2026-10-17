import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Req() req: any,
    @Query('category') category?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getNotifications(req.user.id || req.user.sub, {
      category,
      unreadOnly: unreadOnly === 'true',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Patch('read-all')
  async markAllRead(@Req() req: any) {
    return this.notificationsService.markAsRead(req.user.id || req.user.sub);
  }

  @Patch(':id/read')
  async markOneRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(req.user.id || req.user.sub, id);
  }

  @Get('preferences')
  async getPreferences(@Req() req: any) {
    return this.notificationsService.getPreferences(req.user.id || req.user.sub);
  }

  @Put('preferences')
  async updatePreference(
    @Req() req: any,
    @Body() body: { category: string; pushOn: boolean },
  ) {
    return this.notificationsService.updatePreference(req.user.id || req.user.sub, body.category, body.pushOn);
  }

  @Post('push-subscription')
  async registerPush(
    @Req() req: any,
    @Body()
    body: {
      endpoint: string;
      p256dh: string;
      auth: string;
      userAgent?: string;
    },
  ) {
    return this.notificationsService.registerPushSubscription(req.user.id || req.user.sub, body);
  }

  @Post('test-push')
  async sendTestPush(@Req() req: any) {
    return this.notificationsService.sendTestPush(req.user.id || req.user.sub);
  }
}
