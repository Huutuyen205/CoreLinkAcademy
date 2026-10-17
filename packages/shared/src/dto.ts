import { z } from 'zod';
import { RoleCode, UserStatus } from './enums';

/**
 * RFC 7807 Problem Details
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    database: {
      status: 'up' | 'down';
      latencyMs?: number;
      error?: string;
    };
    redis: {
      status: 'up' | 'down' | 'mock';
      latencyMs?: number;
    };
    storage: {
      status: 'up' | 'down' | 'mock';
    };
  };
  version: string;
}

export const HealthCheckResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  timestamp: z.string(),
  services: z.object({
    database: z.object({
      status: z.enum(['up', 'down']),
      latencyMs: z.number().optional(),
      error: z.string().optional(),
    }),
    redis: z.object({
      status: z.enum(['up', 'down', 'mock']),
      latencyMs: z.number().optional(),
    }),
    storage: z.object({
      status: z.enum(['up', 'down', 'mock']),
    }),
  }),
  version: z.string(),
});

// ==========================================
// M02: DTOs & Schemas cho Auth & Users
// ==========================================

export const LoginRequestSchema = z.object({
  credential: z.string().min(1, 'Tên đăng nhập, email hoặc SĐT là bắt buộc'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
  twoFactorCode: z.string().optional(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
  newPassword: z.string().min(8, 'Mật khẩu mới tối thiểu 8 ký tự'),
});
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1, 'Mã xác nhận là bắt buộc'),
  newPassword: z.string().min(8, 'Mật khẩu mới tối thiểu 8 ký tự'),
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

export interface AuthUserResponse {
  id: string;
  branchId: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  username?: string | null;
  status: UserStatus | string;
  mustChangePassword: boolean;
  roles: string[];
  permissions: string[];
  isYoungAccount: boolean;
  studentId?: string | null;
  teacherId?: string | null;
  guardianId?: string | null;
  hasConsented: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUserResponse;
}

export const CreateUserRequestSchema = z.object({
  branchId: z.string().uuid().optional(),
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  username: z.string().optional(),
  role: z.nativeEnum(RoleCode),
  dateOfBirth: z.string().optional(),
  gradeLevel: z.number().min(0).max(12).optional(),
  schoolName: z.string().optional(),
  goal: z.string().optional(),
  otherWorkplace: z.string().optional(),
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export const UpdateGuardianshipRequestSchema = z.object({
  canViewResults: z.boolean().optional(),
  canMessage: z.boolean().optional(),
  receivesFeeNotice: z.boolean().optional(),
});
export type UpdateGuardianshipRequest = z.infer<typeof UpdateGuardianshipRequestSchema>;

export const ConsentRequestSchema = z.object({
  scope: z.enum(['data_processing', 'ai_processing', 'photo_public', 'marketing']),
  policyVersion: z.string().default('v1.0'),
  subjectStudentId: z.string().uuid().optional(),
});
export type ConsentRequest = z.infer<typeof ConsentRequestSchema>;
