export interface GuardrailCheckResult {
  passed: boolean;
  violationType?: 'prompt_injection' | 'child_privacy' | 'out_of_scope';
  cannedResponse?: string;
  detectedIntent?: 'request_human' | 'register_trial' | 'general_inquiry';
}

export class AiGuardrails {
  // Các mẫu tấn công chèn lệnh (Prompt Injection)
  private static readonly INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|rules|prompts|commands)/i,
    /bỏ\s+qua\s+(hết\s+|tất\s+cả\s+)?(các\s+)?(chỉ\s+dẫn|lệnh|quy\s+tắc|hướng\s+dẫn)/i,
    /disregard\s+(all\s+)?(previous|prior)/i,
    /you\s+are\s+now\s+(a|an)\s+/i,
    /bây\s+giờ\s+bạn\s+là\s+/i,
    /(từ\s+bây\s+giờ\s+)?đóng\s+vai\s+(hacker|tội\s+phạm|nhân\s+vật\s+khác|kẻ\s+lừa\s+đảo)/i,
    /tiết\s+lộ\s+(prompt\s+hệ\s+thống|system\s+prompt|prompt\s+gốc|lời\s+nhắc\s+hệ\s+thống)/i,
    /reveal\s+(system\s+prompt|instructions|rules)/i,
    /DAN\s+mode/i,
    /jailbreak/i,
  ];

  // Các mẫu dò hỏi thông tin cá nhân của học sinh / trẻ em (Child Privacy)
  private static readonly PRIVACY_PATTERNS = [
    /(danh\s+sách|cho\s+tôi\s+biết\s+tên|sđt|số\s+điện\s+thoại)\s+(của\s+)?(các\s+bé|học\s+sinh|các\s+cháu|trẻ\s+em)/i,
    /(điểm\s+số|học\s+bạ|thông\s+tin\s+riêng|nhà\s+ở|nhà|địa\s+chỉ)\s+(của\s+)?(bé|học\s+sinh)\s+[A-Za-zÀ-ỹ\s]+/i,
    /(sđt|số\s+điện\s+thoại|thông\s+tin)\s+(của\s+)?(bố|mẹ|phụ\s+huynh|gia\s+đình)\s+(của\s+)?(bé|học\s+sinh)/i,
    /học\s+sinh\s+nào\s+đang\s+học\s+lớp\s+[0-9A-Za-z]+/i,
    /(bé|học\s+sinh)\s+[A-Za-zÀ-ỹ\s]+\s+học\s+lớp\s+nào/i,
    /(bao\s+nhiêu\s+bé|bao\s+nhiêu\s+học\s+sinh|thông\s+tin\s+học\s+sinh)/i,
    /ai\s+là\s+phụ\s+huynh\s+của\s+bé\s+[A-Za-zÀ-ỹ\s]+/i,
  ];

  // Nhận diện ý định muốn gặp người thật hoặc đăng ký học thử
  private static readonly HANDOFF_PATTERNS = [
    /(gặp|nói\s+chuyện\s+với|chuyển\s+cho)\s+(người\s+thật|tư\s+vấn\s+viên|chuyên\s+viên|thầy\s+cô)/i,
    /(cho\s+tôi\s+số|hotline|liên\s+hệ\s+trực\s+tiếp)/i,
    /tôi\s+muốn\s+đăng\s+ký\s+học\s+thử/i,
    /xếp\s+lịch\s+học\s+thử\s+cho\s+con/i,
    /đặt\s+lịch\s+test/i,
  ];

  /**
   * Kiểm tra nội dung đầu vào trước khi gửi cho LLM
   */
  static inspectInput(userInput: string): GuardrailCheckResult {
    const text = userInput.trim();

    // 1. Kiểm tra Prompt Injection (TC-011)
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        return {
          passed: false,
          violationType: 'prompt_injection',
          cannedResponse:
            'Dạ, em là Trợ lý tư vấn tuyển sinh chính thức của CoreLink Academy. Em chỉ hỗ trợ thông tin khóa học, học phí và chương trình đào tạo của trung tâm thôi ạ.',
        };
      }
    }

    // 2. Kiểm tra quyền riêng tư trẻ em (TC-012)
    for (const pattern of this.PRIVACY_PATTERNS) {
      if (pattern.test(text)) {
        return {
          passed: false,
          violationType: 'child_privacy',
          cannedResponse:
            'Dạ, vì lý do bảo mật thông tin cá nhân và an toàn cho học sinh theo quy định pháp luật, em không thể cung cấp danh tính hay thông tin riêng của học sinh qua kênh chat công khai. Quý phụ huynh vui lòng đăng nhập Cổng phụ huynh hoặc liên hệ trực tiếp văn phòng trung tâm để được hỗ trợ ạ.',
        };
      }
    }

    // 3. Nhận diện ý định (Intent detection)
    let detectedIntent: 'request_human' | 'register_trial' | 'general_inquiry' = 'general_inquiry';
    for (const pattern of this.HANDOFF_PATTERNS) {
      if (pattern.test(text)) {
        if (/đăng\s+ký\s+học\s+thử|xếp\s+lịch/i.test(text)) {
          detectedIntent = 'register_trial';
        } else {
          detectedIntent = 'request_human';
        }
        break;
      }
    }

    return {
      passed: true,
      detectedIntent,
    };
  }
}
