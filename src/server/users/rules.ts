// BR-008: tối đa 4 phụ huynh cho một học sinh.
export const MAX_GUARDIANS = 4;

export function canAddGuardian(currentCount: number): boolean {
  return currentCount < MAX_GUARDIANS;
}
