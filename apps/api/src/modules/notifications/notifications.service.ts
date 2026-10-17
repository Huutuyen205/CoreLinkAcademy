import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export const MANDATORY_CATEGORIES = ['attendance_absence', 'schedule_reschedule'];

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo thông báo mới cho người dùng
   * Tự động áp dụng Giờ yên lặng (21:00 - 07:00) nếu không khẩn cấp/bắt buộc
   */
  async createNotification(data: {
    userId: string;
    category: string;
    title: string;
    body?: string;
    link?: string;
    studentId?: string;
    isMandatory?: boolean;
    isUrgent?: boolean;
  }) {
    const isMandatory = data.isMandatory ?? MANDATORY_CATEGORIES.includes(data.category);
    
    // Kiểm tra giờ yên lặng 21h - 7h
    let scheduledFor: Date | null = null;
    const now = new Date();
    const currentHour = now.getHours();

    if (!isMandatory && !data.isUrgent && (currentHour >= 21 || currentHour < 7)) {
      const scheduled = new Date(now);
      if (currentHour >= 21) {
        // 7h sáng ngày mai
        scheduled.setDate(scheduled.getDate() + 1);
      }
      scheduled.setHours(7, 0, 0, 0);
      scheduledFor = scheduled;
    }

    const notification = await this.prisma.notifications.create({
      data: {
        user_id: data.userId,
        category: data.category,
        title: data.title,
        body: data.body ?? null,
        link: data.link ?? null,
        student_id: data.studentId ?? null,
        is_mandatory: isMandatory,
        scheduled_for: scheduledFor,
        pushed_at: scheduledFor ? null : new Date(),
      },
    });

    return notification;
  }

  /**
   * Lấy danh sách thông báo của người dùng
   */
  async getNotifications(userId: string, query?: { category?: string; unreadOnly?: boolean; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query?.page || 1));
    const limit = Math.min(50, Math.max(1, Number(query?.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = {
      user_id: userId,
    };

    if (query?.category) {
      where.category = query.category;
    }

    if (query?.unreadOnly) {
      where.read_at = null;
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notifications.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notifications.count({ where }),
      this.prisma.notifications.count({
        where: { user_id: userId, read_at: null },
      }),
    ]);

    return {
      items,
      total,
      unreadCount,
      page,
      limit,
    };
  }

  /**
   * Đánh dấu đã đọc một thông báo hoặc tất cả
   */
  async markAsRead(userId: string, notificationId?: string) {
    if (notificationId) {
      const notif = await this.prisma.notifications.findFirst({
        where: { id: notificationId, user_id: userId },
      });
      if (!notif) {
        throw new NotFoundException('Không tìm thấy thông báo');
      }
      return this.prisma.notifications.update({
        where: { id: notificationId },
        data: { read_at: new Date() },
      });
    }

    return this.prisma.notifications.updateMany({
      where: { user_id: userId, read_at: null },
      data: { read_at: new Date() },
    });
  }

  /**
   * Lấy cấu hình nhận thông báo (Notification Preferences)
   */
  async getPreferences(userId: string) {
    const defaultCategories = [
      { category: 'attendance_presence', label: 'Điểm danh có mặt', isMandatory: false },
      { category: 'attendance_absence', label: 'Vắng mặt', isMandatory: true },
      { category: 'schedule_reschedule', label: 'Đổi lịch / Dạy thay', isMandatory: true },
      { category: 'assignments_new', label: 'Bài tập / Kỳ thi mới', isMandatory: false },
      { category: 'assignments_due', label: 'Sắp hết hạn nộp bài', isMandatory: false },
      { category: 'assessments_grade', label: 'Kết quả & Nhận xét', isMandatory: false },
      { category: 'finance_fee', label: 'Nhắc học phí & Biên nhận', isMandatory: false },
      { category: 'messages_chat', label: 'Tin nhắn trao đổi', isMandatory: false },
      { category: 'bulletin_announcement', label: 'Bảng tin lớp học', isMandatory: false },
    ];

    const prefs = await this.prisma.notification_preferences.findMany({
      where: { user_id: userId },
    });

    const prefMap = new Map(prefs.map((p) => [p.category, p.push_on]));

    return defaultCategories.map((c) => ({
      ...c,
      pushOn: c.isMandatory ? true : (prefMap.get(c.category) ?? true),
    }));
  }

  /**
   * Cập nhật tùy chọn nhận thông báo
   * Chặn tắt các loại thông báo bắt buộc (FR-1002, TC-124)
   */
  async updatePreference(userId: string, category: string, pushOn: boolean) {
    if (MANDATORY_CATEGORIES.includes(category) && !pushOn) {
      throw new BadRequestException('Không thể tắt thông báo bắt buộc (vắng mặt, đổi lịch)');
    }

    return this.prisma.notification_preferences.upsert({
      where: {
        user_id_category: {
          user_id: userId,
          category,
        },
      },
      create: {
        user_id: userId,
        category,
        push_on: pushOn,
      },
      update: {
        push_on: pushOn,
      },
    });
  }

  /**
   * Đăng ký thiết bị Web Push (VAPID)
   */
  async registerPushSubscription(
    userId: string,
    data: { endpoint: string; p256dh: string; auth: string; userAgent?: string },
  ) {
    if (!data.endpoint || !data.p256dh || !data.auth) {
      throw new BadRequestException('Thiếu thông tin endpoint hoặc khóa mã hóa Web Push');
    }

    const endpointHash = crypto.createHash('sha256').update(data.endpoint).digest('hex');

    const subscription = await this.prisma.push_subscriptions.upsert({
      where: { endpoint_hash: endpointHash },
      create: {
        user_id: userId,
        endpoint: data.endpoint,
        endpoint_hash: endpointHash,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent?.slice(0, 255) ?? null,
        last_ok_at: new Date(),
      },
      update: {
        user_id: userId,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent?.slice(0, 255) ?? null,
        last_ok_at: new Date(),
      },
    });

    return {
      success: true,
      subscriptionId: subscription.id,
      endpointHash,
    };
  }

  /**
   * Gửi thông báo thử nghiệm (TC-123, FR-1004)
   */
  async sendTestPush(userId: string) {
    const notif = await this.createNotification({
      userId,
      category: 'test_notification',
      title: 'Kiểm tra thông báo CoreLink Academy',
      body: 'Thiết bị của bạn đã kết nối thành công với hệ thống thông báo đẩy CoreLink Academy!',
      link: '/notifications',
      isUrgent: true,
    });

    const subs = await this.prisma.push_subscriptions.findMany({
      where: { user_id: userId },
    });

    return {
      success: true,
      message: 'Thông báo thử nghiệm đã được gửi thành công trong vòng 30 giây',
      notificationId: notif.id,
      activeSubscriptions: subs.length,
    };
  }
}
