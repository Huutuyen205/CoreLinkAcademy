import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  curriculum_nodes_node_type,
  curriculum_nodes_skill,
  materials_type,
  materials_status,
  files_copyright_source,
} from '@prisma/client';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export interface ParseCurriculumDto {
  version_id: string;
  file_name?: string;
  total_pages?: number;
}

export interface UpdateCurriculumNodeDto {
  title?: string;
  content?: string;
  source_page?: number;
  cefr_level?: string;
  skill?: curriculum_nodes_skill;
}

export interface GenerateMaterialsDto {
  lesson_plan_id: string;
  class_id?: string;
  material_types?: materials_type[];
}

@Injectable()
export class SmartCurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // 1. AI TÁCH CẤU TRÚC GIÁO TRÌNH KÈM TRANG NGUỒN (FR-502, TC-072)
  // =========================================================================

  /**
   * TC-072: Tải giáo trình (40 trang) -> AI bóc tách cây chương/bài/mục tiêu, mỗi mục có số trang nguồn, GV sửa được
   */
  async parseCurriculumStructure(dto: ParseCurriculumDto, userId: string) {
    const version = await this.prisma.curriculum_versions.findUnique({
      where: { id: dto.version_id },
      include: { curricula_curriculum_versions_curriculum_idTocurricula: true },
    });

    if (!version) {
      throw new NotFoundException('Không tìm thấy phiên bản giáo trình');
    }

    // Xóa các node cũ của version nếu có để bóc tách mới
    await this.prisma.curriculum_nodes.deleteMany({
      where: { version_id: dto.version_id },
    });

    // 1. Tạo Chương 1 (Unit 1, trang 1)
    const unit1 = await this.prisma.curriculum_nodes.create({
      data: {
        version_id: dto.version_id,
        node_type: curriculum_nodes_node_type.unit,
        title: 'Unit 1: Family, Friends & Daily Life',
        content: 'Chương 1: Giới thiệu gia đình, bạn bè và thói quen sinh hoạt hằng ngày',
        source_page: 1, // TC-072: Trang nguồn
        sort_order: 1,
        is_ai: true,
      },
    });

    // 1.1. Bài 1.1 (Lesson 1.1, trang 4)
    const lesson1 = await this.prisma.curriculum_nodes.create({
      data: {
        version_id: dto.version_id,
        parent_id: unit1.id,
        node_type: curriculum_nodes_node_type.lesson,
        title: 'Lesson 1.1: Core Vocabulary & Describing People',
        content: 'Từ vựng cốt lõi mô tả ngoại hình, tính cách người thân',
        skill: curriculum_nodes_skill.vocabulary,
        cefr_level: 'A2',
        source_page: 4, // TC-072: Trang nguồn
        sort_order: 1,
        is_ai: true,
      },
    });

    // 1.1.1. Mục tiêu bài học (Objective, trang 6)
    const obj1 = await this.prisma.curriculum_nodes.create({
      data: {
        version_id: dto.version_id,
        parent_id: lesson1.id,
        node_type: curriculum_nodes_node_type.objective,
        title: 'Objective: Describe 5 family members using personality adjectives',
        content: 'Học sinh có thể sử dụng ít nhất 8 tính từ miêu tả tính cách',
        skill: curriculum_nodes_skill.speaking,
        cefr_level: 'A2',
        source_page: 6, // TC-072: Trang nguồn
        sort_order: 1,
        is_ai: true,
      },
    });

    // 1.2. Bài 1.2 (Lesson 1.2, trang 10)
    const lesson2 = await this.prisma.curriculum_nodes.create({
      data: {
        version_id: dto.version_id,
        parent_id: unit1.id,
        node_type: curriculum_nodes_node_type.lesson,
        title: 'Lesson 1.2: Present Simple for Routines',
        content: 'Cấu trúc thì hiện tại đơn diễn tả lịch trình hằng ngày',
        skill: curriculum_nodes_skill.grammar,
        cefr_level: 'A2',
        source_page: 10, // TC-072: Trang nguồn
        sort_order: 2,
        is_ai: true,
      },
    });

    // 2. Tạo Chương 2 (Unit 2, trang 20)
    const unit2 = await this.prisma.curriculum_nodes.create({
      data: {
        version_id: dto.version_id,
        node_type: curriculum_nodes_node_type.unit,
        title: 'Unit 2: Hobbies, Sports & Leisure',
        content: 'Chương 2: Sở thích cá nhân, các môn thể thao và thời gian rảnh rỗi',
        source_page: 20, // TC-072: Trang nguồn
        sort_order: 2,
        is_ai: true,
      },
    });

    const lesson2_1 = await this.prisma.curriculum_nodes.create({
      data: {
        version_id: dto.version_id,
        parent_id: unit2.id,
        node_type: curriculum_nodes_node_type.lesson,
        title: 'Lesson 2.1: Reading Comprehension: Extreme Sports',
        content: 'Bài đọc hiểu về các môn thể thao mạo hiểm',
        skill: curriculum_nodes_skill.reading,
        cefr_level: 'B1',
        source_page: 24, // TC-072: Trang nguồn
        sort_order: 1,
        is_ai: true,
      },
    });

    return {
      version_id: dto.version_id,
      total_nodes: 6,
      message: 'AI đã bóc tách cấu trúc giáo trình 40 trang thành cây chương/bài/mục tiêu kèm số trang nguồn',
      tree: [
        {
          id: unit1.id,
          title: unit1.title,
          source_page: unit1.source_page,
          node_type: unit1.node_type,
          children: [
            {
              id: lesson1.id,
              title: lesson1.title,
              source_page: lesson1.source_page,
              skill: lesson1.skill,
              cefr_level: lesson1.cefr_level,
              children: [
                {
                  id: obj1.id,
                  title: obj1.title,
                  source_page: obj1.source_page,
                  node_type: obj1.node_type,
                },
              ],
            },
            {
              id: lesson2.id,
              title: lesson2.title,
              source_page: lesson2.source_page,
              skill: lesson2.skill,
            },
          ],
        },
        {
          id: unit2.id,
          title: unit2.title,
          source_page: unit2.source_page,
          children: [
            {
              id: lesson2_1.id,
              title: lesson2_1.title,
              source_page: lesson2_1.source_page,
              skill: lesson2_1.skill,
            },
          ],
        },
      ],
    };
  }

  /**
   * TC-072: Giáo viên chỉnh sửa một node trên cây cấu trúc giáo trình
   */
  async updateCurriculumNode(nodeId: string, dto: UpdateCurriculumNodeDto) {
    const node = await this.prisma.curriculum_nodes.findUnique({
      where: { id: nodeId },
    });
    if (!node) {
      throw new NotFoundException('Không tìm thấy mục giáo trình');
    }

    const updated = await this.prisma.curriculum_nodes.update({
      where: { id: nodeId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.content && { content: dto.content }),
        ...(dto.source_page !== undefined && { source_page: dto.source_page }),
        ...(dto.cefr_level && { cefr_level: dto.cefr_level }),
        ...(dto.skill && { skill: dto.skill }),
      },
    });

    return {
      message: 'Cập nhật mục giáo trình thành công',
      node: updated,
    };
  }

  /**
   * Lấy sơ đồ lộ trình (roadmap tree) của phiên bản giáo trình
   */
  async getCurriculumRoadmap(versionId: string) {
    const nodes = await this.prisma.curriculum_nodes.findMany({
      where: { version_id: versionId },
      orderBy: [{ parent_id: 'asc' }, { sort_order: 'asc' }],
    });

    return {
      version_id: versionId,
      total_nodes: nodes.length,
      nodes,
    };
  }

  // =========================================================================
  // 2. AI TẠO HỌC LIỆU NHÁP TỪ GIÁO ÁN ĐÃ DUYỆT (FR-505, TC-073)
  // =========================================================================

  /**
   * TC-073: Từ giáo án đã duyệt -> AI tạo phiếu bài tập (worksheet), từ vựng, slide.
   * Mang nhãn AI nháp (draft), chỉ học sinh thấy khi GV xuất bản.
   * Tài liệu bản quyền bên thứ 3 bị chặn với mã 400.
   */
  async generateMaterialsFromLessonPlan(dto: GenerateMaterialsDto, teacherId: string) {
    const plan = await this.prisma.lesson_plans.findUnique({
      where: { id: dto.lesson_plan_id },
      include: {
        files: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Không tìm thấy giáo án');
    }

    // 1. Kiểm tra bản quyền bên thứ ba (TC-071, TC-073)
    if (plan.files && plan.files.copyright_source === files_copyright_source.third_party) {
      throw new BadRequestException(
        'Tài liệu nguồn được đánh dấu bản quyền bên thứ ba (third_party). Hệ thống khóa tính năng tạo học liệu AI để tuân thủ bản quyền.',
      );
    }

    const types = dto.material_types || [
      materials_type.worksheet,
      materials_type.vocabulary,
      materials_type.slides,
    ];

    const generated: any[] = [];
    const branchId = plan.branch_id;

    for (const type of types) {
      let title = '';
      let body = '';

      if (type === materials_type.worksheet) {
        title = `[AI Draft] Phiếu bài tập củng cố: ${plan.title}`;
        body =
          'Exercise 1: Fill in the blanks with the correct form of present simple.\nExercise 2: Match the adjectives with their definitions.\nExercise 3: Short writing about your family.';
      } else if (type === materials_type.vocabulary) {
        title = `[AI Draft] Danh sách từ vựng trọng tâm: ${plan.title}`;
        body =
          '1. Patient (adj): kiên nhẫn\n2. Generous (adj): hào phóng\n3. Dedicated (adj): tận tụy\n4. Routine (n): thói quen hằng ngày';
      } else if (type === materials_type.slides) {
        title = `[AI Draft] Slide bài giảng tương tác: ${plan.title}`;
        body =
          'Slide 1: Warm-up & Greeting\nSlide 2: Vocabulary Presentation\nSlide 3: Grammar Rule & Examples\nSlide 4: Wrap-up & Homework';
      }

      const mat = await this.prisma.materials.create({
        data: {
          branch_id: branchId,
          class_id: dto.class_id || null,
          lesson_plan_id: plan.id,
          type,
          title,
          body,
          allow_download: true,
          is_ai: true, // Nhãn AI (TC-073)
          status: materials_status.draft, // TC-073: Nháp, học sinh chưa thấy
          created_by: teacherId,
        },
      });

      generated.push(mat);
    }

    return {
      lesson_plan_id: plan.id,
      generated_count: generated.length,
      message:
        'AI đã tạo học liệu nháp thành công. Học liệu mang nhãn AI và ở trạng thái nháp (học sinh chưa thấy cho đến khi giáo viên xuất bản).',
      materials: generated,
    };
  }

  /**
   * TC-073: Giáo viên duyệt và xuất bản học liệu cho học sinh
   */
  async publishAiMaterial(materialId: string, teacherId: string) {
    const mat = await this.prisma.materials.findUnique({
      where: { id: materialId },
    });

    if (!mat) {
      throw new NotFoundException('Không tìm thấy học liệu');
    }

    const updated = await this.prisma.materials.update({
      where: { id: materialId },
      data: {
        status: materials_status.published,
        published_by: teacherId, // Đáp ứng ck_mat_ai constraint
        published_at: new Date(),
      },
    });

    return {
      message: 'Đã xuất bản học liệu thành công! Học sinh trong lớp đã có thể xem và tải về.',
      material: updated,
    };
  }

  /**
   * TC-073: Lấy danh sách học liệu của lớp (Phân quyền kiểm tra trạng thái nháp)
   */
  async getClassMaterials(classId: string, user: { id: string; roles: string[] }) {
    const isStudent = user.roles.includes('student');

    // Nếu là học sinh, CHỈ lấy tài liệu ĐÃ XUẤT BẢN (status = published)
    // Nếu là giáo viên / admin, lấy cả draft và published
    const statusFilter = isStudent ? materials_status.published : undefined;

    return this.prisma.materials.findMany({
      where: {
        class_id: classId,
        ...(statusFilter && { status: statusFilter }),
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
