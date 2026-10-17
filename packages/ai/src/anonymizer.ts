export interface AnonymizeMapping {
  original: string;
  placeholder: string;
  type: 'phone' | 'email' | 'student' | 'guardian' | 'teacher' | 'school';
}

export interface AnonymizeResult {
  text: string;
  mappings: AnonymizeMapping[];
}

export class Anonymizer {
  private static readonly PHONE_REGEX = /(\+84|0)[3|5|7|8|9][0-9]{8}\b/g;
  private static readonly EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  /**
   * Ẩn danh nội dung: phát hiện và thay thế SĐT, email, và các thực thể đã biết
   */
  static anonymize(
    content: string,
    knownEntities?: {
      students?: string[];
      guardians?: string[];
      teachers?: string[];
      schools?: string[];
    }
  ): AnonymizeResult {
    let result = content;
    const mappings: AnonymizeMapping[] = [];
    let studentIndex = 1;
    let guardianIndex = 1;
    let teacherIndex = 1;
    let schoolIndex = 1;
    let phoneIndex = 1;
    let emailIndex = 1;

    // 1. Thay thế số điện thoại
    result = result.replace(this.PHONE_REGEX, (match) => {
      const placeholder = `[SDT_${phoneIndex++}]`;
      mappings.push({ original: match, placeholder, type: 'phone' });
      return placeholder;
    });

    // 2. Thay thế email
    result = result.replace(this.EMAIL_REGEX, (match) => {
      const placeholder = `[EMAIL_${emailIndex++}]`;
      mappings.push({ original: match, placeholder, type: 'email' });
      return placeholder;
    });

    // 3. Thay thế học sinh đã biết
    if (knownEntities?.students) {
      for (const name of knownEntities.students) {
        if (!name || name.trim().length === 0) continue;
        const regex = new RegExp(this.escapeRegExp(name), 'gi');
        if (regex.test(result)) {
          const placeholder = `[HS_${studentIndex++}]`;
          mappings.push({ original: name, placeholder, type: 'student' });
          result = result.replace(regex, placeholder);
        }
      }
    }

    // 4. Thay thế phụ huynh đã biết
    if (knownEntities?.guardians) {
      for (const name of knownEntities.guardians) {
        if (!name || name.trim().length === 0) continue;
        const regex = new RegExp(this.escapeRegExp(name), 'gi');
        if (regex.test(result)) {
          const placeholder = `[PH_${guardianIndex++}]`;
          mappings.push({ original: name, placeholder, type: 'guardian' });
          result = result.replace(regex, placeholder);
        }
      }
    }

    // 5. Thay thế giáo viên đã biết
    if (knownEntities?.teachers) {
      for (const name of knownEntities.teachers) {
        if (!name || name.trim().length === 0) continue;
        const regex = new RegExp(this.escapeRegExp(name), 'gi');
        if (regex.test(result)) {
          const placeholder = `[GV_${teacherIndex++}]`;
          mappings.push({ original: name, placeholder, type: 'teacher' });
          result = result.replace(regex, placeholder);
        }
      }
    }

    // 6. Thay thế trường học đã biết
    if (knownEntities?.schools) {
      for (const name of knownEntities.schools) {
        if (!name || name.trim().length === 0) continue;
        const regex = new RegExp(this.escapeRegExp(name), 'gi');
        if (regex.test(result)) {
          const placeholder = `[TRUONG_${schoolIndex++}]`;
          mappings.push({ original: name, placeholder, type: 'school' });
          result = result.replace(regex, placeholder);
        }
      }
    }

    return { text: result, mappings };
  }

  /**
   * Khôi phục lại nội dung gốc từ mappings
   */
  static deanonymize(text: string, mappings: AnonymizeMapping[]): string {
    let result = text;
    for (const mapping of mappings) {
      result = result.replaceAll(mapping.placeholder, mapping.original);
    }
    return result;
  }

  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
