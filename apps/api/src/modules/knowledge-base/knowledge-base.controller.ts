import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KnowledgeBaseService, CreateKbDocumentDto } from './knowledge-base.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ScopeGuard } from '../auth/guards/scope.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@corelink/shared';

@ApiTags('KnowledgeBase')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
@Controller('kb')
export class KnowledgeBaseController {
  constructor(private readonly kbService: KnowledgeBaseService) {}

  @Post('documents')
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC)
  @ApiOperation({ summary: 'Tạo tài liệu mới trong kho kiến thức (trạng thái draft) (AI-12)' })
  async createDocument(@Body() dto: CreateKbDocumentDto, @Req() req: any) {
    const actorId = req.user?.id;
    return this.kbService.createDocument(dto, actorId);
  }

  @Get('documents')
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC)
  @ApiOperation({ summary: 'Danh sách tài liệu trong kho kiến thức (AI-12)' })
  async findAll(@Query('status') status?: 'draft' | 'approved' | 'archived') {
    return this.kbService.findAllDocuments(status);
  }

  @Get('documents/:id')
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC)
  @ApiOperation({ summary: 'Chi tiết tài liệu và các đoạn chunk đã cắt (AI-12)' })
  async findOne(@Param('id') id: string) {
    return this.kbService.getDocumentById(id);
  }

  @Post('documents/:id/approve')
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC)
  @ApiOperation({ summary: 'Duyệt tài liệu: phân đoạn chunk & sinh vector embedding (TC-009)' })
  async approve(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user?.id;
    return this.kbService.approveDocument(id, actorId);
  }
}
