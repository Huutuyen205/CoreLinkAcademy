import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import {
  FinanceService,
  CreateInvoiceDto,
  RecordPaymentDto,
  CalculatePayrollDto,
} from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@corelink/shared';
import { invoices_status } from '@prisma/client';
import { Response } from 'express';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // =========================================================================
  // 1. INVOICES & PAYMENTS (TC-125..TC-128)
  // =========================================================================

  /**
   * TC-125: Tạo khoản phải thu có chiết khấu
   */
  @Post('invoices')
  @Roles(RoleCode.ADMIN, RoleCode.ACCOUNTANT)
  async createInvoice(@Req() req: any, @Body() body: CreateInvoiceDto) {
    return this.financeService.createInvoice(body, req.user.id);
  }

  /**
   * TC-126, TC-127: Ghi nhận thanh toán và cấp số biên nhận không trùng
   */
  @Post('payments')
  @Roles(RoleCode.ADMIN, RoleCode.ACCOUNTANT)
  async recordPayment(@Req() req: any, @Body() body: RecordPaymentDto) {
    return this.financeService.recordPayment(body, req.user.id);
  }

  /**
   * TC-128: Nhắc phí đúng người có receives_fee_notice = true
   */
  @Post('invoices/:id/remind')
  @Roles(RoleCode.ADMIN, RoleCode.ACCOUNTANT)
  async remindInvoice(@Req() req: any, @Param('id') invoiceId: string) {
    return this.financeService.remindInvoice(invoiceId, req.user.id);
  }

  // =========================================================================
  // 2. PAYROLL (TC-129..TC-131)
  // =========================================================================

  /**
   * TC-129, TC-130: Tính lương giáo viên cho kỳ
   */
  @Post('payroll/calculate')
  @Roles(RoleCode.ADMIN, RoleCode.ACCOUNTANT)
  async calculatePayroll(@Req() req: any, @Body() body: CalculatePayrollDto) {
    return this.financeService.calculatePayroll(body, req.user.id);
  }

  /**
   * TC-131: Chốt kỳ lương (bảo vệ chống sửa đổi)
   */
  @Post('payroll/periods/:id/close')
  @Roles(RoleCode.ADMIN, RoleCode.ACCOUNTANT)
  async closePayrollPeriod(@Req() req: any, @Param('id') periodId: string) {
    return this.financeService.closePayrollPeriod(periodId, req.user.id);
  }

  /**
   * Giáo viên tự xem lịch sử lương của mình
   */
  @Get('payroll/my-payroll')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN)
  async getMyPayroll(@Req() req: any) {
    return this.financeService.getTeacherPayroll(req.user.id);
  }

  // =========================================================================
  // 3. REPORTS (TC-134..TC-136)
  // =========================================================================

  /**
   * TC-134, TC-135: Dashboard tài chính (Tư vấn viên bị 403 Forbidden)
   */
  @Get('reports/dashboard')
  @Roles(RoleCode.ADMIN, RoleCode.ACCOUNTANT)
  async getFinancialDashboard(@Query('branch_id') branchId: string) {
    return this.financeService.getFinancialDashboard(branchId);
  }

  /**
   * TC-134, TC-135: Xem chi tiết hoá đơn theo bộ lọc
   */
  @Get('reports/invoices-detail')
  @Roles(RoleCode.ADMIN, RoleCode.ACCOUNTANT)
  async getInvoicesDetail(
    @Query('branch_id') branchId: string,
    @Query('status') status?: invoices_status,
    @Query('student_id') studentId?: string,
  ) {
    return this.financeService.getInvoicesDetail({
      branch_id: branchId,
      status,
      student_id: studentId,
    });
  }

  /**
   * TC-136: Xuất CSV báo cáo khớp 100%
   */
  @Get('reports/export-csv')
  @Roles(RoleCode.ADMIN, RoleCode.ACCOUNTANT)
  async exportFinancialCsv(
    @Query('branch_id') branchId: string,
    @Query('status') status: invoices_status | undefined,
    @Res() res: Response,
  ) {
    const result = await this.financeService.exportFinancialCsv({
      branch_id: branchId,
      status,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="financial-report-${Date.now()}.csv"`,
    );
    res.setHeader('X-Total-Rows', result.total_rows.toString());
    res.setHeader('X-Sum-Net-VND', result.sum_net_vnd);
    return res.send(result.csv);
  }
}
