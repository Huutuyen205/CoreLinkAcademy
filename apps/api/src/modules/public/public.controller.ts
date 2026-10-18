import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { CreateLeadRequest, SubmitPlacementTestRequest } from '@corelink/shared';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('courses')
  @ApiOperation({ summary: 'Danh sách khóa học công khai theo cấp (FR-101)' })
  async getCourses() {
    return this.publicService.getCourses();
  }

  @Get('teachers')
  @ApiOperation({ summary: 'Danh sách giáo viên tiêu biểu (FR-101)' })
  async getTeachers() {
    return this.publicService.getTeachers();
  }

  @Get('info')
  @ApiOperation({ summary: 'Công khai thông tin đào tạo theo TT 29/2024 (FR-101)' })
  async getPublicInfo() {
    return this.publicService.getPublicInfo();
  }

  @Post('leads')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký học thử / tư vấn (FR-102)' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 400, description: 'SĐT sai định dạng hoặc chưa tick đồng ý dữ liệu' })
  async createLead(@Body() body: CreateLeadRequest) {
    return this.publicService.createLead(body);
  }

  @Get('placement-tests/:token')
  @ApiOperation({ summary: 'Lấy đề bài kiểm tra đầu vào theo link token (FR-104)' })
  async getPlacementTest(@Param('token') token: string) {
    return this.publicService.getPlacementTest(token);
  }

  @Post('placement-tests/:token/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Nộp bài test đầu vào online, chấm tự động trắc nghiệm ngay (FR-104)' })
  async submitPlacementTest(
    @Param('token') token: string,
    @Body() body: SubmitPlacementTestRequest,
  ) {
    return this.publicService.submitPlacementTest(token, body);
  }

  @Get('referrals/:code')
  @ApiOperation({ summary: 'Kiểm tra mã giới thiệu của phụ huynh (FR-107)' })
  async checkReferral(@Param('code') code: string) {
    return this.publicService.checkReferral(code);
  }

  @Get('blog')
  @ApiOperation({ summary: 'Danh sách bài viết Blog & Mẹo thi tiếng Anh (FR-PUB-05)' })
  async getBlogPosts() {
    return this.publicService.getBlogPosts();
  }

  @Get('blog/:slug')
  @ApiOperation({ summary: 'Chi tiết bài viết Blog (FR-PUB-05)' })
  async getBlogPostBySlug(@Param('slug') slug: string) {
    return this.publicService.getBlogPostBySlug(slug);
  }

  @Get('placement-tests/quick/sample')
  @ApiOperation({ summary: 'Đề kiểm tra nhanh 3 phút chẩn đoán tại trang chủ (FR-PUB-02)' })
  async getQuickPlacementSample() {
    return this.publicService.getQuickPlacementSample();
  }
}
