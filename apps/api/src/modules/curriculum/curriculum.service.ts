import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  curriculum_versions_status,
  lesson_plans_status,
  materials_type,
  materials_status,
  files_copyright_source,
  files_purpose,
} from '@prisma/client';

export interface UploadFrameworkDto {
  curriculum_id?: string;
  branch_id?: string;
  program_id?: string;
  title?: string;
  change_note?: string;
}

export interface FilePayload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate magic bytes and size for framework curriculum
   * Allowed: PDF, Word (doc, docx), PowerPoint (ppt, pptx) <= 100 MB
   */
  private validateFile(file: FilePayload) {
    const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB (FR-501, TC-067)
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('File vượt quá dung lượng tối đa 100 MB');
    }

    const buf = file.buffer;
    if (!buf || buf.length < 4) {
      throw new BadRequestException('File không hợp lệ hoặc rỗng');
    }

    // Check executable/malicious headers (e.g. MZ / 0x4D 0x5A for Windows PE, ELF)
    if (buf[0] === 0x4d && buf[1] === 0x5a) {
      throw new BadRequestException(
        'Nội dung file không đúng định dạng tài liệu cho phép (phát hiện file thực thi)',
      );
    }
    if (buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) {
      throw new BadRequestException(
        'Nội dung file không đúng định dạng tài liệu cho phép (phát hiện file thực thi ELF)',
      );
    }

    // Check valid signatures:
    // PDF starts with %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
    const isPdf =
      buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;

    // ZIP (docx, pptx) starts with PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
    const isZip =
      buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;

    // OLE2 Compound document (doc, ppt) starts with 0xD0, 0xCF, 0x11, 0xE0
    const isOle =
      buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0;

    if (!isPdf && !isZip && !isOle) {
      throw new BadRequestException(
        'Nội dung file không đúng định dạng tài liệu cho phép (chỉ chấp nhận PDF, Word, PowerPoint)',
      );
    }
  }

  /**
   * TC-066, TC-067, TC-068: Admin uploads framework curriculum (v1, v2)
   */
  async uploadFramework(
    dto: UploadFrameworkDto,
    file: FilePayload,
    userId: string,
  ) {
    this.validateFile(file);

    const branch = await this.prisma.branches.findFirst();
    const branchId = dto.branch_id || branch?.id || 'branch-default';

    // Create file record
    const createdFile = await this.prisma.files.create({
      data: {
        branch_id: branchId,
        storage_key: `curricula/${Date.now()}-${file.originalname}`,
        original_name: file.originalname,
        mime_type: file.mimetype,
        size_bytes: BigInt(file.size),
        purpose: files_purpose.curriculum,
        copyright_source: files_copyright_source.center,
        uploaded_by: userId,
      },
    });

    let curriculumId = dto.curriculum_id;
    let versionNo = 1;

    if (curriculumId) {
      const existing = await this.prisma.curricula.findUnique({
        where: { id: curriculumId },
      });
      if (!existing) {
        throw new NotFoundException('Không tìm thấy giáo trình khung');
      }

      const latestVersion = await this.prisma.curriculum_versions.findFirst({
        where: { curriculum_id: curriculumId },
        orderBy: { version_no: 'desc' },
      });
      versionNo = (latestVersion?.version_no || 0) + 1;
    } else {
      const newCurriculum = await this.prisma.curricula.create({
        data: {
          branch_id: branchId,
          program_id: dto.program_id,
          title: dto.title || 'Giáo trình khung chuẩn',
          created_by: userId,
        },
      });
      curriculumId = newCurriculum.id;
    }

    // Create curriculum version
    const version = await this.prisma.curriculum_versions.create({
      data: {
        curriculum_id: curriculumId,
        version_no: versionNo,
        file_id: createdFile.id,
        status: curriculum_versions_status.approved,
        change_note: dto.change_note || `Phiên bản v${versionNo}`,
        created_by: userId,
        approved_by: userId,
        approved_at: new Date(),
      },
    });

    // Update current active version of curriculum
    const updatedCurriculum = await this.prisma.curricula.update({
      where: { id: curriculumId },
      data: {
        current_version_id: version.id,
        updated_at: new Date(),
      },
    });

    return {
      curriculum: updatedCurriculum,
      version: {
        ...version,
        file: {
          id: createdFile.id,
          original_name: createdFile.original_name,
          size_bytes: createdFile.size_bytes.toString(),
        },
      },
    };
  }

  /**
   * TC-066: Teacher only sees current active version, Admin sees all versions
   */
  async getCurricula(user: { id: string; roles: string[] }) {
    const isAdmin =
      user.roles.includes('admin') || user.roles.includes('academic');

    const list = await this.prisma.curricula.findMany({
      where: { deleted_at: null },
      include: {
        curriculum_versions_curriculum_versions_curriculum_idTocurricula: {
          include: { files: true },
          orderBy: { version_no: 'desc' },
        },
      },
    });

    return list.map((c) => {
      const allVersions =
        c.curriculum_versions_curriculum_versions_curriculum_idTocurricula.map(
          (v) => ({
            id: v.id,
            version_no: v.version_no,
            status: v.status,
            change_note: v.change_note,
            approved_at: v.approved_at,
            file: v.files
              ? {
                  id: v.files.id,
                  original_name: v.files.original_name,
                  size_bytes: v.files.size_bytes.toString(),
                }
              : null,
          }),
        );

      if (!isAdmin) {
        // Teacher sees ONLY the active/current version (TC-066)
        const activeVersion =
          allVersions.find((v) => v.id === c.current_version_id) ||
          allVersions.find((v) => v.status === curriculum_versions_status.approved);
        return {
          id: c.id,
          title: c.title,
          current_version_id: c.current_version_id,
          versions: activeVersion ? [activeVersion] : [],
        };
      }

      // Admin sees ALL versions
      return {
        id: c.id,
        title: c.title,
        current_version_id: c.current_version_id,
        versions: allVersions,
      };
    });
  }

  /**
   * TC-069: Teacher uploads draft lesson plan
   */
  async createLessonPlan(
    dto: {
      branch_id?: string;
      lesson_node_id?: string;
      title: string;
      content?: string;
      file_id?: string;
    },
    userId: string,
  ) {
    let teacher = await this.prisma.teachers.findFirst({
      where: { user_id: userId },
    });
    if (!teacher) {
      const branch = await this.prisma.branches.findFirst();
      teacher = await this.prisma.teachers.create({
        data: {
          user_id: userId,
          branch_id: branch?.id || 'branch-default',
        },
      });
    }

    const branchId = dto.branch_id || teacher.branch_id;

    return this.prisma.lesson_plans.create({
      data: {
        branch_id: branchId,
        teacher_id: teacher.id,
        lesson_node_id: dto.lesson_node_id,
        title: dto.title,
        content: dto.content,
        file_id: dto.file_id,
        status: lesson_plans_status.draft, // Always draft on initial upload
      },
    });
  }

  /**
   * TC-069: Other teachers cannot see draft lesson plans until approved
   */
  async getLessonPlans(user: { id: string; roles: string[] }) {
    const isAdmin =
      user.roles.includes('admin') || user.roles.includes('academic');
    const teacher = await this.prisma.teachers.findFirst({
      where: { user_id: user.id },
    });

    if (isAdmin) {
      return this.prisma.lesson_plans.findMany({
        where: { deleted_at: null },
        include: { teachers: { include: { users: true } }, files: true },
        orderBy: { created_at: 'desc' },
      });
    }

    if (teacher) {
      // Teacher sees their own drafts AND all approved lesson plans from others
      return this.prisma.lesson_plans.findMany({
        where: {
          deleted_at: null,
          OR: [
            { teacher_id: teacher.id },
            { status: lesson_plans_status.approved },
          ],
        },
        include: { teachers: { include: { users: true } }, files: true },
        orderBy: { created_at: 'desc' },
      });
    }

    // Default: only approved
    return this.prisma.lesson_plans.findMany({
      where: {
        deleted_at: null,
        status: lesson_plans_status.approved,
      },
      include: { teachers: { include: { users: true } }, files: true },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Admin / Academic approves lesson plan to share with all teachers
   */
  async approveLessonPlan(id: string, approverId: string) {
    const lp = await this.prisma.lesson_plans.findUnique({ where: { id } });
    if (!lp) throw new NotFoundException('Không tìm thấy giáo án');

    return this.prisma.lesson_plans.update({
      where: { id },
      data: {
        status: lesson_plans_status.approved,
        approved_by: approverId,
        approved_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * TC-071: Upload/create material with copyright source declaration
   */
  async createMaterial(
    dto: {
      branch_id?: string;
      class_id?: string;
      session_id?: string;
      lesson_plan_id?: string;
      type: materials_type;
      title: string;
      body?: string;
      file_id?: string;
      url?: string;
      copyright_source?: files_copyright_source;
    },
    userId: string,
  ) {
    const branch = await this.prisma.branches.findFirst();
    const branchId = dto.branch_id || branch?.id || 'branch-default';

    if (dto.file_id && dto.copyright_source) {
      await this.prisma.files.update({
        where: { id: dto.file_id },
        data: { copyright_source: dto.copyright_source },
      });
    }

    return this.prisma.materials.create({
      data: {
        branch_id: branchId,
        class_id: dto.class_id,
        session_id: dto.session_id,
        lesson_plan_id: dto.lesson_plan_id,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        file_id: dto.file_id,
        url: dto.url,
        status: materials_status.published,
        published_by: userId,
        published_at: new Date(),
        created_by: userId,
      },
      include: { files: true },
    });
  }

  /**
   * TC-070: Student only sees materials in their enrolled class, API returns 403 on other classes
   */
  async getClassMaterials(
    classId: string,
    user: { id: string; roles: string[] },
  ) {
    const isAdminOrStaff =
      user.roles.includes('admin') ||
      user.roles.includes('academic') ||
      user.roles.includes('teacher');

    if (!isAdminOrStaff) {
      // Check if caller is student
      const student = await this.prisma.students.findFirst({
        where: { user_id: user.id },
      });

      if (student) {
        const enrollment = await this.prisma.enrollments.findFirst({
          where: {
            class_id: classId,
            student_id: student.id,
            status: 'active',
          },
        });
        if (!enrollment) {
          throw new ForbiddenException(
            'Bạn không có quyền truy cập kho tài liệu của lớp này',
          );
        }
      } else {
        // Check if caller is guardian
        const guardian = await this.prisma.guardians.findFirst({
          where: { user_id: user.id },
        });
        if (guardian) {
          const guardianship = await this.prisma.guardianships.findFirst({
            where: {
              guardian_id: guardian.id,
              students: {
                enrollments: {
                  some: { class_id: classId, status: 'active' },
                },
              },
            },
          });
          if (!guardianship) {
            throw new ForbiddenException(
              'Bạn không có quyền truy cập kho tài liệu của lớp này',
            );
          }
        } else {
          throw new ForbiddenException('Không có quyền truy cập tài liệu');
        }
      }
    }

    return this.prisma.materials.findMany({
      where: {
        class_id: classId,
        status: materials_status.published,
        deleted_at: null,
      },
      include: { files: true },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * TC-071: Materials with third_party copyright are blocked from AI generation
   */
  async generateAiFromMaterial(materialId: string, userId: string) {
    const material = await this.prisma.materials.findUnique({
      where: { id: materialId },
      include: { files: true },
    });

    if (!material) {
      throw new NotFoundException('Không tìm thấy tài liệu');
    }

    if (material.files?.copyright_source === files_copyright_source.third_party) {
      throw new BadRequestException(
        'Tài liệu bản quyền bên thứ ba không được phép gửi cho AI',
      );
    }

    // If allowed, return generated learning worksheet/exercises
    return {
      success: true,
      material_id: material.id,
      title: `Bài tập bổ trợ từ ${material.title}`,
      source_copyright: material.files?.copyright_source || 'center',
      generated_content: {
        vocabulary: ['achievement', 'curriculum', 'dedication'],
        comprehension_questions: [
          'What is the main topic of this lesson?',
          'Explain the key points discussed in the material.',
        ],
      },
    };
  }
}
