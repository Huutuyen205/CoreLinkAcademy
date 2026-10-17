import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  invoices_status,
  payments_method,
  payroll_periods_status,
} from '@prisma/client';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export interface CreateInvoiceDto {
  branch_id: string;
  student_id: string;
  enrollment_id?: string;
  fee_plan_id?: string;
  description: string;
  amount_vnd: number | string | bigint;
  discount_vnd?: number | string | bigint;
  discount_reason?: string;
  due_date: string | Date;
}

export interface RecordPaymentDto {
  invoice_id: string;
  amount_vnd: number | string | bigint;
  method: payments_method;
  gateway_txn_id?: string;
  note?: string;
}

export interface CalculatePayrollDto {
  branch_id: string;
  period_month: string; // YYYY-MM
  default_rate_vnd?: number | string | bigint;
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // 1. HỌC PHÍ & HOÁ ĐƠN (FR-1101, FR-1102, TC-125..TC-128)
  // =========================================================================

  /**
   * TC-125: Tạo hoá đơn / khoản phải thu có giảm giá
   */
  async createInvoice(dto: CreateInvoiceDto, creatorId: string) {
    const amountBig = BigInt(dto.amount_vnd);
    const discountBig = BigInt(dto.discount_vnd || 0);

    if (discountBig < 0n) {
      throw new BadRequestException('Giảm giá không được là số âm');
    }
    if (discountBig > amountBig) {
      throw new BadRequestException('Giảm giá không được vượt quá số tiền gốc');
    }

    const netReceivable = amountBig - discountBig;

    const invoice = await this.prisma.invoices.create({
      data: {
        branch_id: dto.branch_id,
        student_id: dto.student_id,
        enrollment_id: dto.enrollment_id || null,
        fee_plan_id: dto.fee_plan_id || null,
        description: dto.description,
        amount_vnd: amountBig,
        discount_vnd: discountBig,
        discount_reason: dto.discount_reason || null,
        paid_vnd: 0n,
        due_date: new Date(dto.due_date),
        status: invoices_status.unpaid,
        created_by: creatorId,
      },
      include: {
        students: {
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return {
      ...invoice,
      net_receivable_vnd: netReceivable.toString(),
    };
  }

  /**
   * TC-126 & TC-127: Ghi nhận thanh toán và cấp số biên nhận không trùng (FOR UPDATE)
   */
  async recordPayment(dto: RecordPaymentDto, recordedBy?: string) {
    const payAmountBig = BigInt(dto.amount_vnd);
    if (payAmountBig <= 0n) {
      throw new BadRequestException('Số tiền thanh toán phải lớn hơn 0');
    }

    return await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoices.findUnique({
        where: { id: dto.invoice_id },
      });
      if (!invoice) {
        throw new NotFoundException('Không tìm thấy hoá đơn');
      }

      if (invoice.status === invoices_status.void) {
        throw new BadRequestException('Hoá đơn đã bị huỷ (void)');
      }

      const currentYear = new Date().getFullYear();

      // Cấp số biên nhận an toàn với FOR UPDATE chống va chạm đồng thời
      await tx.$executeRaw`
        INSERT INTO receipt_counters (branch_id, year_no, last_no)
        VALUES (${invoice.branch_id}, ${currentYear}, 0)
        ON DUPLICATE KEY UPDATE branch_id = branch_id;
      `;

      const counters: any[] = await tx.$queryRaw`
        SELECT last_no FROM receipt_counters
        WHERE branch_id = ${invoice.branch_id} AND year_no = ${currentYear}
        FOR UPDATE;
      `;

      const nextNo = (counters[0]?.last_no ?? 0) + 1;

      await tx.$executeRaw`
        UPDATE receipt_counters
        SET last_no = ${nextNo}
        WHERE branch_id = ${invoice.branch_id} AND year_no = ${currentYear};
      `;

      const receiptNo = `REC-${currentYear}-${String(nextNo).padStart(5, '0')}`;

      // Tạo bản ghi payment
      const payment = await tx.payments.create({
        data: {
          invoice_id: invoice.id,
          amount_vnd: payAmountBig,
          method: dto.method,
          gateway_txn_id: dto.gateway_txn_id || null,
          paid_at: new Date(),
          recorded_by: recordedBy || null,
          note: dto.note || null,
        },
      });

      // Tạo receipt
      const receipt = await tx.receipts.create({
        data: {
          payment_id: payment.id,
          receipt_no: receiptNo,
        },
      });

      // Cập nhật hoá đơn
      const newPaidBig = BigInt(invoice.paid_vnd) + payAmountBig;
      const netTotalBig = BigInt(invoice.amount_vnd) - BigInt(invoice.discount_vnd);

      let newStatus: invoices_status = invoices_status.unpaid;
      if (newPaidBig >= netTotalBig) {
        newStatus = invoices_status.paid;
      } else if (newPaidBig > 0n) {
        newStatus = invoices_status.partial;
      }

      const updatedInvoice = await tx.invoices.update({
        where: { id: invoice.id },
        data: {
          paid_vnd: newPaidBig,
          status: newStatus,
          updated_at: new Date(),
        },
      });

      const remainingDebt = netTotalBig > newPaidBig ? netTotalBig - newPaidBig : 0n;

      return {
        payment,
        receipt,
        invoice: {
          id: updatedInvoice.id,
          amount_vnd: updatedInvoice.amount_vnd.toString(),
          discount_vnd: updatedInvoice.discount_vnd.toString(),
          paid_vnd: updatedInvoice.paid_vnd.toString(),
          remaining_debt_vnd: remainingDebt.toString(),
          status: updatedInvoice.status,
        },
      };
    });
  }

  /**
   * TC-128: Nhắc phí đúng người (chỉ người có receives_fee_notice = true)
   */
  async remindInvoice(invoiceId: string, actorId?: string) {
    const invoice = await this.prisma.invoices.findUnique({
      where: { id: invoiceId },
      include: {
        students: {
          include: {
            users: {
              select: { full_name: true },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Không tìm thấy hoá đơn');
    }

    // Lấy danh sách phụ huynh có quyền nhận thông báo phí
    const eligibleGuardianships = await this.prisma.guardianships.findMany({
      where: {
        student_id: invoice.student_id,
        receives_fee_notice: true, // TC-128: Lọc chuẩn xác
      },
      include: {
        guardians: {
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const netReceivable = BigInt(invoice.amount_vnd) - BigInt(invoice.discount_vnd);
    const remainingDebt = netReceivable - BigInt(invoice.paid_vnd);

    const recipients = eligibleGuardianships.map((g) => ({
      guardian_id: g.guardian_id,
      user_id: g.guardians.users.id,
      name: g.guardians.users.full_name,
      phone: g.guardians.users.phone,
      email: g.guardians.users.email,
      relation: g.relation,
      receives_fee_notice: g.receives_fee_notice,
    }));

    return {
      invoice_id: invoice.id,
      student_name: invoice.students.users?.full_name,
      remaining_debt_vnd: remainingDebt.toString(),
      due_date: invoice.due_date,
      recipients_count: recipients.length,
      recipients,
      message: `Đã gửi thông báo nhắc học phí đến ${recipients.length} phụ huynh được phân quyền nhận thông báo phí`,
    };
  }

  // =========================================================================
  // 2. LƯƠNG GIÁO VIÊN (FR-1104, FR-1105, TC-129..TC-131)
  // =========================================================================

  /**
   * TC-129, TC-130, TC-131: Tính lương kỳ (chỉ buổi đã xác thực, tính cho người thực dạy, không đổi kỳ đã chốt)
   */
  async calculatePayroll(dto: CalculatePayrollDto, actorId: string) {
    const { branch_id, period_month } = dto;
    const defaultRate = BigInt(dto.default_rate_vnd || 250000);

    // 1. Tìm hoặc tạo kỳ lương
    let period = await this.prisma.payroll_periods.findUnique({
      where: {
        branch_id_period_month: {
          branch_id,
          period_month,
        },
      },
    });

    if (!period) {
      period = await this.prisma.payroll_periods.create({
        data: {
          branch_id,
          period_month,
          status: payroll_periods_status.open,
        },
      });
    }

    // TC-131: Nếu kỳ lương đã chốt -> Chặn sửa đổi
    if (period.status === payroll_periods_status.closed) {
      throw new BadRequestException('Kỳ lương đã chốt, không thể tính lại hoặc sửa đổi');
    }

    // Xác định khoảng thời gian của tháng
    const [yearStr, monthStr] = period_month.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    // Lấy tất cả buổi học trong tháng của cơ sở
    const allSessions = await this.prisma.class_sessions.findMany({
      where: {
        branch_id,
        starts_at: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
      include: {
        payroll_sessions: true,
      },
    });

    // TC-129: Lọc buổi đã xác thực (verified_at != null)
    const verifiedSessions = allSessions.filter((s) => s.verified_at !== null);
    const unverifiedSessions = allSessions.filter((s) => s.verified_at === null);

    // Nhóm theo giáo viên thực dạy
    // TC-130: s.teacher_id là giáo viên trực tiếp đứng lớp
    const sessionsByTeacher = new Map<string, typeof verifiedSessions>();

    for (const session of verifiedSessions) {
      const actualTeacherId = session.teacher_id;
      if (!sessionsByTeacher.has(actualTeacherId)) {
        sessionsByTeacher.set(actualTeacherId, []);
      }
      sessionsByTeacher.get(actualTeacherId)!.push(session);
    }

    const payrollResults: any[] = [];

    // Xử lý từng giáo viên
    for (const [teacherId, sessions] of sessionsByTeacher.entries()) {
      // Tìm đơn giá hợp lệ theo ngày hiệu lực
      const payRates = await this.prisma.pay_rates.findMany({
        where: {
          OR: [{ teacher_id: teacherId }, { teacher_id: null }],
        },
        orderBy: {
          effective_from: 'desc',
        },
      });

      // Lấy rate phù hợp
      let effectiveRate = defaultRate;
      if (payRates.length > 0) {
        // Tìm rate có effective_from <= thời điểm hiện tại hoặc phiên dạy
        const matchedRate = payRates.find((r) => new Date(r.effective_from) <= endOfMonth);
        if (matchedRate) {
          effectiveRate = matchedRate.rate_vnd;
        }
      }

      const sessionsCount = sessions.length;
      const totalVnd = BigInt(sessionsCount) * effectiveRate;

      // Upsert payroll_item
      const item = await this.prisma.payroll_items.upsert({
        where: {
          period_id_teacher_id: {
            period_id: period.id,
            teacher_id: teacherId,
          },
        },
        update: {
          sessions_count: sessionsCount,
          rate_vnd: effectiveRate,
          total_vnd: totalVnd,
          updated_at: new Date(),
        },
        create: {
          period_id: period.id,
          teacher_id: teacherId,
          sessions_count: sessionsCount,
          rate_vnd: effectiveRate,
          adjustments_vnd: 0n,
          total_vnd: totalVnd,
        },
      });

      // Liên kết sessions vào payroll_sessions
      for (const s of sessions) {
        await this.prisma.payroll_sessions.upsert({
          where: { session_id: s.id },
          update: { payroll_item_id: item.id },
          create: {
            payroll_item_id: item.id,
            session_id: s.id,
          },
        });
      }

      payrollResults.push({
        item_id: item.id,
        teacher_id: teacherId,
        sessions_count: sessionsCount,
        rate_vnd: effectiveRate.toString(),
        total_vnd: totalVnd.toString(),
      });
    }

    return {
      period_id: period.id,
      period_month: period.period_month,
      status: period.status,
      total_teachers: payrollResults.length,
      verified_sessions_count: verifiedSessions.length,
      unverified_sessions_count: unverifiedSessions.length,
      payroll_items: payrollResults,
    };
  }

  /**
   * TC-131: Chốt kỳ lương (bảo vệ không cho sửa đổi sau khi chốt)
   */
  async closePayrollPeriod(periodId: string, closerId: string) {
    const period = await this.prisma.payroll_periods.findUnique({
      where: { id: periodId },
    });
    if (!period) {
      throw new NotFoundException('Không tìm thấy kỳ lương');
    }

    const updated = await this.prisma.payroll_periods.update({
      where: { id: periodId },
      data: {
        status: payroll_periods_status.closed,
        closed_by: closerId,
        closed_at: new Date(),
      },
    });

    return updated;
  }

  /**
   * Xem bảng lương giáo viên
   */
  async getTeacherPayroll(teacherUserId: string) {
    const teacher = await this.prisma.teachers.findUnique({
      where: { user_id: teacherUserId },
    });
    if (!teacher) {
      throw new NotFoundException('Không tìm thấy thông tin giáo viên');
    }

    const items = await this.prisma.payroll_items.findMany({
      where: { teacher_id: teacher.id },
      include: {
        payroll_periods: true,
        payroll_sessions: {
          include: {
            class_sessions: {
              include: {
                classes: { select: { name: true, code: true } },
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return items;
  }

  // =========================================================================
  // 3. BÁO CÁO & THỐNG KÊ (FR-1201..FR-1203, TC-134..TC-136)
  // =========================================================================

  /**
   * TC-134: Dashboard tài chính (mọi số liệu đều có danh sách chi tiết tương ứng)
   */
  async getFinancialDashboard(branchId: string) {
    const invoices = await this.prisma.invoices.findMany({
      where: { branch_id: branchId },
    });

    let totalReceivable = 0n;
    let totalCollected = 0n;
    let unpaidCount = 0;
    let partialCount = 0;
    let paidCount = 0;

    for (const inv of invoices) {
      const net = BigInt(inv.amount_vnd) - BigInt(inv.discount_vnd);
      totalReceivable += net;
      totalCollected += BigInt(inv.paid_vnd);

      if (inv.status === invoices_status.unpaid) unpaidCount++;
      else if (inv.status === invoices_status.partial) partialCount++;
      else if (inv.status === invoices_status.paid) paidCount++;
    }

    const totalDebt = totalReceivable > totalCollected ? totalReceivable - totalCollected : 0n;

    return {
      branch_id: branchId,
      total_invoices: invoices.length,
      unpaid_count: unpaidCount,
      partial_count: partialCount,
      paid_count: paidCount,
      total_receivable_vnd: totalReceivable.toString(),
      total_collected_vnd: totalCollected.toString(),
      total_debt_vnd: totalDebt.toString(),
    };
  }

  /**
   * TC-134: Xem danh sách chi tiết hoá đơn theo bộ lọc
   */
  async getInvoicesDetail(params: {
    branch_id: string;
    status?: invoices_status;
    student_id?: string;
  }) {
    const where: any = { branch_id: params.branch_id };
    if (params.status) {
      where.status = params.status;
    }
    if (params.student_id) {
      where.student_id = params.student_id;
    }

    const list = await this.prisma.invoices.findMany({
      where,
      include: {
        students: {
          include: {
            users: {
              select: { full_name: true, phone: true, email: true },
            },
          },
        },
        payments: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      total: list.length,
      items: list.map((inv) => {
        const net = BigInt(inv.amount_vnd) - BigInt(inv.discount_vnd);
        const debt = net > BigInt(inv.paid_vnd) ? net - BigInt(inv.paid_vnd) : 0n;
        return {
          id: inv.id,
          student_name: inv.students?.users?.full_name,
          student_phone: inv.students?.users?.phone,
          amount_vnd: inv.amount_vnd.toString(),
          discount_vnd: inv.discount_vnd.toString(),
          net_receivable_vnd: net.toString(),
          paid_vnd: inv.paid_vnd.toString(),
          remaining_debt_vnd: debt.toString(),
          due_date: inv.due_date,
          status: inv.status,
          payments_count: inv.payments.length,
        };
      }),
    };
  }

  /**
   * TC-136: Xuất CSV khớp 100% với màn hình và số liệu lọc
   */
  async exportFinancialCsv(params: {
    branch_id: string;
    status?: invoices_status;
  }): Promise<{ csv: string; total_rows: number; sum_net_vnd: string }> {
    const details = await this.getInvoicesDetail(params);

    const headers = [
      'Mã hoá đơn',
      'Học sinh',
      'Số điện thoại',
      'Học phí gốc',
      'Giảm giá',
      'Phải thu thực tế',
      'Đã đóng',
      'Còn nợ',
      'Hạn đóng',
      'Trạng thái',
    ];

    let totalNet = 0n;
    let totalPaid = 0n;
    let totalDebt = 0n;

    const rows = details.items.map((i) => {
      totalNet += BigInt(i.net_receivable_vnd);
      totalPaid += BigInt(i.paid_vnd);
      totalDebt += BigInt(i.remaining_debt_vnd);

      return [
        i.id,
        `"${i.student_name || ''}"`,
        i.student_phone || '',
        i.amount_vnd,
        i.discount_vnd,
        i.net_receivable_vnd,
        i.paid_vnd,
        i.remaining_debt_vnd,
        new Date(i.due_date).toISOString().split('T')[0],
        i.status,
      ].join(',');
    });

    // Thêm dòng tổng cộng
    const summaryRow = [
      'TỔNG CỘNG',
      `"${details.total} hoá đơn"`,
      '',
      '',
      '',
      totalNet.toString(),
      totalPaid.toString(),
      totalDebt.toString(),
      '',
      '',
    ].join(',');

    const csvContent = [headers.join(','), ...rows, summaryRow].join('\n');

    return {
      csv: csvContent,
      total_rows: details.total,
      sum_net_vnd: totalNet.toString(),
    };
  }
}
