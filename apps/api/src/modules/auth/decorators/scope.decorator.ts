import { SetMetadata } from '@nestjs/common';

export type ScopeTarget = 'student' | 'class' | 'session' | 'guardian' | 'branch';

export interface ScopeOptions {
  target: ScopeTarget;
  paramName?: string; // Tên param chứa ID trong request (mặc định 'id')
  permissionField?: 'can_view_results' | 'can_message' | 'receives_fee_notice';
}

export const SCOPE_KEY = 'scope_policy';
export const Scope = (options: ScopeOptions) => SetMetadata(SCOPE_KEY, options);
