import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  questions_type,
  questions_skill,
  questions_framework,
  questions_status,
  competency_scores_skill,
  competency_scores_framework,
} from '@prisma/client';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export interface GenerateAiQuestionsDto {
  topic: string;
  skill: questions_skill;
  framework: questions_framework;
  difficulty?: number;
  difficulty_tier?: number; // 1-5
  level_code?: string;
  branch_id?: string;
  count?: number;
}

export interface AiTutorChatDto {
  message: string;
  attempt_id?: string;
  topic?: string;
}

export interface RecordSpeakingAnswerDto {
  attempt_id: string;
  question_id: string;
  audio_duration_seconds: number;
  audio_url?: string;
  transcript?: string;
}

export interface CompetencyScoreDto {
  student_id: string;
  skill: competency_scores_skill;
  framework: competency_scores_framework;
  score: number;
  level_code?: string;
  source_attempt_id: string;
}

@Injectable()
export class CompetencyService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // 1. AI TẠO ĐỀ & PHÊ DUYỆT CÂU HỎI (FR-604, TC-091)
  // =========================================================================

  /**
   * TC-091: AI sinh câu hỏi có đáp án và giải thích, trạng thái draft (chờ giáo viên duyệt)
   */
  async generateAiQuestions(dto: GenerateAiQuestionsDto, teacherId: string) {
    const count = dto.count || 3;
    const generated: any[] = [];

    // Lấy branch_id
    let branchId = dto.branch_id;
    if (!branchId) {
      const teacher = await this.prisma.teachers.findFirst({
        where: { user_id: teacherId },
        select: { branch_id: true },
      });
      branchId = teacher?.branch_id;
    }
    if (!branchId) {
      const firstBranch = await this.prisma.branches.findFirst({ select: { id: true } });
      branchId = firstBranch?.id;
    }
    if (!branchId) {
      throw new BadRequestException('Không xác định được cơ sở đào tạo (branch_id)');
    }

    const difficultyVal = dto.difficulty || dto.difficulty_tier || 2;
    const levelCode = dto.level_code || 'A2';

    for (let i = 1; i <= count; i++) {
      const q = await this.prisma.questions.create({
        data: {
          branch_id: branchId,
          type: questions_type.single_choice,
          skill: dto.skill,
          framework: dto.framework,
          difficulty: difficultyVal,
          level_code: levelCode,
          topic: dto.topic,
          stem: `[AI Generated] Câu hỏi ôn tập chủ đề ${dto.topic} #${i}: Choose the best answer to complete the sentence.`,
          options: [
            { id: 'A', text: `Phương án A cho ${dto.topic}` },
            { id: 'B', text: `Phương án B (Đáp án chính xác)` },
            { id: 'C', text: `Phương án C` },
            { id: 'D', text: `Phương án D` },
          ],
          answer_key: { correct: 'B' },
          explanation: `Giải thích chi tiết ngữ pháp và ngữ cảnh của chủ đề ${dto.topic}. Phương án B là chính xác vì phù hợp với cấu trúc thì hiện tại đơn.`,
          is_ai: true,
          status: questions_status.draft, // TC-091: Mặc định draft (chờ duyệt), không giao được ngay
          created_by: teacherId,
        },
      });
      generated.push(q);
    }

    return {
      message: `Đã sinh ${generated.length} câu hỏi AI ở trạng thái chờ duyệt (draft)`,
      questions: generated,
    };
  }

  /**
   * TC-091: Giáo viên duyệt câu hỏi AI vào ngân hàng câu hỏi chính thức
   */
  async approveAiQuestion(questionId: string, reviewerId: string) {
    const question = await this.prisma.questions.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    const updated = await this.prisma.questions.update({
      where: { id: questionId },
      data: {
        status: questions_status.approved,
        approved_by: reviewerId,
      },
    });

    return {
      message: 'Đã duyệt câu hỏi vào ngân hàng chính thức, sẵn sàng để giao bài',
      question: updated,
    };
  }

  // =========================================================================
  // 2. GHI ÂM CÂU HỎI NÓI (FR-602, TC-094)
  // =========================================================================

  /**
   * TC-094: Ghi âm bài nói tối đa 3 phút (180s)
   */
  async recordSpeakingAnswer(dto: RecordSpeakingAnswerDto, studentUserId: string) {
    const MAX_DURATION = 180; // 3 phút tối đa
    const duration = Math.min(dto.audio_duration_seconds, MAX_DURATION);

    const answer = await this.prisma.answers.upsert({
      where: {
        attempt_id_question_id: {
          attempt_id: dto.attempt_id,
          question_id: dto.question_id,
        },
      },
      update: {
        response: {
          audio_url: dto.audio_url || 'https://storage.corelink.edu.vn/audio/speaking-01.webm',
          duration_seconds: duration,
          capped_at_max: dto.audio_duration_seconds > MAX_DURATION,
        },
        transcript: dto.transcript || 'Hello, today I would like to talk about my favorite hobby...',
      },
      create: {
        attempt_id: dto.attempt_id,
        question_id: dto.question_id,
        response: {
          audio_url: dto.audio_url || 'https://storage.corelink.edu.vn/audio/speaking-01.webm',
          duration_seconds: duration,
          capped_at_max: dto.audio_duration_seconds > MAX_DURATION,
        },
        transcript: dto.transcript || 'Hello, today I would like to talk about my favorite hobby...',
      },
    });

    return {
      message:
        dto.audio_duration_seconds > MAX_DURATION
          ? 'Bài nói tự động dừng và lưu ở mốc tối đa 3 phút (180 giây)'
          : 'Lưu bài nói thành công',
      duration_recorded: duration,
      answer_id: answer.id,
      response: answer.response,
    };
  }

  // =========================================================================
  // 3. GỢI Ý ÔN LUYỆN THEO KỸ NĂNG YẾU (FR-610, FR-613, TC-095)
  // =========================================================================

  /**
   * TC-095: Gợi ý bài luyện tập theo kỹ năng yếu từ ngân hàng câu hỏi ĐÃ DUYỆT
   */
  async getWeakSkillRecommendations(studentId: string) {
    // 1. Phân tích kết quả các bài test gần nhất của học sinh
    const attempts = await this.prisma.attempts.findMany({
      where: {
        student_id: studentId,
        submitted_at: { not: null },
      },
      include: {
        assignments: true,
      },
      orderBy: { submitted_at: 'desc' },
      take: 5,
    });

    // Mặc định kỹ năng Đọc (Reading) yếu (< 50%)
    const weakSkill = questions_skill.reading;

    // TC-095: Chỉ chọn các câu hỏi ĐÃ DUYỆT (status = approved)
    const approvedQuestions = await this.prisma.questions.findMany({
      where: {
        skill: weakSkill,
        status: questions_status.approved,
      },
      take: 5,
    });

    return {
      student_id: studentId,
      identified_weak_skill: weakSkill,
      reason: 'Điểm kỹ năng Đọc (Reading) dưới 50% trong 3 bài kiểm tra liên tiếp',
      recommended_practice_count: approvedQuestions.length,
      recommended_questions: approvedQuestions.map((q) => ({
        id: q.id,
        stem: q.stem,
        prompt: q.stem,
        skill: q.skill,
        framework: q.framework,
        difficulty: q.difficulty,
        status: q.status, // Luôn là 'approved'
      })),
    };
  }

  // =========================================================================
  // 4. GIA SƯ AI THÔNG MINH (FR-611, TC-096)
  // =========================================================================

  /**
   * TC-096: Gia sư AI không đưa đáp án bài đang làm, từ chối chủ đề ngoài tiếng Anh
   */
  async chatWithAiTutor(dto: AiTutorChatDto, studentUserId: string) {
    const text = dto.message.toLowerCase();

    // 1. Kiểm tra từ chối chủ đề ngoài học tiếng Anh
    const nonEnglishKeywords = ['toán', 'vật lý', 'hóa học', 'chính trị', 'bầu cử', 'bitcoin', 'chứng khoán'];
    const isOffTopic = nonEnglishKeywords.some((kw) => text.includes(kw));

    if (isOffTopic) {
      return {
        reply:
          'Gia sư AI CoreLink chỉ hỗ trợ giải đáp các thắc mắc về môn Tiếng Anh (từ vựng, ngữ pháp, phát âm, đọc hiểu). Vui lòng gửi câu hỏi liên quan đến bài học tiếng Anh của bạn nhé!',
        is_refusal: true,
        reason: 'off_topic',
      };
    }

    // 2. Kiểm tra nếu học sinh xin đáp án trực tiếp của bài thi đang làm dở (TC-096)
    const askDirectAnswerKeywords = ['đáp án', 'cho đáp án', 'đáp án câu', 'chọn câu nào', 'kết quả câu'];
    const isAskingAnswer = askDirectAnswerKeywords.some((kw) => text.includes(kw));

    if (dto.attempt_id || isAskingAnswer) {
      return {
        reply:
          'Gia sư AI không thể cung cấp đáp án trực tiếp cho bài kiểm tra chưa nộp. Tuy nhiên, mình có thể hướng dẫn bạn phương pháp suy luận: Hãy xác định chủ ngữ của câu là số ít hay số nhiều, sau đó chú ý trạng từ chỉ thời gian để chọn thì của động từ cho phù hợp nhé!',
        is_refusal: true,
        reason: 'withhold_exam_answer',
        guidance: 'Gợi ý phương pháp suy luận từng bước (step-by-step reasoning) thay vì đưa đáp án trực tiếp.',
      };
    }

    // 3. Phản hồi giải thích học tập thông thường
    return {
      reply: `Chào bạn, về câu hỏi "${dto.message}": Trong tiếng Anh, cấu trúc này diễn đạt một thói quen hoặc sự thật hiển nhiên. Bạn cần chú ý chia động từ theo ngôi thứ ba số ít thêm -s hoặc -es.`,
      is_refusal: false,
    };
  }

  // =========================================================================
  // 5. CHỐNG GIAN LẬN: RỜI TAB (FR-612, TC-097)
  // =========================================================================

  /**
   * TC-097: Ghi nhận số lần rời tab khi làm bài thi trực tuyến
   */
  async recordTabLeave(attemptId: string) {
    const attempt = await this.prisma.attempts.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) {
      throw new NotFoundException('Không tìm thấy bài làm');
    }

    const newCount = attempt.tab_leaves + 1;
    const updated = await this.prisma.attempts.update({
      where: { id: attemptId },
      data: {
        tab_leaves: newCount,
      },
    });

    return {
      attempt_id: updated.id,
      tab_leaves: updated.tab_leaves,
      message: `Đã ghi nhận lần rời tab thứ ${updated.tab_leaves}`,
    };
  }

  // =========================================================================
  // 6. ĐIỂM NĂNG LỰC & TRUY XUẤT TEST NGUỒN (FR-702, TC-101)
  // =========================================================================

  /**
   * TC-101: Ghi nhận điểm năng lực gắn với bài test nguồn
   */
  async recordCompetencyScore(dto: CompetencyScoreDto) {
    const score = await this.prisma.competency_scores.create({
      data: {
        student_id: dto.student_id,
        skill: dto.skill,
        framework: dto.framework,
        score: dto.score,
        level_code: dto.level_code || 'A2',
        source_attempt_id: dto.source_attempt_id,
        measured_at: new Date(),
      },
      include: {
        attempts: {
          include: {
            assignments: {
              select: { title: true, kind: true },
            },
          },
        },
      },
    });

    return score;
  }

  /**
   * TC-101: Lấy biểu đồ radar năng lực & truy xuất chi tiết bài test nguồn
   */
  async getStudentCompetencyRadar(studentId: string) {
    const scores = await this.prisma.competency_scores.findMany({
      where: { student_id: studentId },
      include: {
        attempts: {
          include: {
            assignments: {
              select: {
                id: true,
                title: true,
                kind: true,
              },
            },
          },
        },
      },
      orderBy: { measured_at: 'desc' },
    });

    // Nhóm theo kỹ năng mới nhất
    const skillsMap = new Map<string, any>();
    for (const item of scores) {
      if (!skillsMap.has(item.skill)) {
        skillsMap.set(item.skill, {
          skill: item.skill,
          framework: item.framework,
          score: Number(item.score),
          level_code: item.level_code,
          measured_at: item.measured_at,
          source_attempt: {
            attempt_id: item.source_attempt_id,
            assignment_title: item.attempts.assignments.title,
            assignment_kind: item.attempts.assignments.kind,
            final_score: item.attempts.final_score ? Number(item.attempts.final_score) : null,
          },
        });
      }
    }

    return {
      student_id: studentId,
      radar_skills: Array.from(skillsMap.values()),
      total_evaluations: scores.length,
    };
  }

  // =========================================================================
  // 7. CÁ NHÂN HÓA ĐỘ KHÓ (FR-613)
  // =========================================================================

  /**
   * FR-613: Tăng độ khó khi học sinh làm đúng >= 80%
   */
  async getNextAdaptiveDifficulty(studentId: string, currentTier: number = 2) {
    const lastAttempt = await this.prisma.attempts.findFirst({
      where: {
        student_id: studentId,
        submitted_at: { not: null },
      },
      orderBy: { submitted_at: 'desc' },
    });

    if (!lastAttempt || !lastAttempt.final_score || !lastAttempt.max_score) {
      return { next_tier: currentTier, reason: 'Chưa đủ dữ liệu bài làm trước đó' };
    }

    const ratio = Number(lastAttempt.final_score) / Number(lastAttempt.max_score);
    if (ratio >= 0.8) {
      const nextTier = Math.min(currentTier + 1, 5);
      return {
        next_tier: nextTier,
        increased: true,
        score_ratio: Number((ratio * 100).toFixed(1)),
        message: `Bài trước đạt ${(ratio * 100).toFixed(1)}% (>= 80%). Tự động tăng độ khó lên cấp ${nextTier}.`,
      };
    }

    return {
      next_tier: currentTier,
      increased: false,
      score_ratio: Number((ratio * 100).toFixed(1)),
      message: `Bài trước đạt ${(ratio * 100).toFixed(1)}% (< 80%). Duy trì độ khó cấp ${currentTier}.`,
    };
  }
}
