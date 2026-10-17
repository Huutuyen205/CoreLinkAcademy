import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { conversations_kind, enrollments_status } from '@prisma/client';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

@Injectable()
export class CommunicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Tạo hoặc lấy hội thoại 1-1
   * RBAC:
   * - Không cho phép Học sinh chat với Học sinh (TC-115)
   * - Phụ huynh chỉ được nhắn Giáo viên đang dạy con mình (TC-110)
   */
  async getOrCreateConversation(
    callerUserId: string,
    data: {
      recipientId: string;
      kind: 'guardian_teacher' | 'student_teacher' | 'guardian_staff';
      studentId?: string;
    },
  ) {
    if (callerUserId === data.recipientId) {
      throw new BadRequestException('Không thể tự tạo hội thoại với chính mình');
    }

    const [callerUser, recipientUser] = await Promise.all([
      this.prisma.users.findUnique({
        where: { id: callerUserId },
        include: {
          students: true,
          guardians: true,
          teachers: true,
        },
      }),
      this.prisma.users.findUnique({
        where: { id: data.recipientId },
        include: {
          students: true,
          guardians: true,
          teachers: true,
        },
      }),
    ]);

    if (!callerUser || !recipientUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Chặn học sinh nhắn học sinh (TC-115, FR-902)
    const isCallerStudent = !!callerUser.students;
    const isRecipientStudent = !!recipientUser.students;
    if (isCallerStudent && isRecipientStudent) {
      throw new ForbiddenException('Học sinh không được phép nhắn tin trực tiếp với học sinh khác');
    }

    // Nếu phụ huynh nhắn giáo viên: kiểm tra giáo viên có dạy con mình không (TC-110, FR-901)
    if (data.kind === 'guardian_teacher') {
      const isCallerGuardian = !!callerUser.guardians;
      if (isCallerGuardian) {
        const guardian = callerUser.guardians;
        if (!guardian) {
          throw new ForbiddenException('Bạn chưa có hồ sơ phụ huynh');
        }

        // Lấy danh sách học sinh của phụ huynh
        const guardianships = await this.prisma.guardianships.findMany({
          where: { guardian_id: guardian.id },
          select: { student_id: true },
        });
        const studentIds = guardianships.map((g) => g.student_id);

        if (studentIds.length === 0) {
          throw new ForbiddenException('Phụ huynh chưa có con theo học tại trung tâm');
        }

        // Kiểm tra giáo viên mục tiêu có dạy bất kỳ con nào của phụ huynh không
        const teacher = recipientUser.teachers;
        if (!teacher) {
          throw new ForbiddenException('Người nhận không phải là giáo viên');
        }

        // Tìm các lớp mà học sinh đang học
        const activeEnrollments = await this.prisma.enrollments.findMany({
          where: {
            student_id: { in: studentIds },
            status: enrollments_status.active,
          },
          select: { class_id: true, student_id: true },
        });
        const classIds = activeEnrollments.map((e) => e.class_id);

        // Tìm xem giáo viên có phụ trách các lớp này không
        const [isClassTeacher, hasSessions] = await Promise.all([
          this.prisma.class_teachers.findFirst({
            where: {
              class_id: { in: classIds },
              teacher_id: teacher.id,
            },
          }),
          this.prisma.class_sessions.findFirst({
            where: {
              class_id: { in: classIds },
              teacher_id: teacher.id,
            },
          }),
        ]);

        if (!isClassTeacher && !hasSessions) {
          throw new ForbiddenException('Phụ huynh chỉ có thể nhắn tin với giáo viên đang trực tiếp giảng dạy con mình');
        }
      }
    }

    // Tìm hội thoại hiện có giữa 2 người
    const existing = await this.prisma.conversations.findFirst({
      where: {
        kind: data.kind as conversations_kind,
        AND: [
          {
            conversation_participants: {
              some: { user_id: callerUserId },
            },
          },
          {
            conversation_participants: {
              some: { user_id: data.recipientId },
            },
          },
        ],
      },
      include: {
        conversation_participants: true,
      },
    });

    if (existing && existing.conversation_participants.length === 2) {
      return existing;
    }

    // Tạo hội thoại mới
    const branchId = callerUser.branch_id || recipientUser.branch_id;
    if (!branchId) {
      throw new BadRequestException('Không xác định được cơ sở cho hội thoại');
    }

    const conversation = await this.prisma.conversations.create({
      data: {
        branch_id: branchId,
        kind: data.kind as conversations_kind,
        student_id: data.studentId ?? null,
        conversation_participants: {
          createMany: {
            data: [
              { user_id: callerUserId },
              { user_id: data.recipientId },
            ],
          },
        },
      },
      include: {
        conversation_participants: {
          include: {
            users: {
              select: { id: true, full_name: true, phone: true },
            },
          },
        },
      },
    });

    return conversation;
  }

  /**
   * Lấy danh sách hội thoại của người dùng
   */
  async getUserConversations(userId: string) {
    const participants = await this.prisma.conversation_participants.findMany({
      where: { user_id: userId },
      include: {
        conversations: {
          include: {
            conversation_participants: {
              include: {
                users: {
                  select: { id: true, full_name: true, phone: true },
                },
              },
            },
            messages: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        conversations: {
          last_message_at: 'desc',
        },
      },
    });

    return participants.map((p) => {
      const conv = p.conversations;
      const otherParticipant = conv.conversation_participants.find((cp) => cp.user_id !== userId);
      const lastMessage = conv.messages[0] || null;

      return {
        id: conv.id,
        kind: conv.kind,
        studentId: conv.student_id,
        lockedAt: conv.locked_at,
        isLocked: !!conv.locked_at,
        lastMessageAt: conv.last_message_at,
        lastReadAt: p.last_read_at,
        muted: p.muted,
        otherUser: otherParticipant?.users || null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              body: lastMessage.body,
              senderId: lastMessage.sender_id,
              createdAt: lastMessage.created_at,
              hasAttachments: !!lastMessage.attachments,
            }
          : null,
      };
    });
  }

  /**
   * Kiểm tra quyền truy cập hội thoại (Thành viên hoặc Phụ huynh có quyền 72h)
   */
  async checkConversationAccess(userId: string, conversationId: string) {
    const isMember = await this.prisma.conversation_participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    if (isMember) {
      return { isMember: true, isReadOnly: false };
    }

    // Kiểm tra xem có phải Phụ huynh được cấp quyền 72h xem chat (FR-903, TC-116, TC-117)
    const guardian = await this.prisma.guardians.findFirst({
      where: { user_id: userId },
    });

    if (guardian) {
      const accessRequest = await this.prisma.chat_access_requests.findFirst({
        where: {
          conversation_id: conversationId,
          guardian_id: guardian.id,
          status: 'approved',
          expires_at: { gt: new Date() },
        },
      });

      if (accessRequest) {
        // Ghi nhật ký xem chat vào audit_logs (TC-116)
        await this.prisma.audit_logs.create({
          data: {
            actor_id: userId,
            action: 'guardian_view_chat_72h',
            entity: 'conversations',
            entity_id: conversationId,
            reason: `Phụ huynh xem hội thoại theo quyền cấp phép id=${accessRequest.id}`,
            after_data: { accessRequestId: accessRequest.id, expiresAt: accessRequest.expires_at },
          },
        });

        return { isMember: false, isReadOnly: true, accessRequestId: accessRequest.id };
      }
    }

    throw new ForbiddenException('Bạn không có quyền truy cập vào cuộc hội thoại này');
  }

  /**
   * Lấy lịch sử tin nhắn trong hội thoại
   */
  async getMessages(
    userId: string,
    conversationId: string,
    query?: { limit?: number; before?: string; keyword?: string; hasAttachments?: boolean },
  ) {
    const access = await this.checkConversationAccess(userId, conversationId);

    const limit = Math.min(100, Math.max(1, Number(query?.limit || 50)));
    const where: any = {
      conversation_id: conversationId,
    };

    if (query?.before) {
      where.created_at = { lt: new Date(query.before) };
    }

    if (query?.keyword) {
      where.body = { contains: query.keyword };
    }

    if (query?.hasAttachments) {
      where.attachments = { not: null };
    }

    // Lấy thông tin người tham gia khác để tính trạng thái "đã xem"
    const participants = await this.prisma.conversation_participants.findMany({
      where: { conversation_id: conversationId },
    });
    const otherParticipant = participants.find((p) => p.user_id !== userId);

    const messages = await this.prisma.messages.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        users: {
          select: { id: true, full_name: true, phone: true },
        },
        message_edits: {
          orderBy: { edited_at: 'desc' },
        },
      },
    });

    return {
      conversationId,
      isReadOnly: access.isReadOnly,
      messages: messages.reverse().map((m) => {
        const isRead = otherParticipant?.last_read_at
          ? m.created_at <= otherParticipant.last_read_at
          : false;

        return {
          id: m.id,
          senderId: m.sender_id,
          sender: m.users,
          body: m.body,
          attachments: m.attachments,
          isUrgent: m.is_urgent,
          editedAt: m.edited_at,
          createdAt: m.created_at,
          isRead,
          editHistory: m.message_edits.map((e) => ({
            previousBody: e.previous_body,
            editedAt: e.edited_at,
          })),
        };
      }),
    };
  }

  /**
   * Gửi tin nhắn mới
   * Kiểm tra:
   * - Phụ huynh xem 72h chỉ đọc không được gửi tin (TC-116 -> 403)
   * - Hội thoại bị Admin khóa (TC-118 -> 400)
   * - Giới hạn file 20 MB (TC-111 -> 400)
   * - Giờ yên lặng (21h-7h) -> tin vào hộp thư, notification scheduled_for 7:00 (TC-114)
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    data: {
      body?: string;
      attachments?: Array<{ name: string; url: string; size: number; mimeType?: string; durationSeconds?: number }>;
      isUrgent?: boolean;
    },
  ) {
    const access = await this.checkConversationAccess(userId, conversationId);
    if (access.isReadOnly) {
      throw new ForbiddenException('Bạn chỉ có quyền xem cuộc hội thoại này (chế độ chỉ đọc 72 giờ)');
    }

    const conversation = await this.prisma.conversations.findUnique({
      where: { id: conversationId },
      include: { conversation_participants: true },
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    if (conversation.locked_at) {
      throw new BadRequestException('Cuộc hội thoại này đã bị Quản trị viên tạm khóa do có báo cáo vi phạm');
    }

    // Kiểm tra kích thước file tối đa 20 MB (FR-901, TC-111)
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
    if (data.attachments && data.attachments.length > 0) {
      for (const att of data.attachments) {
        if (att.size > MAX_FILE_SIZE) {
          throw new BadRequestException(`File đính kèm "${att.name}" (${(att.size / (1024 * 1024)).toFixed(1)} MB) vượt quá giới hạn tối đa 20 MB`);
        }
        if (att.durationSeconds && att.durationSeconds > 120) {
          throw new BadRequestException(`Ghi âm vượt quá giới hạn tối đa 2 phút (${att.durationSeconds}s)`);
        }
      }
    }

    if (!data.body && (!data.attachments || data.attachments.length === 0)) {
      throw new BadRequestException('Nội dung tin nhắn hoặc file đính kèm không được để trống');
    }

    const now = new Date();

    const [message] = await Promise.all([
      this.prisma.messages.create({
        data: {
          conversation_id: conversationId,
          sender_id: userId,
          body: data.body ?? null,
          attachments: (data.attachments as any) ?? null,
          is_urgent: !!data.isUrgent,
        },
        include: {
          users: {
            select: { id: true, full_name: true, phone: true },
          },
        },
      }),
      this.prisma.conversations.update({
        where: { id: conversationId },
        data: { last_message_at: now },
      }),
    ]);

    await this.prisma.$executeRaw`
      UPDATE messages SET created_at = NOW(3) WHERE id = ${message.id}
    `;

    await this.prisma.$executeRaw`
      UPDATE conversation_participants
      SET last_read_at = NOW(3)
      WHERE conversation_id = ${conversationId} AND user_id = ${userId}
    `;

    // Gửi thông báo tới người nhận (ngoài khung giờ 21h-7h tự động hẹn giờ 7:00 sáng hôm sau - TC-114)
    const recipient = conversation.conversation_participants.find((p) => p.user_id !== userId);
    if (recipient) {
      await this.notificationsService.createNotification({
        userId: recipient.user_id,
        category: 'messages_chat',
        title: `Tin nhắn mới từ ${message.users.full_name}`,
        body: data.body ? (data.body.length > 80 ? data.body.slice(0, 80) + '...' : data.body) : 'Đã gửi một tệp đính kèm',
        link: `/messages?conversationId=${conversationId}`,
        isUrgent: !!data.isUrgent,
      });
    }

    return message;
  }

  /**
   * Sửa tin nhắn trong vòng 5 phút (FR-902, TC-113)
   * DB trigger trg_messages_keep_original tự lưu bản gốc vào message_edits và chặn sửa sau 5 phút.
   */
  async editMessage(userId: string, messageId: string, newBody: string) {
    const message = await this.prisma.messages.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Không tìm thấy tin nhắn');
    }

    if (message.sender_id !== userId) {
      throw new ForbiddenException('Bạn chỉ có thể sửa tin nhắn của chính mình');
    }

    if (!newBody || newBody.trim().length === 0) {
      throw new BadRequestException('Nội dung tin nhắn không được để trống');
    }

    try {
      const updated = await this.prisma.messages.update({
        where: { id: messageId },
        data: {
          body: newBody,
        },
        include: {
          message_edits: true,
        },
      });

      return {
        ...updated,
        message_edits: (updated.message_edits || []).map((e) => ({
          ...e,
          id: e.id.toString(),
        })),
      };
    } catch (err: any) {
      if (err.message?.includes('Chỉ sửa tin nhắn trong 5 phút') || err.message?.includes('1644')) {
        throw new BadRequestException('Chỉ được chỉnh sửa tin nhắn trong vòng 5 phút kể từ khi gửi');
      }
      throw err;
    }
  }

  /**
   * Đánh dấu đã đọc hội thoại
   */
  async markAsRead(userId: string, conversationId: string) {
    const participant = await this.prisma.conversation_participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('Bạn không phải là thành viên của cuộc hội thoại này');
    }

    await this.prisma.$executeRaw`
      UPDATE conversation_participants
      SET last_read_at = NOW(3)
      WHERE conversation_id = ${conversationId} AND user_id = ${userId}
    `;

    return this.prisma.conversation_participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });
  }

  /**
   * Báo cáo tin nhắn không phù hợp (FR-904, TC-118)
   */
  async reportMessage(userId: string, messageId: string, reason: string) {
    const message = await this.prisma.messages.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Không tìm thấy tin nhắn');
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Lý do báo cáo không được để trống');
    }

    const report = await this.prisma.message_reports.create({
      data: {
        message_id: messageId,
        reported_by: userId,
        reason,
        status: 'open',
      },
    });

    // Thông báo cho ban Quản trị (Admin) trong vòng 1 phút
    const adminRoles = await this.prisma.user_roles.findMany({
      where: {
        roles: { code: 'admin' },
      },
      select: { user_id: true },
    });

    for (const a of adminRoles) {
      await this.notificationsService.createNotification({
        userId: a.user_id,
        category: 'admin_report',
        title: 'Báo cáo tin nhắn mới',
        body: `Có báo cáo tin nhắn vi phạm tiêu chuẩn cộng đồng: "${reason}"`,
        link: `/admin/messages/reports/${report.id}`,
        isUrgent: true,
      });
    }

    return {
      success: true,
      reportId: report.id,
      message: 'Báo cáo tin nhắn đã được ghi nhận và gửi đến Ban Quản trị xử lý',
    };
  }

  /**
   * Quản trị viên tạm khóa hoặc mở khóa hội thoại (FR-904, TC-118)
   */
  async lockConversation(adminId: string, conversationId: string, locked: boolean, reason?: string) {
    const conv = await this.prisma.conversations.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    const updated = await this.prisma.conversations.update({
      where: { id: conversationId },
      data: {
        locked_at: locked ? new Date() : null,
      },
    });

    await this.prisma.audit_logs.create({
      data: {
        actor_id: adminId,
        action: locked ? 'lock_conversation' : 'unlock_conversation',
        entity: 'conversations',
        entity_id: conversationId,
        reason: reason || (locked ? 'Tạm khóa hội thoại do vi phạm' : 'Mở khóa hội thoại'),
        after_data: { locked_at: updated.locked_at },
      },
    });

    return {
      success: true,
      conversationId,
      isLocked: !!updated.locked_at,
    };
  }

  /**
   * Phụ huynh yêu cầu xem chat giữa Giáo viên và con (FR-903, TC-116, TC-117)
   */
  async requestChatAccess(
    userId: string,
    data: {
      studentId: string;
      conversationId: string;
      reason: string;
    },
  ) {
    const guardian = await this.prisma.guardians.findFirst({
      where: { user_id: userId },
    });

    if (!guardian) {
      throw new ForbiddenException('Chỉ phụ huynh mới có quyền gửi yêu cầu xem tin nhắn của con');
    }

    // Xác nhận quan hệ giữa phụ huynh và học sinh
    const guardianship = await this.prisma.guardianships.findUnique({
      where: {
        student_id_guardian_id: {
          student_id: data.studentId,
          guardian_id: guardian.id,
        },
      },
    });

    if (!guardianship) {
      throw new ForbiddenException('Học sinh này không thuộc quyền giám hộ của bạn');
    }

    if (!data.reason || data.reason.trim().length === 0) {
      throw new BadRequestException('Vui lòng nêu rõ lý do yêu cầu xem đoạn hội thoại');
    }

    const request = await this.prisma.chat_access_requests.create({
      data: {
        guardian_id: guardian.id,
        student_id: data.studentId,
        conversation_id: data.conversationId,
        reason: data.reason,
        status: 'pending',
      },
    });

    return request;
  }

  /**
   * Quản trị viên duyệt yêu cầu xem chat (cấp quyền chỉ đọc trong 72 giờ)
   */
  async decideChatAccessRequest(
    adminId: string,
    requestId: string,
    data: { approved: boolean; note?: string },
  ) {
    const request = await this.prisma.chat_access_requests.findUnique({
      where: { id: requestId },
      include: {
        conversations: {
          include: {
            conversation_participants: {
              include: {
                users: {
                  include: {
                    user_roles_user_roles_user_idTousers: {
                      include: { roles: true },
                    },
                  },
                },
              },
            },
          },
        },
        guardians: {
          include: { users: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu xem chat');
    }

    const now = new Date();
    const expiresAt = data.approved ? new Date(now.getTime() + 72 * 60 * 60 * 1000) : null;

    const updated = await this.prisma.chat_access_requests.update({
      where: { id: requestId },
      data: {
        status: data.approved ? 'approved' : 'rejected',
        decided_by: adminId,
        decision_note: data.note ?? null,
        decided_at: now,
        expires_at: expiresAt,
      },
    });

    if (data.approved) {
      // Thông báo cho giáo viên trong cuộc hội thoại biết phụ huynh được cấp quyền xem (FR-903)
      for (const p of request.conversations.conversation_participants) {
        const roles = p.users.user_roles_user_roles_user_idTousers.map((ur) => ur.roles.code);
        if (roles.includes('teacher')) {
          await this.notificationsService.createNotification({
            userId: p.user_id,
            category: 'chat_access_granted',
            title: 'Phụ huynh được cấp quyền xem hội thoại',
            body: `Phụ huynh ${request.guardians.users.full_name} đã được Ban Quản trị phê duyệt quyền xem chỉ đọc cuộc hội thoại này trong 72 giờ.`,
            link: `/messages?conversationId=${request.conversation_id}`,
            isUrgent: true,
          });
        }
      }

      // Thông báo cho phụ huynh
      await this.notificationsService.createNotification({
        userId: request.guardians.user_id,
        category: 'chat_access_decision',
        title: 'Yêu cầu xem tin nhắn được phê duyệt',
        body: 'Yêu cầu của bạn đã được duyệt. Bạn có quyền xem chỉ đọc cuộc hội thoại trong vòng 72 giờ tới.',
        link: `/messages?conversationId=${request.conversation_id}`,
        isUrgent: true,
      });
    }

    return updated;
  }

  // ==========================================
  // BẢNG TIN LỚP HỌC (FR-905, TC-119)
  // ==========================================

  /**
   * Đăng thông báo lên bảng tin lớp
   * Không có ô bình luận (FR-905)
   */
  async createClassAnnouncement(
    authorId: string,
    classId: string,
    data: {
      title: string;
      body: string;
      attachments?: Array<{ name: string; url: string; size: number }>;
    },
  ) {
    if (!data.title || !data.body) {
      throw new BadRequestException('Tiêu đề và nội dung bảng tin không được để trống');
    }

    const announcement = await this.prisma.announcements.create({
      data: {
        class_id: classId,
        author_id: authorId,
        title: data.title,
        body: data.body,
        attachments: (data.attachments as any) ?? null,
      },
      include: {
        users: {
          select: { id: true, full_name: true, phone: true },
        },
      },
    });

    // Gửi thông báo tới toàn bộ học sinh và phụ huynh trong lớp
    const enrollments = await this.prisma.enrollments.findMany({
      where: {
        class_id: classId,
        status: enrollments_status.active,
      },
      include: {
        students: {
          include: {
            users: true,
            guardianships: {
              include: {
                guardians: {
                  include: { users: true },
                },
              },
            },
          },
        },
      },
    });

    const userIdsToNotify = new Set<string>();
    for (const e of enrollments) {
      if (e.students?.user_id) userIdsToNotify.add(e.students.user_id);
      for (const g of e.students?.guardianships || []) {
        if (g.guardians?.user_id) userIdsToNotify.add(g.guardians.user_id);
      }
    }

    for (const uid of userIdsToNotify) {
      await this.notificationsService.createNotification({
        userId: uid,
        category: 'bulletin_announcement',
        title: `Bảng tin lớp: ${data.title}`,
        body: data.body.length > 100 ? data.body.slice(0, 100) + '...' : data.body,
        link: `/classes/${classId}/bulletin`,
      });
    }

    return announcement;
  }

  /**
   * Lấy danh sách bảng tin của lớp
   */
  async getClassAnnouncements(userId: string, classId: string) {
    const announcements = await this.prisma.announcements.findMany({
      where: {
        class_id: classId,
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          select: { id: true, full_name: true, phone: true },
        },
        announcement_reads: {
          where: { user_id: userId },
        },
      },
    });

    return announcements.map((a) => ({
      id: a.id,
      classId: a.class_id,
      title: a.title,
      body: a.body,
      attachments: a.attachments,
      createdAt: a.created_at,
      author: a.users,
      hasRead: a.announcement_reads.length > 0,
      readAt: a.announcement_reads[0]?.read_at ?? null,
    }));
  }

  /**
   * Người dùng bấm "Đã đọc" thông báo bảng tin
   */
  async markAnnouncementAsRead(userId: string, announcementId: string) {
    return this.prisma.announcement_reads.upsert({
      where: {
        announcement_id_user_id: {
          announcement_id: announcementId,
          user_id: userId,
        },
      },
      create: {
        announcement_id: announcementId,
        user_id: userId,
      },
      update: {
        read_at: new Date(),
      },
    });
  }

  /**
   * Giáo viên xem danh sách đã đọc và chưa đọc (FR-905, TC-119)
   */
  async getAnnouncementReaders(announcementId: string) {
    const announcement = await this.prisma.announcements.findUnique({
      where: { id: announcementId },
      include: {
        announcement_reads: {
          include: {
            users: {
              select: { id: true, full_name: true, phone: true },
            },
          },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException('Không tìm thấy thông báo bảng tin');
    }

    // Lấy toàn bộ danh sách thành viên của lớp (học sinh và phụ huynh)
    const enrollments = await this.prisma.enrollments.findMany({
      where: {
        class_id: announcement.class_id,
        status: enrollments_status.active,
      },
      include: {
        students: {
          include: {
            users: { select: { id: true, full_name: true, phone: true } },
            guardianships: {
              include: {
                guardians: {
                  include: {
                    users: { select: { id: true, full_name: true, phone: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const readUserMap = new Map(announcement.announcement_reads.map((r) => [r.user_id, r.read_at]));

    const allMembers: Array<{ userId: string; fullName: string; role: string }> = [];
    const seenUsers = new Set<string>();

    for (const e of enrollments) {
      if (e.students?.user_id && !seenUsers.has(e.students.user_id)) {
        seenUsers.add(e.students.user_id);
        allMembers.push({
          userId: e.students.user_id,
          fullName: e.students.users.full_name,
          role: 'student',
        });
      }

      for (const g of e.students?.guardianships || []) {
        if (g.guardians?.user_id && !seenUsers.has(g.guardians.user_id)) {
          seenUsers.add(g.guardians.user_id);
          allMembers.push({
            userId: g.guardians.user_id,
            fullName: g.guardians.users.full_name,
            role: 'guardian',
          });
        }
      }
    }

    const readUsers: any[] = [];
    const unreadUsers: any[] = [];

    for (const member of allMembers) {
      if (readUserMap.has(member.userId)) {
        readUsers.push({
          ...member,
          readAt: readUserMap.get(member.userId),
        });
      } else {
        unreadUsers.push(member);
      }
    }

    return {
      announcementId,
      totalMembers: allMembers.length,
      readCount: readUsers.length,
      unreadCount: unreadUsers.length,
      readUsers,
      unreadUsers,
    };
  }

  /**
   * Giáo viên gửi nhắc nhở tới những người chưa đọc bảng tin (TC-119)
   */
  async remindUnreadAnnouncement(teacherId: string, announcementId: string) {
    const readerStats = await this.getAnnouncementReaders(announcementId);
    const announcement = await this.prisma.announcements.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    for (const member of readerStats.unreadUsers) {
      await this.notificationsService.createNotification({
        userId: member.userId,
        category: 'bulletin_announcement',
        title: `Nhắc đọc thông báo lớp: ${announcement.title}`,
        body: 'Giáo viên gửi lời nhắc bạn vui lòng xem và bấm "Đã đọc" thông báo này trên bảng tin lớp.',
        link: `/classes/${announcement.class_id}/bulletin`,
        isUrgent: true,
      });
    }

    return {
      success: true,
      remindedCount: readerStats.unreadCount,
      message: `Đã gửi thông báo nhắc nhở đến ${readerStats.unreadCount} thành viên chưa đọc`,
    };
  }
}
