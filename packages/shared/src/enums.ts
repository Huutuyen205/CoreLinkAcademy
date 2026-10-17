export enum RoleCode {
  ADMIN = 'admin',
  ACADEMIC = 'academic',
  CONSULTANT = 'consultant',
  ACCOUNTANT = 'accountant',
  TEACHER = 'teacher',
  GUARDIAN = 'guardian',
  STUDENT = 'student'
}

export enum UserStatus {
  ACTIVE = 'active',
  LOCKED = 'locked',
  DISABLED = 'disabled'
}

export enum AttendanceStatus {
  PRESENT = 'present',
  LATE = 'late',
  EXCUSED = 'excused',
  ABSENT = 'absent'
}

export enum AttendanceMethod {
  TEACHER = 'teacher',
  QR_STUDENT = 'qr_student',
  ONLINE_LINK = 'online_link',
  ABSENCE_REQUEST = 'absence_request',
  SYSTEM = 'system'
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  TRIAL_BOOKED = 'trial_booked',
  TRIAL_DONE = 'trial_done',
  ENROLLED = 'enrolled',
  LOST = 'lost'
}
