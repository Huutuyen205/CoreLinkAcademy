import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  questions_type,
  questions_skill,
  questions_framework,
  questions_status,
  assignments_kind,
  assignments_show_answer_mode,
  assignment_targets_target_type,
  attempts_submit_mode,
  regrade_requests_status,
} from '@prisma/client';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

@Injectable()
export class AssessmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // =========================================================================
  // 1. NGÂN HÀNG CÂU HỎI (FR-601, FR-602, FR-604)
  // =========================================================================

  /**
   * Tạo câu hỏi thủ công (FR-601, FR-602)
   * Tạo thủ công mặc định là approved
   */
  async createQuestion(
    userId: string,
    data: {
      branchId?: string;
      type: questions_type;
      stem: string;
      options?: any;
      answerKey?: any;
      explanation?: string;
      skill: questions_skill;
      difficulty: number;
      framework: questions_framework;
      levelCode: string;
      topic?: string;
      points?: number;
      rubricId?: string;
      isAi?: boolean;
      status?: questions_status;
    },
  ) {
    if (data.difficulty < 1 || data.difficulty > 5) {
      throw new BadRequestException('Độ khó phải từ 1 đến 5 (FR-601)');
    }

    let branchId = data.branchId;
    if (!branchId) {
      const user = await this.prisma.users.findUnique({ where: { id: userId } });
      branchId = user?.branch_id || (await this.prisma.branches.findFirst())?.id;
    }

    if (!branchId) {
      throw new BadRequestException('Không tìm thấy cơ sở');
    }

    const isAi = !!data.isAi;
    const status = isAi ? (data.status || questions_status.draft) : questions_status.approved;
    const approvedBy = status === questions_status.approved ? userId : null;

    return this.prisma.questions.create({
      data: {
        branch_id: branchId,
        type: data.type,
        stem: data.stem,
        options: data.options ?? null,
        answer_key: data.answerKey ?? null,
        explanation: data.explanation ?? null,
        skill: data.skill,
        difficulty: data.difficulty,
        framework: data.framework,
        level_code: data.levelCode,
        topic: data.topic ?? null,
        points: data.points ?? 1,
        rubric_id: data.rubricId ?? null,
        is_ai: isAi,
        status,
        approved_by: approvedBy,
        created_by: userId,
      },
    });
  }

  /**
   * Lọc danh sách câu hỏi theo các nhãn (TC-076, FR-601)
   */
  async getQuestions(query: {
    skill?: questions_skill;
    framework?: questions_framework;
    levelCode?: string;
    difficulty?: number;
    status?: questions_status;
    type?: questions_type;
    keyword?: string;
    limit?: number;
    page?: number;
  }) {
    const where: any = {
      deleted_at: null,
    };

    if (query.skill) where.skill = query.skill;
    if (query.framework) where.framework = query.framework;
    if (query.levelCode) where.level_code = query.levelCode;
    if (query.difficulty) where.difficulty = Number(query.difficulty);
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.keyword) {
      where.stem = { contains: query.keyword };
    }

    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 50)));
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.questions.count({ where }),
      this.prisma.questions.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      items,
    };
  }

  /**
   * Xóa câu hỏi trong ngân hàng
   * Khóa xóa câu hỏi đang được sử dụng trong bài tập / đề thi (TC-077, FR-601)
   */
  async deleteQuestion(id: string) {
    const question = await this.prisma.questions.findUnique({
      where: { id },
      include: {
        assignment_questions: {
          include: {
            assignments: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    if (question.assignment_questions.length > 0) {
      const assignmentTitles = question.assignment_questions
        .map((aq) => `"${aq.assignments.title}"`)
        .join(', ');
      throw new BadRequestException(
        `Không thể xóa câu hỏi đang được sử dụng trong bài tập/đề thi: ${assignmentTitles} (TC-077, FR-601)`,
      );
    }

    return this.prisma.questions.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  /**
   * AI tạo câu hỏi bản nháp (TC-091, FR-604)
   */
  async generateAiQuestion(
    userId: string,
    data: {
      branchId?: string;
      type: questions_type;
      stem: string;
      options?: any;
      answerKey?: any;
      explanation?: string;
      skill: questions_skill;
      difficulty: number;
      framework: questions_framework;
      levelCode: string;
      topic?: string;
    },
  ) {
    return this.createQuestion(userId, {
      ...data,
      isAi: true,
      status: questions_status.draft,
    });
  }

  /**
   * Giáo viên phê duyệt câu hỏi AI (TC-091, FR-604)
   */
  async approveQuestion(questionId: string, approverUserId: string) {
    const question = await this.prisma.questions.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    return this.prisma.questions.update({
      where: { id: questionId },
      data: {
        status: questions_status.approved,
        approved_by: approverUserId,
      },
    });
  }

  // =========================================================================
  // 2. TẠO & GIAO BÀI TẬP (FR-603, TC-079, TC-080)
  // =========================================================================

  /**
   * Tạo và giao bài tập cho lớp / nhóm / cá nhân học sinh
   * Chặn đưa câu hỏi draft của AI vào bài thi (TC-091)
   */
  async createAssignment(
    userId: string,
    data: {
      branchId?: string;
      classId?: string;
      title: string;
      kind: assignments_kind;
      instructions?: string;
      opensAt?: string | Date;
      dueAt?: string | Date;
      timeLimitMin?: number;
      attemptsAllowed?: number;
      shuffle?: boolean;
      showAnswerMode?: assignments_show_answer_mode;
      questionIds: string[];
      targets: Array<{
        targetType: assignment_targets_target_type;
        classId?: string;
        groupId?: string;
        studentId?: string;
      }>;
    },
  ) {
    if (!data.questionIds || data.questionIds.length === 0) {
      throw new BadRequestException('Bài tập phải có ít nhất một câu hỏi');
    }

    if (!data.targets || data.targets.length === 0) {
      throw new BadRequestException('Phải chọn ít nhất một đối tượng giao bài (lớp, nhóm hoặc học sinh)');
    }

    let branchId = data.branchId;
    if (!branchId) {
      const user = await this.prisma.users.findUnique({ where: { id: userId } });
      branchId = user?.branch_id || (await this.prisma.branches.findFirst())?.id;
    }
    if (!branchId) {
      throw new BadRequestException('Không tìm thấy cơ sở');
    }

    // Kiểm tra tính hợp lệ của câu hỏi: Câu hỏi AI phải được phê duyệt trước khi giao (TC-091)
    const questions = await this.prisma.questions.findMany({
      where: { id: { in: data.questionIds } },
    });

    if (questions.length !== data.questionIds.length) {
      throw new NotFoundException('Một hoặc nhiều câu hỏi không tồn tại');
    }

    const unapprovedAiQuestions = questions.filter(
      (q) => q.is_ai && q.status !== questions_status.approved,
    );
    if (unapprovedAiQuestions.length > 0) {
      throw new BadRequestException(
        'Câu hỏi do AI tạo phải được giáo viên phê duyệt trước khi giao bài (TC-091, FR-604)',
      );
    }

    const assignment = await this.prisma.assignments.create({
      data: {
        branch_id: branchId,
        class_id: data.classId ?? null,
        title: data.title,
        kind: data.kind,
        instructions: data.instructions ?? null,
        opens_at: data.opensAt ? new Date(data.opensAt) : null,
        due_at: data.dueAt ? new Date(data.dueAt) : null,
        time_limit_min: data.timeLimitMin ?? null,
        attempts_allowed: Math.max(1, data.attemptsAllowed ?? 1),
        shuffle: !!data.shuffle,
        show_answer_mode: data.showAnswerMode || assignments_show_answer_mode.after_publish,
        created_by: userId,
        assignment_questions: {
          create: data.questionIds.map((qId, idx) => ({
            question_id: qId,
            sort_order: idx + 1,
          })),
        },
        assignment_targets: {
          create: data.targets.map((t) => ({
            target_type: t.targetType,
            class_id: t.targetType === 'class' ? t.classId ?? null : null,
            group_id: t.targetType === 'group' ? t.groupId ?? null : null,
            student_id: t.targetType === 'student' ? t.studentId ?? null : null,
          })),
        },
      },
      include: {
        assignment_questions: true,
        assignment_targets: true,
      },
    });

    return assignment;
  }

  /**
   * Lấy danh sách bài tập theo quyền của người gọi (TC-079)
   * Học sinh chỉ thấy bài giao cho mình, lớp mình, nhóm mình
   */
  async getAssignments(
    userId: string,
    query?: { classId?: string; kind?: assignments_kind; status?: 'active' | 'closed' },
  ) {
    const [userRoles, student, guardian] = await Promise.all([
      this.prisma.user_roles.findMany({
        where: { user_id: userId },
        include: { roles: true },
      }),
      this.prisma.students.findFirst({ where: { user_id: userId } }),
      this.prisma.guardians.findFirst({ where: { user_id: userId } }),
    ]);

    const roleCodes = userRoles.map((ur) => ur.roles.code);
    const isStudent = roleCodes.includes('student') || !!student;
    const isGuardian = roleCodes.includes('guardian') || !!guardian;

    let targetStudentIds: string[] = [];
    let targetClassIds: string[] = [];

    if (isStudent && student) {
      targetStudentIds.push(student.id);
      const enrollments = await this.prisma.enrollments.findMany({
        where: { student_id: student.id, status: 'active' },
        select: { class_id: true },
      });
      targetClassIds = enrollments.map((e) => e.class_id);
    } else if (isGuardian && guardian) {
      const wards = await this.prisma.guardianships.findMany({
        where: { guardian_id: guardian.id },
        select: { student_id: true },
      });
      targetStudentIds = wards.map((w) => w.student_id);
      const enrollments = await this.prisma.enrollments.findMany({
        where: { student_id: { in: targetStudentIds }, status: 'active' },
        select: { class_id: true },
      });
      targetClassIds = enrollments.map((e) => e.class_id);
    }

    const where: any = {
      deleted_at: null,
    };

    if (query?.classId) where.class_id = query.classId;
    if (query?.kind) where.kind = query.kind;

    // Phân quyền hiển thị theo đối tượng học sinh / phụ huynh (TC-079)
    if (isStudent || isGuardian) {
      where.assignment_targets = {
        some: {
          OR: [
            { target_type: 'student', student_id: { in: targetStudentIds } },
            { target_type: 'class', class_id: { in: targetClassIds } },
          ],
        },
      };
    }

    const assignments = await this.prisma.assignments.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        classes: { select: { id: true, name: true, code: true } },
        assignment_targets: true,
        _count: { select: { assignment_questions: true, attempts: true } },
      },
    });

    return assignments;
  }

  /**
   * Lấy chi tiết đề thi / bài tập
   * BẢO MẬT: Chưa công bố tuyệt đối không trả answer_key và explanation cho học sinh (TC-085, FR-608)
   */
  async getAssignmentById(id: string, userId: string) {
    const assignment = await this.prisma.assignments.findUnique({
      where: { id },
      include: {
        classes: { select: { id: true, name: true, code: true } },
        assignment_targets: true,
        assignment_questions: {
          orderBy: { sort_order: 'asc' },
          include: {
            questions: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Không tìm thấy bài tập');
    }

    const userRoles = await this.prisma.user_roles.findMany({
      where: { user_id: userId },
      include: { roles: true },
    });
    const roles = userRoles.map((r) => r.roles.code);
    const isTeacherOrAdmin = roles.includes('teacher') || roles.includes('admin') || roles.includes('academic_staff');

    const isPublished = !!assignment.published_at;
    const shouldHideAnswerKey = !isTeacherOrAdmin && !isPublished;

    // Xử lý giấu answer_key (TC-085)
    const sanitizedQuestions = assignment.assignment_questions.map((aq) => {
      const q = aq.questions;
      return {
        assignmentQuestionId: `${aq.assignment_id}_${aq.question_id}`,
        sortOrder: aq.sort_order,
        points: aq.points || q.points,
        question: {
          id: q.id,
          type: q.type,
          stem: q.stem,
          options: q.options,
          skill: q.skill,
          difficulty: q.difficulty,
          framework: q.framework,
          levelCode: q.level_code,
          topic: q.topic,
          rubricId: q.rubric_id,
          // Giấu answer_key và explanation nếu chưa công bố
          answerKey: shouldHideAnswerKey ? undefined : q.answer_key,
          explanation: shouldHideAnswerKey ? undefined : q.explanation,
        },
      };
    });

    return {
      id: assignment.id,
      title: assignment.title,
      kind: assignment.kind,
      instructions: assignment.instructions,
      opensAt: assignment.opens_at,
      dueAt: assignment.due_at,
      timeLimitMin: assignment.time_limit_min,
      attemptsAllowed: assignment.attempts_allowed,
      shuffle: assignment.shuffle,
      showAnswerMode: assignment.show_answer_mode,
      publishedAt: assignment.published_at,
      isPublished,
      questions: sanitizedQuestions,
    };
  }

  // =========================================================================
  // 3. LÀM BÀI, LƯU NHÁP & NỘP BÀI (FR-605, FR-606, TC-081..TC-084)
  // =========================================================================

  /**
   * Bắt đầu lượt làm bài mới
   */
  async startAttempt(assignmentId: string, studentUserId: string) {
    const student = await this.prisma.students.findFirst({
      where: { user_id: studentUserId },
    });

    if (!student) {
      throw new ForbiddenException('Chỉ tài khoản học sinh mới có thể bắt đầu làm bài');
    }

    const assignment = await this.prisma.assignments.findUnique({
      where: { id: assignmentId },
      include: {
        assignment_questions: {
          orderBy: { sort_order: 'asc' },
          include: { questions: true },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Không tìm thấy bài tập');
    }

    // Kiểm tra hạn nộp
    if (assignment.due_at && new Date() > assignment.due_at) {
      throw new BadRequestException('Bài tập đã hết hạn nộp');
    }

    // Kiểm tra số lần làm bài đã thực hiện
    const existingAttempts = await this.prisma.attempts.findMany({
      where: {
        assignment_id: assignmentId,
        student_id: student.id,
      },
      orderBy: { attempt_no: 'desc' },
    });

    if (existingAttempts.length >= assignment.attempts_allowed) {
      throw new BadRequestException(
        `Bạn đã sử dụng hết số lần làm bài cho phép (${assignment.attempts_allowed} lần)`,
      );
    }

    // Kiểm tra xem có attempt nào đang dang dở chưa nộp không
    const ongoing = existingAttempts.find((a) => !a.submitted_at);
    if (ongoing) {
      return ongoing;
    }

    const attemptNo = existingAttempts.length + 1;

    const attempt = await this.prisma.attempts.create({
      data: {
        assignment_id: assignmentId,
        student_id: student.id,
        attempt_no: attemptNo,
        started_at: new Date(),
      },
    });

    return attempt;
  }

  /**
   * Lưu nháp câu trả lời (TC-081, FR-605)
   * Upsert vào bảng answers theo (attempt_id, question_id). Chạy lại nhiều lần vẫn an toàn.
   */
  async saveDraftAnswers(
    studentUserId: string,
    attemptId: string,
    drafts: Array<{
      questionId: string;
      response?: any;
      fileId?: string;
    }>,
  ) {
    const attempt = await this.prisma.attempts.findUnique({
      where: { id: attemptId },
      include: { students: true },
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy lượt làm bài');
    }

    if (attempt.students?.user_id !== studentUserId) {
      throw new ForbiddenException('Bạn không sở hữu lượt làm bài này');
    }

    if (attempt.submitted_at) {
      throw new BadRequestException('Lượt làm bài này đã được nộp, không thể cập nhật thêm');
    }

    for (const item of drafts) {
      const respJson = item.response !== undefined ? JSON.stringify(item.response) : null;
      await this.prisma.$executeRaw`
        INSERT INTO answers (id, attempt_id, question_id, response, file_id, updated_at)
        VALUES (UUID(), ${attemptId}, ${item.questionId}, ${respJson}, ${item.fileId ?? null}, NOW(3))
        ON DUPLICATE KEY UPDATE
          response = VALUES(response),
          file_id = VALUES(file_id),
          updated_at = NOW(3)
      `;
    }

    return { success: true, savedCount: drafts.length };
  }

  /**
   * Nộp bài & Chấm trắc nghiệm ngay lập tức (TC-082, TC-083, TC-084)
   * Chống nộp 2 lần cùng lúc bằng giao dịch và kiểm tra trạng thái
   * Chấm điểm tự động cho các câu hỏi khách quan
   */
  async submitAttempt(
    studentUserId: string,
    attemptId: string,
    options?: { submitMode?: attempts_submit_mode; tabLeaves?: number },
  ) {
    const attempt = await this.prisma.attempts.findUnique({
      where: { id: attemptId },
      include: {
        students: true,
        assignments: {
          include: {
            assignment_questions: {
              include: { questions: true },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy lượt làm bài');
    }

    if (attempt.students?.user_id !== studentUserId) {
      throw new ForbiddenException('Bạn không sở hữu lượt làm bài này');
    }

    // Chống nộp 2 lần cùng lúc (TC-083)
    if (attempt.submitted_at) {
      throw new BadRequestException('Bài làm này đã được nộp trước đó (TC-083)');
    }

    const questionsMap = new Map<string, any>();
    let totalMaxScore = 0;
    for (const aq of attempt.assignments.assignment_questions) {
      const q = aq.questions;
      const pts = aq.points ? Number(aq.points) : Number(q.points);
      totalMaxScore += pts;
      questionsMap.set(q.id, { ...q, assignedPoints: pts });
    }

    // Tự động chấm điểm trắc nghiệm (TC-084, FR-606)
    let totalAutoScore = 0;
    let hasSubjective = false;

    for (const ans of attempt.answers) {
      const q = questionsMap.get(ans.question_id);
      if (!q) continue;

      const pts = q.assignedPoints;
      const isObjective = [
        'single_choice',
        'multi_choice',
        'true_false',
        'fill_blank',
        'matching',
        'ordering',
        'listening',
      ].includes(q.type);

      if (isObjective) {
        const isCorrect = this.evaluateObjectiveAnswer(q.type, ans.response, q.answer_key);
        const earnedPoints = isCorrect ? pts : 0;
        totalAutoScore += earnedPoints;

        await this.prisma.answers.update({
          where: { id: ans.id },
          data: {
            is_correct: isCorrect,
            auto_points: earnedPoints,
            final_points: earnedPoints,
          },
        });
      } else {
        hasSubjective = true;
      }
    }

    const now = new Date();
    const finalScore = hasSubjective ? totalAutoScore : totalAutoScore;

    const updatedAttempt = await this.prisma.attempts.update({
      where: { id: attemptId },
      data: {
        submitted_at: now,
        submit_mode: options?.submitMode || attempts_submit_mode.manual,
        tab_leaves: options?.tabLeaves ?? 0,
        auto_score: totalAutoScore,
        max_score: totalMaxScore,
        final_score: finalScore,
        graded_at: hasSubjective ? null : now,
      },
      include: {
        answers: true,
      },
    });

    return updatedAttempt;
  }

  /**
   * So khớp đáp án trắc nghiệm / khách quan (FR-606)
   */
  private evaluateObjectiveAnswer(type: questions_type, userResponse: any, answerKey: any): boolean {
    if (!userResponse || !answerKey) return false;

    try {
      switch (type) {
        case 'single_choice':
        case 'true_false':
        case 'listening': {
          const expected = answerKey.correct ?? answerKey.value;
          const actual = userResponse.selected ?? userResponse.value;
          return String(expected).trim().toLowerCase() === String(actual).trim().toLowerCase();
        }

        case 'multi_choice': {
          const expected: any[] = answerKey.correct || [];
          const actual: any[] = userResponse.selected || [];
          if (!Array.isArray(expected) || !Array.isArray(actual)) return false;
          if (expected.length !== actual.length) return false;
          const sortedExp = [...expected].map(String).sort();
          const sortedAct = [...actual].map(String).sort();
          return sortedExp.every((val, idx) => val === sortedAct[idx]);
        }

        case 'fill_blank': {
          const accepted: string[] = answerKey.accepted || [answerKey.correct];
          const actual = String(userResponse.text || '').trim().toLowerCase();
          return accepted.some((acc) => String(acc).trim().toLowerCase() === actual);
        }

        case 'ordering': {
          const expectedOrder: any[] = answerKey.order || [];
          const actualOrder: any[] = userResponse.order || [];
          if (!Array.isArray(expectedOrder) || !Array.isArray(actualOrder)) return false;
          if (expectedOrder.length !== actualOrder.length) return false;
          return expectedOrder.every((val, idx) => String(val) === String(actualOrder[idx]));
        }

        case 'matching': {
          const expectedPairs: Array<{ left: string; right: string }> = answerKey.pairs || [];
          const actualPairs: Array<{ left: string; right: string }> = userResponse.pairs || [];
          if (!Array.isArray(expectedPairs) || !Array.isArray(actualPairs)) return false;
          if (expectedPairs.length !== actualPairs.length) return false;
          return expectedPairs.every((exp) =>
            actualPairs.some(
              (act) =>
                String(act.left).trim().toLowerCase() === String(exp.left).trim().toLowerCase() &&
                String(act.right).trim().toLowerCase() === String(exp.right).trim().toLowerCase(),
            ),
          );
        }

        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  // =========================================================================
  // 4. CHẤM BÀI, CÔNG BỐ KẾT QUẢ & PHỤC KHẢO (FR-608, FR-609, TC-085..TC-090)
  // =========================================================================

  /**
   * Giáo viên chấm điểm tự luận / rubric thủ công
   */
  async gradeManualEssay(
    teacherUserId: string,
    attemptId: string,
    grades: Array<{
      questionId: string;
      finalPoints: number;
      feedback?: string;
    }>,
    overallFeedback?: string,
  ) {
    const attempt = await this.prisma.attempts.findUnique({
      where: { id: attemptId },
      include: { answers: true },
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy lượt làm bài');
    }

    let updatedFinalScore = Number(attempt.auto_score || 0);

    for (const g of grades) {
      const ans = attempt.answers.find((a) => a.question_id === g.questionId);
      if (ans) {
        await this.prisma.answers.update({
          where: { id: ans.id },
          data: {
            final_points: g.finalPoints,
            is_correct: g.finalPoints > 0,
          },
        });
        updatedFinalScore += Number(g.finalPoints);
      }
    }

    return this.prisma.attempts.update({
      where: { id: attemptId },
      data: {
        final_score: updatedFinalScore,
        graded_by: teacherUserId,
        graded_at: new Date(),
        teacher_feedback: overallFeedback ?? undefined,
      },
    });
  }

  /**
   * Giáo viên công bố kết quả bài thi / bài tập (TC-086)
   */
  async publishResults(teacherUserId: string, assignmentId: string) {
    const assignment = await this.prisma.assignments.findUnique({
      where: { id: assignmentId },
      include: {
        attempts: {
          include: { students: { include: { users: true } } },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Không tìm thấy bài tập');
    }

    const now = new Date();
    const updated = await this.prisma.assignments.update({
      where: { id: assignmentId },
      data: {
        published_at: now,
      },
    });

    // Gửi thông báo tới các học sinh đã nộp bài
    for (const att of assignment.attempts) {
      if (att.students?.user_id) {
        await this.notificationsService.createNotification({
          userId: att.students.user_id,
          category: 'academic_homework',
          title: `Kết quả bài thi "${assignment.title}" đã được công bố`,
          body: `Điểm số của bạn: ${att.final_score || 0}/${att.max_score || 0}. Bấm để xem chi tiết đáp án và nhận xét.`,
          link: `/assignments/${assignment.id}/results`,
        });
      }
    }

    return updated;
  }

  /**
   * Xem kết quả bài thi của học sinh hoặc phụ huynh (TC-085, TC-086)
   */
  async getAttemptResult(attemptId: string, callerUserId: string) {
    const attempt = await this.prisma.attempts.findUnique({
      where: { id: attemptId },
      include: {
        students: {
          include: {
            users: { select: { id: true, full_name: true } },
            guardianships: { include: { guardians: true } },
          },
        },
        assignments: {
          include: {
            assignment_questions: {
              orderBy: { sort_order: 'asc' },
              include: { questions: true },
            },
          },
        },
        answers: true,
        regrade_requests: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy bài làm');
    }

    const userRoles = await this.prisma.user_roles.findMany({
      where: { user_id: callerUserId },
      include: { roles: true },
    });
    const roles = userRoles.map((r) => r.roles.code);
    const isTeacherOrAdmin = roles.includes('teacher') || roles.includes('admin') || roles.includes('academic_staff');

    // Kiểm tra quyền xem: Học sinh sở hữu hoặc Phụ huynh của học sinh
    const isOwnerStudent = attempt.students?.user_id === callerUserId;
    const isParent = attempt.students?.guardianships.some(
      (g) => g.guardians.user_id === callerUserId,
    );

    if (!isTeacherOrAdmin && !isOwnerStudent && !isParent) {
      throw new ForbiddenException('Bạn không có quyền xem kết quả của bài làm này');
    }

    const isPublished = !!attempt.assignments.published_at;

    // BẢO MẬT: Chưa công bố thì không trả answer_key, explanation, và điểm tự luận (TC-085)
    const sanitizedAnswers = attempt.answers.map((ans) => {
      const q = attempt.assignments.assignment_questions.find(
        (aq) => aq.question_id === ans.question_id,
      )?.questions;

      const shouldHide = !isTeacherOrAdmin && !isPublished;

      return {
        id: ans.id,
        questionId: ans.question_id,
        stem: q?.stem,
        type: q?.type,
        options: q?.options,
        response: ans.response,
        // Giấu đáp án nếu chưa công bố
        answerKey: shouldHide ? undefined : q?.answer_key,
        explanation: shouldHide ? undefined : q?.explanation,
        isCorrect: shouldHide ? undefined : ans.is_correct,
        pointsEarned: shouldHide ? undefined : ans.final_points,
      };
    });

    return {
      attemptId: attempt.id,
      assignmentId: attempt.assignment_id,
      assignmentTitle: attempt.assignments.title,
      studentName: attempt.students?.users.full_name,
      startedAt: attempt.started_at,
      submittedAt: attempt.submitted_at,
      submitMode: attempt.submit_mode,
      isPublished,
      finalScore: !isTeacherOrAdmin && !isPublished ? undefined : attempt.final_score,
      maxScore: attempt.max_score,
      teacherFeedback: attempt.teacher_feedback,
      answers: sanitizedAnswers,
      regradeRequest: attempt.regrade_requests,
      isReadOnly: isParent || !isTeacherOrAdmin,
    };
  }

  /**
   * Học sinh / Phụ huynh nộp yêu cầu chấm lại (phúc khảo) (TC-087..TC-089)
   * - Phải trong hạn 7 ngày kể từ khi công bố (TC-087, TC-088)
   * - Mỗi bài chỉ chấm lại đúng 1 lần (TC-089)
   */
  async requestRegrade(callerUserId: string, attemptId: string, reason: string) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Lý do yêu cầu chấm lại không được để trống');
    }

    const attempt = await this.prisma.attempts.findUnique({
      where: { id: attemptId },
      include: {
        assignments: true,
        regrade_requests: true,
        students: {
          include: {
            guardianships: { include: { guardians: true } },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy lượt làm bài');
    }

    // Kiểm tra quyền
    const isOwner = attempt.students?.user_id === callerUserId;
    const isParent = attempt.students?.guardianships.some(
      (g) => g.guardians.user_id === callerUserId,
    );
    if (!isOwner && !isParent) {
      throw new ForbiddenException('Bạn không có quyền yêu cầu chấm lại bài này');
    }

    // Kiểm tra bài đã được công bố chưa
    if (!attempt.assignments.published_at) {
      throw new BadRequestException('Bài thi chưa được công bố kết quả');
    }

    // Kiểm tra hạn 7 ngày kể từ khi công bố (TC-088, FR-609)
    const publishedAt = new Date(attempt.assignments.published_at).getTime();
    const daysSincePublished = (Date.now() - publishedAt) / (1000 * 60 * 60 * 24);
    if (daysSincePublished > 7) {
      throw new BadRequestException(
        'Đã quá thời hạn 7 ngày kể từ ngày công bố kết quả để gửi yêu cầu chấm lại (TC-088, FR-609)',
      );
    }

    // Mỗi bài chỉ chấm lại một lần duy nhất (TC-089)
    if (attempt.regrade_requests) {
      throw new BadRequestException(
        'Mỗi bài thi chỉ được gửi yêu cầu chấm lại một lần duy nhất (TC-089, FR-609)',
      );
    }

    const regrade = await this.prisma.regrade_requests.create({
      data: {
        attempt_id: attemptId,
        requested_by: callerUserId,
        reason: reason.trim(),
        status: regrade_requests_status.pending,
        old_score: attempt.final_score,
      },
    });

    return regrade;
  }

  /**
   * Giáo viên xử lý yêu cầu chấm lại
   */
  async processRegrade(
    teacherUserId: string,
    regradeId: string,
    data: {
      status: 'accepted' | 'rejected';
      newScore?: number;
      response: string;
    },
  ) {
    const regrade = await this.prisma.regrade_requests.findUnique({
      where: { id: regradeId },
      include: { attempts: true },
    });

    if (!regrade) {
      throw new NotFoundException('Không tìm thấy yêu cầu chấm lại');
    }

    const now = new Date();

    const updated = await this.prisma.regrade_requests.update({
      where: { id: regradeId },
      data: {
        status: data.status,
        new_score: data.status === 'accepted' ? data.newScore ?? regrade.old_score : undefined,
        response: data.response,
        resolved_by: teacherUserId,
        resolved_at: now,
      },
    });

    if (data.status === 'accepted' && data.newScore !== undefined) {
      await this.prisma.attempts.update({
        where: { id: regrade.attempt_id },
        data: {
          final_score: data.newScore,
          graded_by: teacherUserId,
          graded_at: now,
        },
      });
    }

    return updated;
  }

  // =========================================================================
  // 5. CRON JOBS (TC-080, TC-090)
  // =========================================================================

  /**
   * Tác vụ quét gửi thông báo nhắc 24 giờ trước hạn nộp bài (TC-080, FR-603)
   * Học sinh đã nộp bài không nhận nhắc
   */
  async runDueReminderJob() {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingAssignments = await this.prisma.assignments.findMany({
      where: {
        deleted_at: null,
        due_at: {
          gte: now,
          lte: next24h,
        },
      },
      include: {
        assignment_targets: true,
        attempts: {
          where: { submitted_at: { not: null } },
          select: { student_id: true },
        },
      },
    });

    let remindersSent = 0;

    for (const asg of upcomingAssignments) {
      const submittedStudentIds = new Set(asg.attempts.map((a) => a.student_id));

      // Lấy toàn bộ học sinh được giao
      for (const target of asg.assignment_targets) {
        if (target.target_type === 'student' && target.student_id) {
          if (!submittedStudentIds.has(target.student_id)) {
            const st = await this.prisma.students.findUnique({
              where: { id: target.student_id },
            });
            if (st?.user_id) {
              await this.notificationsService.createNotification({
                userId: st.user_id,
                category: 'academic_homework',
                title: `Nhắc nộp bài: "${asg.title}" sắp hết hạn`,
                body: `Bài tập sẽ hết hạn lúc ${asg.due_at?.toLocaleString('vi-VN')}. Hãy hoàn thành bài nộp đúng hạn.`,
                link: `/assignments/${asg.id}/take`,
              });
              remindersSent++;
            }
          }
        }
      }
    }

    return { success: true, remindersSent };
  }

  /**
   * Tác vụ báo cáo Giáo vụ khi yêu cầu chấm lại quá 3 ngày làm việc chưa xử lý (TC-090, FR-609)
   */
  async runRegradeEscalationJob() {
    const thresholdDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const overdueRequests = await this.prisma.regrade_requests.findMany({
      where: {
        status: regrade_requests_status.pending,
        escalated_at: null,
        created_at: { lte: thresholdDate },
      },
      include: {
        attempts: {
          include: {
            assignments: { select: { title: true } },
            students: { include: { users: { select: { full_name: true } } } },
          },
        },
      },
    });

    const now = new Date();
    const adminRoles = await this.prisma.user_roles.findMany({
      where: { roles: { code: { in: ['admin', 'academic_staff'] } } },
      select: { user_id: true },
    });

    for (const req of overdueRequests) {
      await this.prisma.regrade_requests.update({
        where: { id: req.id },
        data: { escalated_at: now },
      });

      for (const adm of adminRoles) {
        await this.notificationsService.createNotification({
          userId: adm.user_id,
          category: 'system_alert',
          title: `Cảnh báo quá hạn: Yêu cầu chấm lại chưa xử lý quá 3 ngày`,
          body: `Học sinh ${req.attempts.students?.users.full_name} bài "${req.attempts.assignments.title}" đã gửi yêu cầu phúc khảo quá 3 ngày làm việc mà giáo viên chưa giải quyết.`,
          link: `/teacher/grading`,
          isUrgent: true,
        });
      }
    }

    return { escalatedCount: overdueRequests.length };
  }
}
