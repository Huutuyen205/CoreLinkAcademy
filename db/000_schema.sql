-- =====================================================================
-- CoreLink Academy — Schema MySQL (chạy trong MySQL Workbench)
-- Phiên bản: v0.1 — 17/10/2026
-- Yêu cầu: MySQL 8.0.16 trở lên (khuyến nghị 8.4 LTS). Không dùng cho MariaDB.
-- Cách chạy: mở file trong Workbench > nút tia sét (Execute all) hoặc Ctrl+Shift+Enter.
-- Nguồn thiết kế: tài liệu "CoreLink Academy — Kế hoạch dự án & Đặc tả hệ thống", mục 9.
--
-- Quy ước:
--  * Khóa chính CHAR(36) UUID, mặc định UUID() — ứng dụng có thể tự sinh UUID v7.
--  * Mọi bảng nghiệp vụ có branch_id (cơ sở), created_at, updated_at.
--  * Xóa mềm bằng deleted_at; RIÊNG messages, message_edits, audit_logs, consents
--    KHÔNG xóa được (trigger chặn ở cuối file).
--  * Thời gian lưu theo UTC (DATETIME(3)); ứng dụng đổi sang giờ Việt Nam khi hiển thị.
--  * Số điện thoại chuẩn hóa dạng +84xxxxxxxxx.
--  * Nội dung do AI tạo: is_ai = 1, phải có approved_by trước khi hiện cho học sinh/phụ huynh.
--  * Vector cho chatbot lưu dạng JSON trong kb_chunks.embedding; độ tương đồng tính ở
--    tầng ứng dụng (kho kiến thức nhỏ, vài nghìn đoạn) — không phụ thuộc HeatWave.
-- =====================================================================

DROP DATABASE IF EXISTS corelink;
CREATE DATABASE corelink CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE corelink;
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- =====================================================================
-- 1. HỆ THỐNG & NGƯỜI DÙNG
-- =====================================================================

CREATE TABLE branches (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  code          VARCHAR(20)   NOT NULL,
  name          VARCHAR(150)  NOT NULL,
  address       VARCHAR(255)  NULL,
  latitude      DECIMAL(9,6)  NULL,
  longitude     DECIMAL(9,6)  NULL,
  checkin_radius_m INT        NOT NULL DEFAULT 150,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_branches_code (code)
) ENGINE=InnoDB COMMENT='Cơ sở của trung tâm (FR-1503)';

CREATE TABLE rooms (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id   CHAR(36)     NOT NULL,
  name        VARCHAR(50)  NOT NULL,
  capacity    INT          NOT NULL DEFAULT 15,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_rooms_branch_name (branch_id, name),
  CONSTRAINT fk_rooms_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE files (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  branch_id     CHAR(36)      NULL,
  storage_key   VARCHAR(500)  NOT NULL COMMENT 'Đường dẫn trong kho S3',
  original_name VARCHAR(255)  NOT NULL,
  mime_type     VARCHAR(100)  NOT NULL,
  size_bytes    BIGINT        NOT NULL,
  purpose       ENUM('curriculum','material','video','attendance_photo','submission','audio','chat','avatar','import','export','other') NOT NULL,
  copyright_source ENUM('center','teacher','public_domain','third_party') NULL COMMENT 'FR-508; third_party không gửi cho AI',
  expires_at    DATETIME(3)   NULL COMMENT 'Ảnh điểm danh: +30 ngày',
  uploaded_by   CHAR(36)      NULL,
  created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  deleted_at    DATETIME(3)   NULL,
  PRIMARY KEY (id),
  KEY ix_files_expires (expires_at),
  CONSTRAINT fk_files_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE users (
  id                 CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id          CHAR(36)     NOT NULL,
  full_name          VARCHAR(150) NOT NULL,
  phone              VARCHAR(20)  NULL COMMENT 'Dạng +84...',
  email              VARCHAR(190) NULL,
  username           VARCHAR(50)  NULL COMMENT 'Mã học sinh cho tài khoản không có SĐT',
  password_hash      VARCHAR(255) NOT NULL,
  must_change_password TINYINT(1) NOT NULL DEFAULT 1,
  temp_password_expires_at DATETIME(3) NULL COMMENT 'FR-201: 72 giờ',
  twofa_secret       VARCHAR(255) NULL COMMENT 'Mã hóa ở tầng ứng dụng',
  status             ENUM('active','locked','disabled') NOT NULL DEFAULT 'active',
  failed_login_count INT          NOT NULL DEFAULT 0,
  locked_until       DATETIME(3)  NULL COMMENT 'FR-207: khóa 15 phút sau 5 lần sai',
  avatar_file_id     CHAR(36)     NULL,
  last_login_at      DATETIME(3)  NULL,
  created_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at         DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_phone (phone),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username),
  CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_users_avatar FOREIGN KEY (avatar_file_id) REFERENCES files(id),
  CONSTRAINT ck_users_login CHECK (phone IS NOT NULL OR email IS NOT NULL OR username IS NOT NULL)
) ENGINE=InnoDB;

ALTER TABLE files ADD CONSTRAINT fk_files_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id);

CREATE TABLE roles (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  code        VARCHAR(30)  NOT NULL COMMENT 'admin, academic, consultant, accountant, teacher, guardian, student',
  name        VARCHAR(100) NOT NULL,
  is_system   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_code (code)
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  code        VARCHAR(80)  NOT NULL COMMENT 'vd: class.manage, attendance.edit_after',
  description VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_code (code)
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  role_id       CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  user_id     CHAR(36)    NOT NULL,
  role_id     CHAR(36)    NOT NULL,
  granted_by  CHAR(36)    NULL,
  granted_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_ur_granted_by FOREIGN KEY (granted_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='Một người nhiều vai trò (FR-206)';

CREATE TABLE refresh_tokens (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id     CHAR(36)     NOT NULL,
  token_hash  CHAR(64)     NOT NULL,
  user_agent  VARCHAR(255) NULL,
  expires_at  DATETIME(3)  NOT NULL,
  revoked_at  DATETIME(3)  NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_rt_hash (token_hash),
  KEY ix_rt_user (user_id),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE password_resets (
  id          CHAR(36)    NOT NULL DEFAULT (UUID()),
  user_id     CHAR(36)    NOT NULL,
  token_hash  CHAR(64)    NOT NULL,
  expires_at  DATETIME(3) NOT NULL COMMENT '30 phút',
  used_at     DATETIME(3) NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pr_hash (token_hash),
  CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE teachers (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id          CHAR(36)     NOT NULL,
  branch_id        CHAR(36)     NOT NULL,
  bio_public       TEXT         NULL COMMENT 'Hiện trên trang giới thiệu',
  certificates     JSON         NULL,
  levels_taught    JSON         NULL COMMENT 'vd: ["YLE","A2","IELTS"]',
  other_workplace  VARCHAR(200) NULL COMMENT 'Trường đang dạy — kiểm tra FR-308',
  is_head_of_dept  TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'Trưởng bộ môn: duyệt giáo trình',
  is_public        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at       DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_teachers_user (user_id),
  CONSTRAINT fk_teachers_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_teachers_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE teacher_availability (
  id           CHAR(36)  NOT NULL DEFAULT (UUID()),
  teacher_id   CHAR(36)  NOT NULL,
  weekday      TINYINT   NOT NULL COMMENT '1=Thứ 2 ... 7=Chủ nhật',
  start_time   TIME      NOT NULL,
  end_time     TIME      NOT NULL,
  PRIMARY KEY (id),
  KEY ix_ta_teacher (teacher_id, weekday),
  CONSTRAINT fk_ta_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  CONSTRAINT ck_ta_weekday CHECK (weekday BETWEEN 1 AND 7),
  CONSTRAINT ck_ta_time CHECK (end_time > start_time)
) ENGINE=InnoDB;

CREATE TABLE students (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id          CHAR(36)     NOT NULL,
  branch_id        CHAR(36)     NOT NULL,
  code             VARCHAR(20)  NOT NULL COMMENT 'Mã học sinh',
  date_of_birth    DATE         NULL,
  school_name      VARCHAR(200) NULL,
  school_class     VARCHAR(20)  NULL COMMENT 'vd: 7A3',
  grade_level      TINYINT      NULL COMMENT '0=tiền tiểu học, 1..12',
  goal             VARCHAR(255) NULL COMMENT 'vd: thi vào 10, IELTS 6.5',
  is_young_account TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'FR-208: ẩn nhắn tin',
  status           ENUM('active','paused','stopped','completed') NOT NULL DEFAULT 'active',
  source_lead_id   CHAR(36)     NULL COMMENT 'Truy nguồn tuyển sinh (FR-106)',
  custom_fields    JSON         NULL COMMENT 'Trường tùy biến từ file nhập (FR-1402)',
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at       DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_students_user (user_id),
  UNIQUE KEY uq_students_code (code),
  CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_students_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT ck_students_grade CHECK (grade_level IS NULL OR grade_level BETWEEN 0 AND 12)
) ENGINE=InnoDB;

CREATE TABLE guardians (
  id          CHAR(36)    NOT NULL DEFAULT (UUID()),
  user_id     CHAR(36)    NOT NULL,
  branch_id   CHAR(36)    NOT NULL,
  referral_code VARCHAR(20) NULL COMMENT 'FR-107',
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_guardians_user (user_id),
  UNIQUE KEY uq_guardians_referral (referral_code),
  CONSTRAINT fk_guardians_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_guardians_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE guardianships (
  student_id          CHAR(36)    NOT NULL,
  guardian_id         CHAR(36)    NOT NULL,
  relation            ENUM('father','mother','grandparent','guardian','other') NOT NULL,
  can_view_results    TINYINT(1)  NOT NULL DEFAULT 1,
  can_message         TINYINT(1)  NOT NULL DEFAULT 1,
  receives_fee_notice TINYINT(1)  NOT NULL DEFAULT 1,
  created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (student_id, guardian_id),
  KEY ix_gs_guardian (guardian_id),
  CONSTRAINT fk_gs_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_gs_guardian FOREIGN KEY (guardian_id) REFERENCES guardians(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='FR-202; tối đa 4 phụ huynh/học sinh (trigger cuối file)';

CREATE TABLE consents (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id        CHAR(36)     NOT NULL,
  subject_student_id CHAR(36) NULL COMMENT 'Đồng ý thay cho học sinh nào',
  policy_version VARCHAR(20)  NOT NULL,
  scope          ENUM('data_processing','ai_processing','photo_public','marketing') NOT NULL,
  given_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  withdrawn_at   DATETIME(3)  NULL,
  ip_address     VARCHAR(45)  NULL,
  PRIMARY KEY (id),
  KEY ix_consents_user (user_id, scope),
  CONSTRAINT fk_consents_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_consents_student FOREIGN KEY (subject_student_id) REFERENCES students(id)
) ENGINE=InnoDB COMMENT='FR-209; chỉ ghi thêm, rút đồng ý = cập nhật withdrawn_at';

CREATE TABLE settings (
  branch_id     CHAR(36)     NOT NULL,
  setting_key   VARCHAR(80)  NOT NULL,
  setting_value JSON         NOT NULL,
  updated_by    CHAR(36)     NULL,
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (branch_id, setting_key),
  CONSTRAINT fk_settings_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_settings_user FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='FR-1503: khung giờ, ngưỡng học sinh nhỏ, hạn mức AI...';

CREATE TABLE audit_logs (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  branch_id   CHAR(36)     NULL,
  actor_id    CHAR(36)     NULL,
  action      VARCHAR(80)  NOT NULL COMMENT 'vd: attendance.update, chat.view_by_guardian',
  entity      VARCHAR(60)  NOT NULL,
  entity_id   VARCHAR(64)  NULL,
  before_data JSON         NULL,
  after_data  JSON         NULL,
  reason      VARCHAR(500) NULL,
  ip_address  VARCHAR(45)  NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_audit_entity (entity, entity_id),
  KEY ix_audit_actor (actor_id, created_at),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='FR-1501: không sửa, không xóa (trigger)';

CREATE TABLE imports (
  id            CHAR(36)    NOT NULL DEFAULT (UUID()),
  branch_id     CHAR(36)    NOT NULL,
  entity        ENUM('students','guardians','teachers','classes','grades') NOT NULL,
  file_id       CHAR(36)    NOT NULL,
  idempotency_key VARCHAR(64) NOT NULL COMMENT 'Nhập lại cùng file không tạo trùng',
  column_mapping JSON       NULL,
  total_rows    INT         NOT NULL DEFAULT 0,
  ok_rows       INT         NOT NULL DEFAULT 0,
  error_rows    INT         NOT NULL DEFAULT 0,
  error_file_id CHAR(36)    NULL,
  status        ENUM('uploaded','previewed','importing','done','failed') NOT NULL DEFAULT 'uploaded',
  created_by    CHAR(36)    NOT NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_imports_key (idempotency_key),
  CONSTRAINT fk_imports_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_imports_file FOREIGN KEY (file_id) REFERENCES files(id),
  CONSTRAINT fk_imports_errfile FOREIGN KEY (error_file_id) REFERENCES files(id),
  CONSTRAINT fk_imports_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE ai_jobs (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  branch_id     CHAR(36)      NOT NULL,
  feature       VARCHAR(20)   NOT NULL COMMENT 'AI-01 ... AI-14, DAILY_SUMMARY',
  provider      VARCHAR(30)   NOT NULL COMMENT 'anthropic, google, heygen',
  model         VARCHAR(60)   NOT NULL,
  status        ENUM('queued','running','done','failed','cancelled') NOT NULL DEFAULT 'queued',
  input_tokens  INT           NOT NULL DEFAULT 0,
  output_tokens INT           NOT NULL DEFAULT 0,
  audio_seconds INT           NOT NULL DEFAULT 0,
  cost_usd      DECIMAL(10,5) NOT NULL DEFAULT 0,
  entity        VARCHAR(60)   NULL,
  entity_id     CHAR(36)      NULL,
  request_log   JSON          NULL COMMENT 'Đã ẩn danh; xóa sau 90 ngày',
  response_log  JSON          NULL,
  error_message VARCHAR(1000) NULL,
  created_by    CHAR(36)      NULL,
  created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  finished_at   DATETIME(3)   NULL,
  PRIMARY KEY (id),
  KEY ix_ai_jobs_cost (branch_id, created_at),
  KEY ix_ai_jobs_entity (entity, entity_id),
  CONSTRAINT fk_ai_jobs_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_ai_jobs_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='Nguồn cho báo cáo chi phí AI và hạn mức (FR-1502)';

-- =====================================================================
-- 2. TUYỂN SINH
-- =====================================================================

CREATE TABLE campaigns (
  id          CHAR(36)      NOT NULL DEFAULT (UUID()),
  branch_id   CHAR(36)      NOT NULL,
  name        VARCHAR(150)  NOT NULL,
  utm_campaign VARCHAR(80)  NULL,
  channel     VARCHAR(40)   NULL COMMENT 'facebook, zalo, flyer, ...',
  cost_vnd    BIGINT        NOT NULL DEFAULT 0,
  discount_code VARCHAR(30) NULL,
  discount_percent DECIMAL(5,2) NULL,
  starts_on   DATE          NULL,
  ends_on     DATE          NULL,
  created_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_campaigns_code (discount_code),
  KEY ix_campaigns_utm (utm_campaign),
  CONSTRAINT fk_campaigns_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB COMMENT='FR-108, FR-109';

CREATE TABLE leads (
  id                   CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id            CHAR(36)     NOT NULL,
  parent_name          VARCHAR(150) NULL,
  phone                VARCHAR(20)  NOT NULL COMMENT 'Dạng +84...; trùng thì gộp',
  child_name           VARCHAR(150) NULL,
  child_age            TINYINT      NULL,
  child_grade          TINYINT      NULL,
  goal                 VARCHAR(255) NULL,
  free_slots           VARCHAR(255) NULL,
  source               VARCHAR(40)  NOT NULL DEFAULT 'website' COMMENT 'website, chatbot, facebook, zalo, referral, flyer, walk_in, other',
  utm_source           VARCHAR(80)  NULL,
  utm_medium           VARCHAR(80)  NULL,
  utm_campaign         VARCHAR(80)  NULL,
  referrer_url         VARCHAR(500) NULL,
  campaign_id          CHAR(36)     NULL,
  referred_by_guardian_id CHAR(36)  NULL,
  status               ENUM('new','contacted','trial_booked','trial_done','enrolled','lost') NOT NULL DEFAULT 'new',
  lost_reason          VARCHAR(255) NULL,
  owner_id             CHAR(36)     NULL COMMENT 'Tư vấn viên phụ trách',
  first_contacted_at   DATETIME(3)  NULL,
  converted_student_id CHAR(36)     NULL,
  consent_given_at     DATETIME(3)  NOT NULL,
  created_at           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at           DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_leads_branch_phone (branch_id, phone),
  KEY ix_leads_status (branch_id, status, created_at),
  KEY ix_leads_source (branch_id, source, created_at),
  CONSTRAINT fk_leads_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_leads_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  CONSTRAINT fk_leads_referrer FOREIGN KEY (referred_by_guardian_id) REFERENCES guardians(id),
  CONSTRAINT fk_leads_owner FOREIGN KEY (owner_id) REFERENCES users(id),
  CONSTRAINT fk_leads_student FOREIGN KEY (converted_student_id) REFERENCES students(id),
  CONSTRAINT ck_leads_lost CHECK (status <> 'lost' OR lost_reason IS NOT NULL)
) ENGINE=InnoDB COMMENT='FR-102, FR-105, FR-106';

ALTER TABLE students ADD CONSTRAINT fk_students_lead FOREIGN KEY (source_lead_id) REFERENCES leads(id);

CREATE TABLE lead_activities (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  lead_id     CHAR(36)     NOT NULL,
  actor_id    CHAR(36)     NULL COMMENT 'NULL = hệ thống / chatbot',
  type        ENUM('form','chat','call','note','status_change','trial','test_result','resubmit') NOT NULL,
  content     TEXT         NULL,
  from_status VARCHAR(20)  NULL,
  to_status   VARCHAR(20)  NULL,
  remind_at   DATETIME(3)  NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_la_lead (lead_id, created_at),
  CONSTRAINT fk_la_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT fk_la_actor FOREIGN KEY (actor_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE kb_documents (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id   CHAR(36)     NOT NULL,
  title       VARCHAR(200) NOT NULL,
  category    ENUM('course','fee','schedule','teacher','policy','faq','about') NOT NULL,
  content     MEDIUMTEXT   NOT NULL,
  status      ENUM('draft','approved','archived') NOT NULL DEFAULT 'draft',
  approved_by CHAR(36)     NULL,
  approved_at DATETIME(3)  NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_kb_status (branch_id, status),
  CONSTRAINT fk_kb_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_kb_approver FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='Kho kiến thức chatbot — chỉ dùng bản approved (AI-12)';

CREATE TABLE kb_chunks (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  document_id   CHAR(36)     NOT NULL,
  chunk_index   INT          NOT NULL,
  content       TEXT         NOT NULL,
  embedding     JSON         NULL COMMENT 'Mảng số thực; tính cosine ở ứng dụng',
  embedding_model VARCHAR(60) NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_kbc_doc_idx (document_id, chunk_index),
  FULLTEXT KEY ft_kbc_content (content),
  CONSTRAINT fk_kbc_doc FOREIGN KEY (document_id) REFERENCES kb_documents(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE chat_sessions (
  id           CHAR(36)    NOT NULL DEFAULT (UUID()),
  branch_id    CHAR(36)    NOT NULL,
  visitor_key  VARCHAR(64) NOT NULL COMMENT 'Cookie ẩn danh của khách',
  lead_id      CHAR(36)    NULL,
  user_id      CHAR(36)    NULL COMMENT 'Phụ huynh đã đăng nhập',
  handed_off_at DATETIME(3) NULL COMMENT 'Chuyển tư vấn viên',
  utm_source   VARCHAR(80) NULL,
  utm_campaign VARCHAR(80) NULL,
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_cs_lead (lead_id),
  CONSTRAINT fk_cs_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_cs_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
  CONSTRAINT fk_cs_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE chat_turns (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  session_id  CHAR(36)     NOT NULL,
  role        ENUM('visitor','bot','consultant') NOT NULL,
  content     TEXT         NOT NULL,
  cited_chunk_ids JSON     NULL COMMENT 'Đoạn kho kiến thức đã dùng',
  ai_job_id   CHAR(36)     NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_ct_session (session_id, id),
  CONSTRAINT fk_ct_session FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_ct_job FOREIGN KEY (ai_job_id) REFERENCES ai_jobs(id)
) ENGINE=InnoDB COMMENT='Hội thoại chatbot tư vấn';

-- =====================================================================
-- 3. ĐÀO TẠO
-- =====================================================================

CREATE TABLE levels (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  code        VARCHAR(20)  NOT NULL COMMENT 'PRE, PRIMARY, LOWER_SEC, UPPER_SEC, STUDY_ABROAD',
  name        VARCHAR(100) NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_levels_code (code)
) ENGINE=InnoDB COMMENT='Cấp học';

CREATE TABLE fee_plans (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id     CHAR(36)     NOT NULL,
  name          VARCHAR(150) NOT NULL,
  billing_unit  ENUM('course','month','session') NOT NULL,
  amount_vnd    BIGINT       NOT NULL,
  sessions_included INT      NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_fp_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT ck_fp_amount CHECK (amount_vnd >= 0)
) ENGINE=InnoDB COMMENT='FR-1101';

CREATE TABLE programs (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id     CHAR(36)     NOT NULL,
  level_id      CHAR(36)     NOT NULL,
  code          VARCHAR(30)  NOT NULL,
  name          VARCHAR(150) NOT NULL,
  framework     ENUM('YLE','CEFR','GDPT2018','IELTS','OTHER') NOT NULL,
  target_level  VARCHAR(20)  NULL COMMENT 'vd: A2, Flyers, 6.5',
  description   TEXT         NULL,
  outcomes      TEXT         NULL COMMENT 'Chuẩn đầu ra',
  total_sessions INT         NULL,
  default_fee_plan_id CHAR(36) NULL,
  is_public     TINYINT(1)   NOT NULL DEFAULT 1,
  is_school_curriculum TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = theo chương trình phổ thông → kiểm tra FR-308',
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at    DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_programs_code (branch_id, code),
  CONSTRAINT fk_programs_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_programs_level FOREIGN KEY (level_id) REFERENCES levels(id),
  CONSTRAINT fk_programs_fee FOREIGN KEY (default_fee_plan_id) REFERENCES fee_plans(id)
) ENGINE=InnoDB COMMENT='Chương trình / khóa học (FR-205)';

CREATE TABLE classes (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id     CHAR(36)     NOT NULL,
  program_id    CHAR(36)     NOT NULL,
  code          VARCHAR(30)  NOT NULL,
  name          VARCHAR(150) NOT NULL,
  mode          ENUM('offline','online','hybrid') NOT NULL DEFAULT 'offline',
  room_id       CHAR(36)     NULL,
  meeting_url   VARCHAR(500) NULL COMMENT 'Meet/Zoom (FR-309)',
  capacity      INT          NOT NULL DEFAULT 12,
  start_date    DATE         NOT NULL,
  end_date      DATE         NOT NULL,
  recurrence    JSON         NOT NULL COMMENT '[{"weekday":2,"start":"18:00","end":"19:30"}]',
  homeroom_teacher_id CHAR(36) NULL COMMENT 'GV chủ nhiệm nhận cảnh báo',
  status        ENUM('planned','running','finished','cancelled') NOT NULL DEFAULT 'planned',
  created_by    CHAR(36)     NOT NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at    DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_classes_code (branch_id, code),
  CONSTRAINT fk_classes_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_classes_program FOREIGN KEY (program_id) REFERENCES programs(id),
  CONSTRAINT fk_classes_room FOREIGN KEY (room_id) REFERENCES rooms(id),
  CONSTRAINT fk_classes_homeroom FOREIGN KEY (homeroom_teacher_id) REFERENCES teachers(id),
  CONSTRAINT fk_classes_creator FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT ck_classes_dates CHECK (end_date >= start_date),
  CONSTRAINT ck_classes_capacity CHECK (capacity > 0)
) ENGINE=InnoDB COMMENT='Lớp chính thức do Admin/Giáo vụ tạo (FR-302)';

CREATE TABLE class_teachers (
  class_id    CHAR(36)    NOT NULL,
  teacher_id  CHAR(36)    NOT NULL,
  role        ENUM('main','assistant') NOT NULL DEFAULT 'main',
  from_date   DATE        NOT NULL,
  to_date     DATE        NULL,
  conflict_ack_reason VARCHAR(500) NULL COMMENT 'Lý do vẫn phân công khi có cảnh báo FR-308',
  PRIMARY KEY (class_id, teacher_id, from_date),
  KEY ix_ct_teacher (teacher_id),
  CONSTRAINT fk_clt_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_clt_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
) ENGINE=InnoDB;

CREATE TABLE enrollments (
  id            CHAR(36)    NOT NULL DEFAULT (UUID()),
  branch_id     CHAR(36)    NOT NULL,
  class_id      CHAR(36)    NOT NULL,
  student_id    CHAR(36)    NOT NULL,
  status        ENUM('active','transferred','paused','stopped','completed') NOT NULL DEFAULT 'active',
  enrolled_on   DATE        NOT NULL,
  ended_on      DATE        NULL,
  transferred_to_enrollment_id CHAR(36) NULL,
  fee_plan_id   CHAR(36)    NULL,
  conflict_ack_reason VARCHAR(500) NULL COMMENT 'FR-308',
  created_by    CHAR(36)    NOT NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_enr_class (class_id, status),
  KEY ix_enr_student (student_id, status),
  CONSTRAINT fk_enr_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_enr_class FOREIGN KEY (class_id) REFERENCES classes(id),
  CONSTRAINT fk_enr_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_enr_transfer FOREIGN KEY (transferred_to_enrollment_id) REFERENCES enrollments(id),
  CONSTRAINT fk_enr_fee FOREIGN KEY (fee_plan_id) REFERENCES fee_plans(id),
  CONSTRAINT fk_enr_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='FR-305; lớp đầy chặn ở ứng dụng';

CREATE TABLE class_sessions (
  id            CHAR(36)    NOT NULL DEFAULT (UUID()),
  branch_id     CHAR(36)    NOT NULL,
  class_id      CHAR(36)    NOT NULL,
  session_no    INT         NOT NULL,
  starts_at     DATETIME(3) NOT NULL,
  ends_at       DATETIME(3) NOT NULL,
  room_id       CHAR(36)    NULL,
  meeting_url   VARCHAR(500) NULL,
  teacher_id    CHAR(36)    NOT NULL COMMENT 'Người dạy thực tế (kể cả dạy thay) — tính lương',
  substitute_for_teacher_id CHAR(36) NULL,
  lesson_node_id CHAR(36)   NULL COMMENT 'Bài trong lộ trình — tính tiến độ',
  status        ENUM('scheduled','in_progress','done','cancelled','holiday') NOT NULL DEFAULT 'scheduled',
  verified_at   DATETIME(3) NULL COMMENT 'GV xác thực có mặt (FR-407)',
  verify_method ENUM('qr_offline','online_open','manual') NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_cs_class_no (class_id, session_no),
  KEY ix_cs_teacher_time (teacher_id, starts_at),
  KEY ix_cs_room_time (room_id, starts_at),
  KEY ix_cs_time (branch_id, starts_at),
  CONSTRAINT fk_cls_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_cls_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_cls_room FOREIGN KEY (room_id) REFERENCES rooms(id),
  CONSTRAINT fk_cls_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  CONSTRAINT fk_cls_subfor FOREIGN KEY (substitute_for_teacher_id) REFERENCES teachers(id),
  CONSTRAINT ck_cls_time CHECK (ends_at > starts_at)
) ENGINE=InnoDB COMMENT='Buổi học (tài liệu gọi là sessions; đổi tên tránh nhầm với phiên đăng nhập)';

CREATE TABLE study_groups (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  class_id    CHAR(36)     NOT NULL,
  name        VARCHAR(100) NOT NULL,
  purpose     VARCHAR(255) NULL,
  created_by  CHAR(36)     NOT NULL,
  status      ENUM('pending','approved','rejected','archived') NOT NULL DEFAULT 'pending',
  approved_by CHAR(36)     NULL,
  approved_at DATETIME(3)  NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_sg_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_sg_creator FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_sg_approver FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='FR-306: GV tạo, Admin/Giáo vụ duyệt';

CREATE TABLE study_group_members (
  group_id    CHAR(36) NOT NULL,
  student_id  CHAR(36) NOT NULL,
  PRIMARY KEY (group_id, student_id),
  CONSTRAINT fk_sgm_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_sgm_student FOREIGN KEY (student_id) REFERENCES students(id)
) ENGINE=InnoDB;

CREATE TABLE reschedule_requests (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  session_id    CHAR(36)     NOT NULL,
  requested_by  CHAR(36)     NOT NULL,
  type          ENUM('reschedule','substitute','cancel') NOT NULL,
  new_starts_at DATETIME(3)  NULL,
  new_ends_at   DATETIME(3)  NULL,
  substitute_teacher_id CHAR(36) NULL,
  reason        VARCHAR(500) NOT NULL,
  status        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  decided_by    CHAR(36)     NULL,
  decided_at    DATETIME(3)  NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_rr_session FOREIGN KEY (session_id) REFERENCES class_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_rr_requester FOREIGN KEY (requested_by) REFERENCES users(id),
  CONSTRAINT fk_rr_sub FOREIGN KEY (substitute_teacher_id) REFERENCES teachers(id),
  CONSTRAINT fk_rr_decider FOREIGN KEY (decided_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='FR-303, FR-304';

CREATE TABLE holidays (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id  CHAR(36)     NOT NULL,
  holiday_on DATE         NOT NULL,
  name       VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_holidays (branch_id, holiday_on),
  CONSTRAINT fk_holidays_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

-- =====================================================================
-- 4. ĐIỂM DANH
-- =====================================================================

CREATE TABLE session_qr_tokens (
  id          CHAR(36)    NOT NULL DEFAULT (UUID()),
  session_id  CHAR(36)    NOT NULL,
  kind        ENUM('offline','online') NOT NULL,
  nonce       CHAR(32)    NOT NULL COMMENT 'Mã ngẫu nhiên, ký HMAC ở ứng dụng',
  valid_from  DATETIME(3) NOT NULL,
  valid_until DATETIME(3) NOT NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_qr_nonce (nonce),
  UNIQUE KEY uq_qr_session_kind (session_id, kind),
  CONSTRAINT fk_qr_session FOREIGN KEY (session_id) REFERENCES class_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='FR-402: QR riêng mỗi buổi, offline/online khác nhau';

CREATE TABLE teacher_checkins (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()),
  session_id     CHAR(36)     NOT NULL,
  teacher_id     CHAR(36)     NOT NULL,
  qr_token_id    CHAR(36)     NULL,
  photo_file_id  CHAR(36)     NULL COMMENT 'Ảnh lớp; tự xóa sau 30 ngày',
  latitude       DECIMAL(9,6) NULL,
  longitude      DECIMAL(9,6) NULL,
  distance_m     INT          NULL,
  result         ENUM('accepted','rejected_distance','rejected_no_location','rejected_qr','manual_pending','manual_approved') NOT NULL,
  manual_reason  VARCHAR(500) NULL,
  reviewed_by    CHAR(36)     NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_tc_session (session_id),
  CONSTRAINT fk_tci_session FOREIGN KEY (session_id) REFERENCES class_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_tci_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  CONSTRAINT fk_tci_qr FOREIGN KEY (qr_token_id) REFERENCES session_qr_tokens(id),
  CONSTRAINT fk_tci_photo FOREIGN KEY (photo_file_id) REFERENCES files(id) ON DELETE SET NULL,
  CONSTRAINT fk_tci_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='FR-403, FR-407';

CREATE TABLE attendance (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  session_id    CHAR(36)     NOT NULL,
  student_id    CHAR(36)     NOT NULL,
  status        ENUM('present','late','excused','absent') NOT NULL,
  method        ENUM('teacher','qr_student','online_link','absence_request','system') NOT NULL,
  checkin_at    DATETIME(3)  NULL,
  note          VARCHAR(255) NULL,
  recorded_by   CHAR(36)     NULL,
  guardian_notified_at DATETIME(3) NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_att_session_student (session_id, student_id),
  KEY ix_att_student (student_id, created_at),
  CONSTRAINT fk_att_session FOREIGN KEY (session_id) REFERENCES class_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_att_recorder FOREIGN KEY (recorded_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='FR-401..FR-409; sửa sau buổi chỉ Giáo vụ/Admin, ghi audit_logs';

CREATE TABLE absence_requests (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  session_id   CHAR(36)     NOT NULL,
  student_id   CHAR(36)     NOT NULL,
  requested_by CHAR(36)     NOT NULL,
  reason       VARCHAR(500) NOT NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_abs (session_id, student_id),
  CONSTRAINT fk_abs_session FOREIGN KEY (session_id) REFERENCES class_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_abs_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_abs_user FOREIGN KEY (requested_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='FR-406';

-- =====================================================================
-- 5. GIÁO TRÌNH & HỌC LIỆU
-- =====================================================================

CREATE TABLE standards (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  framework   ENUM('YLE','CEFR','GDPT2018','IELTS') NOT NULL,
  level_code  VARCHAR(20)  NOT NULL COMMENT 'vd: A2, Movers, Lop7, 6.0',
  skill       ENUM('listening','speaking','reading','writing','grammar','vocabulary') NOT NULL,
  code        VARCHAR(40)  NOT NULL,
  description TEXT         NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_standards_code (framework, code)
) ENGINE=InnoDB COMMENT='Khung năng lực tham chiếu cho AI-02';

CREATE TABLE curricula (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id   CHAR(36)     NOT NULL,
  program_id  CHAR(36)     NULL,
  title       VARCHAR(200) NOT NULL,
  current_version_id CHAR(36) NULL,
  created_by  CHAR(36)     NOT NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at  DATETIME(3)  NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_cur_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_cur_program FOREIGN KEY (program_id) REFERENCES programs(id),
  CONSTRAINT fk_cur_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='Giáo trình khung (FR-501)';

CREATE TABLE curriculum_versions (
  id           CHAR(36)    NOT NULL DEFAULT (UUID()),
  curriculum_id CHAR(36)   NOT NULL,
  version_no   INT         NOT NULL,
  file_id      CHAR(36)    NULL,
  status       ENUM('draft','analyzing','review','approved','superseded') NOT NULL DEFAULT 'draft',
  change_note  VARCHAR(500) NULL,
  created_by   CHAR(36)    NOT NULL,
  approved_by  CHAR(36)    NULL,
  approved_at  DATETIME(3) NULL,
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_cv (curriculum_id, version_no),
  CONSTRAINT fk_cv_cur FOREIGN KEY (curriculum_id) REFERENCES curricula(id) ON DELETE CASCADE,
  CONSTRAINT fk_cv_file FOREIGN KEY (file_id) REFERENCES files(id),
  CONSTRAINT fk_cv_creator FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_cv_approver FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB;

ALTER TABLE curricula ADD CONSTRAINT fk_cur_current_version FOREIGN KEY (current_version_id) REFERENCES curriculum_versions(id);

CREATE TABLE curriculum_nodes (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  version_id   CHAR(36)     NOT NULL,
  parent_id    CHAR(36)     NULL,
  node_type    ENUM('unit','lesson','objective','activity') NOT NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  title        VARCHAR(300) NOT NULL,
  content      TEXT         NULL,
  skill        ENUM('listening','speaking','reading','writing','grammar','vocabulary') NULL,
  cefr_level   VARCHAR(10)  NULL,
  standard_id  CHAR(36)     NULL,
  source_page  INT          NULL COMMENT 'Trang nguồn (AI-01)',
  is_ai        TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_cn_version (version_id, parent_id, sort_order),
  CONSTRAINT fk_cn_version FOREIGN KEY (version_id) REFERENCES curriculum_versions(id) ON DELETE CASCADE,
  CONSTRAINT fk_cn_parent FOREIGN KEY (parent_id) REFERENCES curriculum_nodes(id) ON DELETE CASCADE,
  CONSTRAINT fk_cn_standard FOREIGN KEY (standard_id) REFERENCES standards(id)
) ENGINE=InnoDB COMMENT='Cây chương → bài → mục tiêu';

ALTER TABLE class_sessions ADD CONSTRAINT fk_cls_lesson FOREIGN KEY (lesson_node_id) REFERENCES curriculum_nodes(id) ON DELETE SET NULL;

CREATE TABLE curriculum_suggestions (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()),
  version_id     CHAR(36)     NOT NULL,
  after_node_id  CHAR(36)     NULL COMMENT 'Vị trí chèn',
  standard_id    CHAR(36)     NULL,
  title          VARCHAR(300) NOT NULL,
  proposed_content TEXT       NOT NULL,
  rationale      TEXT         NOT NULL,
  status         ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  decided_by     CHAR(36)     NULL,
  decided_at     DATETIME(3)  NULL,
  ai_job_id      CHAR(36)     NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_csg_version FOREIGN KEY (version_id) REFERENCES curriculum_versions(id) ON DELETE CASCADE,
  CONSTRAINT fk_csg_after FOREIGN KEY (after_node_id) REFERENCES curriculum_nodes(id) ON DELETE SET NULL,
  CONSTRAINT fk_csg_standard FOREIGN KEY (standard_id) REFERENCES standards(id),
  CONSTRAINT fk_csg_decider FOREIGN KEY (decided_by) REFERENCES users(id),
  CONSTRAINT fk_csg_job FOREIGN KEY (ai_job_id) REFERENCES ai_jobs(id)
) ENGINE=InnoDB COMMENT='AI-02: AI đề xuất → Trưởng bộ môn duyệt';

CREATE TABLE lesson_plans (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id    CHAR(36)     NOT NULL,
  lesson_node_id CHAR(36)   NULL,
  teacher_id   CHAR(36)     NOT NULL,
  title        VARCHAR(300) NOT NULL,
  content      MEDIUMTEXT   NULL,
  file_id      CHAR(36)     NULL,
  status       ENUM('draft','submitted','approved','rejected') NOT NULL DEFAULT 'draft',
  approved_by  CHAR(36)     NULL,
  approved_at  DATETIME(3)  NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at   DATETIME(3)  NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_lp_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_lp_node FOREIGN KEY (lesson_node_id) REFERENCES curriculum_nodes(id) ON DELETE SET NULL,
  CONSTRAINT fk_lp_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  CONSTRAINT fk_lp_file FOREIGN KEY (file_id) REFERENCES files(id),
  CONSTRAINT fk_lp_approver FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='FR-504';

CREATE TABLE materials (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id     CHAR(36)     NOT NULL,
  class_id      CHAR(36)     NULL,
  session_id    CHAR(36)     NULL,
  lesson_plan_id CHAR(36)    NULL,
  type          ENUM('worksheet','vocabulary','slides','image','document','link','video') NOT NULL,
  title         VARCHAR(300) NOT NULL,
  body          MEDIUMTEXT   NULL,
  file_id       CHAR(36)     NULL,
  url           VARCHAR(500) NULL,
  allow_download TINYINT(1)  NOT NULL DEFAULT 1,
  is_ai         TINYINT(1)   NOT NULL DEFAULT 0,
  status        ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  published_by  CHAR(36)     NULL,
  published_at  DATETIME(3)  NULL,
  created_by    CHAR(36)     NOT NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at    DATETIME(3)  NULL,
  PRIMARY KEY (id),
  KEY ix_mat_class (class_id, status),
  FULLTEXT KEY ft_mat_title (title),
  CONSTRAINT fk_mat_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_mat_class FOREIGN KEY (class_id) REFERENCES classes(id),
  CONSTRAINT fk_mat_session FOREIGN KEY (session_id) REFERENCES class_sessions(id) ON DELETE SET NULL,
  CONSTRAINT fk_mat_lp FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE SET NULL,
  CONSTRAINT fk_mat_file FOREIGN KEY (file_id) REFERENCES files(id),
  CONSTRAINT fk_mat_publisher FOREIGN KEY (published_by) REFERENCES users(id),
  CONSTRAINT fk_mat_creator FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT ck_mat_ai CHECK (is_ai = 0 OR status <> 'published' OR published_by IS NOT NULL)
) ENGINE=InnoDB COMMENT='FR-505, FR-507';

CREATE TABLE videos (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  lesson_plan_id CHAR(36)    NOT NULL,
  level         ENUM('slides_tts','avatar') NOT NULL DEFAULT 'slides_tts',
  script        JSON         NULL COMMENT 'Các cảnh: lời đọc + nội dung slide',
  script_approved_by CHAR(36) NULL,
  script_approved_at DATETIME(3) NULL,
  file_id       CHAR(36)     NULL,
  subtitle_file_id CHAR(36)  NULL,
  duration_s    INT          NULL,
  status        ENUM('scripting','script_review','rendering','video_review','published','failed') NOT NULL DEFAULT 'scripting',
  approved_by   CHAR(36)     NULL,
  ai_job_id     CHAR(36)     NULL,
  created_by    CHAR(36)     NOT NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_vid_lp FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id),
  CONSTRAINT fk_vid_sapprover FOREIGN KEY (script_approved_by) REFERENCES users(id),
  CONSTRAINT fk_vid_file FOREIGN KEY (file_id) REFERENCES files(id),
  CONSTRAINT fk_vid_sub FOREIGN KEY (subtitle_file_id) REFERENCES files(id),
  CONSTRAINT fk_vid_approver FOREIGN KEY (approved_by) REFERENCES users(id),
  CONSTRAINT fk_vid_job FOREIGN KEY (ai_job_id) REFERENCES ai_jobs(id),
  CONSTRAINT fk_vid_creator FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT ck_vid_render CHECK (status NOT IN ('rendering','video_review','published') OR script_approved_by IS NOT NULL)
) ENGINE=InnoDB COMMENT='AI-04: chỉ dựng sau khi duyệt kịch bản';

-- =====================================================================
-- 6. BÀI TẬP, THI, ĐÁNH GIÁ
-- =====================================================================

CREATE TABLE rubrics (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id   CHAR(36)     NOT NULL,
  name        VARCHAR(150) NOT NULL,
  skill       ENUM('speaking','writing') NOT NULL,
  criteria    JSON         NOT NULL COMMENT '[{"code":"TA","name":"Task Achievement","max":9}]',
  created_by  CHAR(36)     NOT NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_rub_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_rub_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE questions (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id    CHAR(36)     NOT NULL,
  type         ENUM('single_choice','multi_choice','true_false','fill_blank','matching','ordering','listening','speaking','essay','file_upload') NOT NULL,
  stem         TEXT         NOT NULL,
  options      JSON         NULL,
  answer_key   JSON         NULL COMMENT 'Không bao giờ trả về cho học sinh trước khi công bố',
  explanation  TEXT         NULL,
  audio_file_id CHAR(36)    NULL,
  image_file_id CHAR(36)    NULL,
  skill        ENUM('listening','speaking','reading','writing','grammar','vocabulary') NOT NULL,
  difficulty   TINYINT      NOT NULL DEFAULT 2 COMMENT '1 dễ ... 5 khó',
  framework    ENUM('YLE','CEFR','GDPT2018','IELTS') NOT NULL,
  level_code   VARCHAR(20)  NOT NULL,
  topic        VARCHAR(100) NULL,
  rubric_id    CHAR(36)     NULL,
  points       DECIMAL(6,2) NOT NULL DEFAULT 1,
  is_ai        TINYINT(1)   NOT NULL DEFAULT 0,
  status       ENUM('draft','approved','archived') NOT NULL DEFAULT 'draft',
  approved_by  CHAR(36)     NULL,
  created_by   CHAR(36)     NOT NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at   DATETIME(3)  NULL,
  PRIMARY KEY (id),
  KEY ix_q_filter (branch_id, status, skill, framework, level_code, difficulty),
  CONSTRAINT fk_q_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_q_audio FOREIGN KEY (audio_file_id) REFERENCES files(id),
  CONSTRAINT fk_q_image FOREIGN KEY (image_file_id) REFERENCES files(id),
  CONSTRAINT fk_q_rubric FOREIGN KEY (rubric_id) REFERENCES rubrics(id),
  CONSTRAINT fk_q_approver FOREIGN KEY (approved_by) REFERENCES users(id),
  CONSTRAINT fk_q_creator FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT ck_q_difficulty CHECK (difficulty BETWEEN 1 AND 5),
  CONSTRAINT ck_q_approved CHECK (status <> 'approved' OR approved_by IS NOT NULL)
) ENGINE=InnoDB COMMENT='Ngân hàng câu hỏi (FR-601, FR-602)';

CREATE TABLE assignments (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id        CHAR(36)     NOT NULL,
  class_id         CHAR(36)     NULL,
  title            VARCHAR(300) NOT NULL,
  kind             ENUM('homework','practice','test','placement','skill_test','recommended') NOT NULL,
  instructions     TEXT         NULL,
  opens_at         DATETIME(3)  NULL,
  due_at           DATETIME(3)  NULL,
  time_limit_min   INT          NULL,
  attempts_allowed INT          NOT NULL DEFAULT 1,
  shuffle          TINYINT(1)   NOT NULL DEFAULT 0,
  show_answer_mode ENUM('immediately','after_due','after_publish') NOT NULL DEFAULT 'after_publish',
  published_at     DATETIME(3)  NULL COMMENT 'Thời điểm GV công bố kết quả',
  created_by       CHAR(36)     NOT NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at       DATETIME(3)  NULL,
  PRIMARY KEY (id),
  KEY ix_asg_class_due (class_id, due_at),
  CONSTRAINT fk_asg_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_asg_class FOREIGN KEY (class_id) REFERENCES classes(id),
  CONSTRAINT fk_asg_creator FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT ck_asg_attempts CHECK (attempts_allowed >= 1)
) ENGINE=InnoDB COMMENT='FR-603';

CREATE TABLE assignment_questions (
  assignment_id CHAR(36)     NOT NULL,
  question_id   CHAR(36)     NOT NULL,
  sort_order    INT          NOT NULL DEFAULT 0,
  points        DECIMAL(6,2) NULL COMMENT 'Ghi đè điểm của câu',
  PRIMARY KEY (assignment_id, question_id),
  CONSTRAINT fk_aq_asg FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  CONSTRAINT fk_aq_q FOREIGN KEY (question_id) REFERENCES questions(id)
) ENGINE=InnoDB COMMENT='FK RESTRICT: không xóa được câu đang dùng';

CREATE TABLE assignment_targets (
  id            CHAR(36) NOT NULL DEFAULT (UUID()),
  assignment_id CHAR(36) NOT NULL,
  target_type   ENUM('class','group','student') NOT NULL,
  class_id      CHAR(36) NULL,
  group_id      CHAR(36) NULL,
  student_id    CHAR(36) NULL,
  PRIMARY KEY (id),
  KEY ix_at_asg (assignment_id),
  KEY ix_at_student (student_id),
  CONSTRAINT fk_at_asg FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  CONSTRAINT fk_at_class FOREIGN KEY (class_id) REFERENCES classes(id),
  CONSTRAINT fk_at_group FOREIGN KEY (group_id) REFERENCES study_groups(id),
  CONSTRAINT fk_at_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT ck_at_one CHECK (
    (target_type = 'class'   AND class_id   IS NOT NULL AND group_id IS NULL AND student_id IS NULL) OR
    (target_type = 'group'   AND group_id   IS NOT NULL AND class_id IS NULL AND student_id IS NULL) OR
    (target_type = 'student' AND student_id IS NOT NULL AND class_id IS NULL AND group_id IS NULL))
) ENGINE=InnoDB;

CREATE TABLE attempts (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  assignment_id CHAR(36)     NOT NULL,
  student_id    CHAR(36)     NULL COMMENT 'NULL với test đầu vào của khách',
  lead_id       CHAR(36)     NULL,
  attempt_no    INT          NOT NULL DEFAULT 1,
  started_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  submitted_at  DATETIME(3)  NULL,
  submit_mode   ENUM('manual','timeout') NULL,
  auto_score    DECIMAL(7,2) NULL COMMENT 'Phần khách quan',
  ai_score      DECIMAL(7,2) NULL,
  final_score   DECIMAL(7,2) NULL,
  max_score     DECIMAL(7,2) NULL,
  band          VARCHAR(10)  NULL,
  graded_by     CHAR(36)     NULL,
  graded_at     DATETIME(3)  NULL,
  tab_leaves    INT          NOT NULL DEFAULT 0 COMMENT 'FR-612',
  teacher_feedback TEXT      NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_attempt (assignment_id, student_id, attempt_no),
  KEY ix_att_student_time (student_id, submitted_at),
  CONSTRAINT fk_atp_asg FOREIGN KEY (assignment_id) REFERENCES assignments(id),
  CONSTRAINT fk_atp_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_atp_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
  CONSTRAINT fk_atp_grader FOREIGN KEY (graded_by) REFERENCES users(id),
  CONSTRAINT ck_atp_owner CHECK (student_id IS NOT NULL OR lead_id IS NOT NULL)
) ENGINE=InnoDB COMMENT='Lượt làm bài; nộp 2 lần cùng lúc chặn bằng khóa dòng ở ứng dụng';

CREATE TABLE answers (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  attempt_id    CHAR(36)     NOT NULL,
  question_id   CHAR(36)     NOT NULL,
  response      JSON         NULL,
  file_id       CHAR(36)     NULL COMMENT 'Ảnh bài viết tay / ghi âm',
  transcript    TEXT         NULL COMMENT 'Chữ AI đọc được từ ảnh/ghi âm',
  is_correct    TINYINT(1)   NULL,
  auto_points   DECIMAL(6,2) NULL,
  ai_points     DECIMAL(6,2) NULL,
  ai_feedback   JSON         NULL COMMENT 'Điểm từng tiêu chí + trích câu',
  final_points  DECIMAL(6,2) NULL,
  ai_job_id     CHAR(36)     NULL,
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_answer (attempt_id, question_id),
  CONSTRAINT fk_ans_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_ans_q FOREIGN KEY (question_id) REFERENCES questions(id),
  CONSTRAINT fk_ans_file FOREIGN KEY (file_id) REFERENCES files(id),
  CONSTRAINT fk_ans_job FOREIGN KEY (ai_job_id) REFERENCES ai_jobs(id)
) ENGINE=InnoDB COMMENT='Lưu nháp = upsert theo (attempt_id, question_id)';

CREATE TABLE regrade_requests (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  attempt_id   CHAR(36)     NOT NULL,
  requested_by CHAR(36)     NOT NULL,
  reason       VARCHAR(1000) NOT NULL,
  status       ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  old_score    DECIMAL(7,2) NULL,
  new_score    DECIMAL(7,2) NULL,
  response     VARCHAR(1000) NULL,
  resolved_by  CHAR(36)     NULL,
  resolved_at  DATETIME(3)  NULL,
  escalated_at DATETIME(3)  NULL COMMENT 'Quá 3 ngày làm việc báo Giáo vụ',
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_regrade_once (attempt_id) COMMENT 'Mỗi bài chỉ chấm lại 1 lần',
  CONSTRAINT fk_rg_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id),
  CONSTRAINT fk_rg_requester FOREIGN KEY (requested_by) REFERENCES users(id),
  CONSTRAINT fk_rg_resolver FOREIGN KEY (resolved_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='FR-609; hạn 7 ngày kiểm tra ở ứng dụng';

CREATE TABLE evaluations (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  student_id   CHAR(36)     NOT NULL,
  class_id     CHAR(36)     NOT NULL,
  session_id   CHAR(36)     NULL,
  teacher_id   CHAR(36)     NOT NULL,
  period       ENUM('session','month','course') NOT NULL,
  attitude     TINYINT      NULL COMMENT '1..5',
  focus        TINYINT      NULL,
  progress     TINYINT      NULL,
  comment      TEXT         NULL,
  template_code VARCHAR(40) NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_ev_student (student_id, created_at),
  CONSTRAINT fk_ev_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_ev_class FOREIGN KEY (class_id) REFERENCES classes(id),
  CONSTRAINT fk_ev_session FOREIGN KEY (session_id) REFERENCES class_sessions(id) ON DELETE SET NULL,
  CONSTRAINT fk_ev_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
) ENGINE=InnoDB COMMENT='Đánh giá định tính (FR-701)';

CREATE TABLE competency_scores (
  id                CHAR(36)     NOT NULL DEFAULT (UUID()),
  student_id        CHAR(36)     NOT NULL,
  skill             ENUM('listening','speaking','reading','writing','grammar','vocabulary') NOT NULL,
  framework         ENUM('YLE','CEFR','GDPT2018','IELTS') NOT NULL,
  score             DECIMAL(6,2) NOT NULL,
  level_code        VARCHAR(20)  NULL,
  source_attempt_id CHAR(36)     NOT NULL COMMENT 'Truy về bài test (FR-702)',
  measured_at       DATETIME(3)  NOT NULL,
  PRIMARY KEY (id),
  KEY ix_cs_student (student_id, skill, measured_at),
  CONSTRAINT fk_comp_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_comp_attempt FOREIGN KEY (source_attempt_id) REFERENCES attempts(id)
) ENGINE=InnoDB;

-- =====================================================================
-- 7. GIAO TIẾP
-- =====================================================================

CREATE TABLE conversations (
  id          CHAR(36)    NOT NULL DEFAULT (UUID()),
  branch_id   CHAR(36)    NOT NULL,
  kind        ENUM('guardian_teacher','student_teacher','guardian_staff') NOT NULL,
  student_id  CHAR(36)    NULL COMMENT 'Học sinh liên quan',
  last_message_at DATETIME(3) NULL,
  locked_at   DATETIME(3) NULL COMMENT 'Admin tạm khóa (FR-904)',
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_conv_student (student_id),
  CONSTRAINT fk_conv_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_conv_student FOREIGN KEY (student_id) REFERENCES students(id)
) ENGINE=InnoDB COMMENT='Chỉ 1-1; không có kiểu học sinh-học sinh';

CREATE TABLE conversation_participants (
  conversation_id CHAR(36)    NOT NULL,
  user_id         CHAR(36)    NOT NULL,
  last_read_at    DATETIME(3) NULL,
  muted           TINYINT(1)  NOT NULL DEFAULT 0,
  PRIMARY KEY (conversation_id, user_id),
  KEY ix_cp_user (user_id),
  CONSTRAINT fk_cp_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE messages (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()),
  conversation_id CHAR(36)     NOT NULL,
  sender_id       CHAR(36)     NOT NULL,
  body            TEXT         NULL,
  attachments     JSON         NULL COMMENT '[{file_id, kind: image|file|audio}]',
  is_urgent       TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'Đẩy cả ngoài khung giờ',
  edited_at       DATETIME(3)  NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_msg_conv (conversation_id, created_at),
  FULLTEXT KEY ft_msg_body (body),
  CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='FR-901, FR-902: không xóa được (trigger)';

CREATE TABLE message_edits (
  id            BIGINT      NOT NULL AUTO_INCREMENT,
  message_id    CHAR(36)    NOT NULL,
  previous_body TEXT        NULL,
  edited_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_me_msg (message_id),
  CONSTRAINT fk_me_msg FOREIGN KEY (message_id) REFERENCES messages(id)
) ENGINE=InnoDB COMMENT='Giữ bản gốc khi sửa trong 5 phút';

CREATE TABLE message_reports (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  message_id  CHAR(36)     NOT NULL,
  reported_by CHAR(36)     NOT NULL,
  reason      VARCHAR(500) NOT NULL,
  status      ENUM('open','reviewing','resolved','dismissed') NOT NULL DEFAULT 'open',
  handled_by  CHAR(36)     NULL,
  resolution  VARCHAR(1000) NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_mr_msg FOREIGN KEY (message_id) REFERENCES messages(id),
  CONSTRAINT fk_mr_reporter FOREIGN KEY (reported_by) REFERENCES users(id),
  CONSTRAINT fk_mr_handler FOREIGN KEY (handled_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='FR-904';

CREATE TABLE chat_access_requests (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  guardian_id  CHAR(36)     NOT NULL,
  student_id   CHAR(36)     NOT NULL,
  conversation_id CHAR(36)  NOT NULL,
  reason       VARCHAR(1000) NOT NULL,
  status       ENUM('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
  decided_by   CHAR(36)     NULL,
  decision_note VARCHAR(500) NULL,
  decided_at   DATETIME(3)  NULL,
  expires_at   DATETIME(3)  NULL COMMENT 'decided_at + 72 giờ',
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_car_guardian FOREIGN KEY (guardian_id) REFERENCES guardians(id),
  CONSTRAINT fk_car_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_car_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT fk_car_decider FOREIGN KEY (decided_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='FR-903; mỗi lượt xem ghi audit_logs';

CREATE TABLE announcements (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  class_id    CHAR(36)     NOT NULL,
  author_id   CHAR(36)     NOT NULL,
  title       VARCHAR(200) NOT NULL,
  body        TEXT         NOT NULL,
  attachments JSON         NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  deleted_at  DATETIME(3)  NULL,
  PRIMARY KEY (id),
  KEY ix_ann_class (class_id, created_at),
  CONSTRAINT fk_ann_class FOREIGN KEY (class_id) REFERENCES classes(id),
  CONSTRAINT fk_ann_author FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='Bảng tin lớp (FR-905) — không có bình luận';

CREATE TABLE announcement_reads (
  announcement_id CHAR(36)    NOT NULL,
  user_id         CHAR(36)    NOT NULL,
  read_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (announcement_id, user_id),
  CONSTRAINT fk_ar_ann FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  CONSTRAINT fk_ar_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id     CHAR(36)     NOT NULL,
  category    VARCHAR(40)  NOT NULL COMMENT 'attendance_in, attendance_absent, schedule_change, assignment_new, due_soon, result, evaluation, fee, message, announcement, daily_summary, system',
  title       VARCHAR(200) NOT NULL,
  body        VARCHAR(1000) NULL,
  link        VARCHAR(500) NULL,
  student_id  CHAR(36)     NULL COMMENT 'Ghi rõ con nào (FR-805)',
  is_mandatory TINYINT(1)  NOT NULL DEFAULT 0 COMMENT 'Vắng mặt, đổi lịch: không tắt được',
  scheduled_for DATETIME(3) NULL COMMENT 'Gom sau giờ yên lặng',
  pushed_at   DATETIME(3)  NULL,
  read_at     DATETIME(3)  NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_notif_user (user_id, read_at, created_at),
  KEY ix_notif_queue (pushed_at, scheduled_for),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_student FOREIGN KEY (student_id) REFERENCES students(id)
) ENGINE=InnoDB;

CREATE TABLE notification_preferences (
  user_id   CHAR(36)    NOT NULL,
  category  VARCHAR(40) NOT NULL,
  push_on   TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, category),
  CONSTRAINT fk_np_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Không cho tắt attendance_absent và schedule_change (ứng dụng chặn)';

CREATE TABLE push_subscriptions (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id     CHAR(36)     NOT NULL,
  endpoint    VARCHAR(700) NOT NULL,
  endpoint_hash CHAR(64)   NOT NULL,
  p256dh      VARCHAR(255) NOT NULL,
  auth        VARCHAR(255) NOT NULL,
  user_agent  VARCHAR(255) NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_ok_at  DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_push_endpoint (endpoint_hash),
  CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Web Push (FR-1001)';

-- =====================================================================
-- 8. BÁO CÁO & KHẢO SÁT
-- =====================================================================

CREATE TABLE daily_summaries (
  id          CHAR(36)    NOT NULL DEFAULT (UUID()),
  student_id  CHAR(36)    NOT NULL,
  summary_date DATE       NOT NULL,
  facts       JSON        NOT NULL COMMENT 'Dữ kiện nguồn: điểm danh, bài nộp, điểm',
  text_vi     TEXT        NOT NULL,
  sent_at     DATETIME(3) NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_ds (student_id, summary_date),
  CONSTRAINT fk_ds_student FOREIGN KEY (student_id) REFERENCES students(id)
) ENGINE=InnoDB COMMENT='FR-802: 20:00, chỉ khi có hoạt động';

CREATE TABLE monthly_reports (
  id          CHAR(36)    NOT NULL DEFAULT (UUID()),
  student_id  CHAR(36)    NOT NULL,
  report_month CHAR(7)    NOT NULL COMMENT 'YYYY-MM',
  facts       JSON        NOT NULL,
  ai_draft    TEXT        NULL,
  final_text  TEXT        NULL,
  status      ENUM('drafted','approved','sent') NOT NULL DEFAULT 'drafted',
  approved_by CHAR(36)    NULL,
  approved_at DATETIME(3) NULL,
  sent_at     DATETIME(3) NULL,
  guardian_feedback TEXT  NULL,
  ai_job_id   CHAR(36)    NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_mr (student_id, report_month),
  CONSTRAINT fk_mrep_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_mrep_approver FOREIGN KEY (approved_by) REFERENCES users(id),
  CONSTRAINT fk_mrep_job FOREIGN KEY (ai_job_id) REFERENCES ai_jobs(id),
  CONSTRAINT ck_mrep_sent CHECK (status <> 'sent' OR approved_by IS NOT NULL)
) ENGINE=InnoDB COMMENT='FR-803 / AI-09: phải có GV duyệt mới gửi';

CREATE TABLE surveys (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id   CHAR(36)     NOT NULL,
  title       VARCHAR(200) NOT NULL,
  audience    ENUM('guardian','student') NOT NULL,
  questions   JSON         NOT NULL COMMENT '5–7 câu, thang 5 sao + 1 ô góp ý',
  period_code VARCHAR(20)  NOT NULL COMMENT 'vd: 2026-11 hoặc mã khóa',
  opens_at    DATETIME(3)  NOT NULL,
  closes_at   DATETIME(3)  NOT NULL,
  created_by  CHAR(36)     NOT NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_sv_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_sv_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='FR-1301';

CREATE TABLE survey_responses (
  id            CHAR(36)    NOT NULL DEFAULT (UUID()),
  survey_id     CHAR(36)    NOT NULL,
  respondent_hash CHAR(64)  NOT NULL COMMENT 'HMAC(user_id) — chặn trả lời 2 lần mà không lộ danh tính với GV',
  teacher_id    CHAR(36)    NOT NULL,
  class_id      CHAR(36)    NULL,
  answers       JSON        NOT NULL,
  avg_stars     DECIMAL(3,2) NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_sr_once (survey_id, respondent_hash, teacher_id),
  KEY ix_sr_teacher (teacher_id),
  CONSTRAINT fk_sr_survey FOREIGN KEY (survey_id) REFERENCES surveys(id),
  CONSTRAINT fk_sr_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  CONSTRAINT fk_sr_class FOREIGN KEY (class_id) REFERENCES classes(id)
) ENGINE=InnoDB;

CREATE TABLE teacher_metrics (
  teacher_id        CHAR(36)     NOT NULL,
  metric_month      CHAR(7)      NOT NULL COMMENT 'YYYY-MM',
  survey_avg        DECIMAL(3,2) NULL,
  survey_count      INT          NOT NULL DEFAULT 0,
  class_attendance_rate DECIMAL(5,4) NULL,
  student_progress_avg  DECIMAL(6,2) NULL,
  reply_median_min  INT          NULL COMMENT 'Thời gian phản hồi tin nhắn — KHÔNG đọc nội dung',
  on_time_grading_rate DECIMAL(5,4) NULL,
  computed_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (teacher_id, metric_month),
  CONSTRAINT fk_tm_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
) ENGINE=InnoDB COMMENT='FR-1302';

-- =====================================================================
-- 9. TÀI CHÍNH
-- =====================================================================

CREATE TABLE invoices (
  id            CHAR(36)    NOT NULL DEFAULT (UUID()),
  branch_id     CHAR(36)    NOT NULL,
  student_id    CHAR(36)    NOT NULL,
  enrollment_id CHAR(36)    NULL,
  fee_plan_id   CHAR(36)    NULL,
  description   VARCHAR(255) NOT NULL,
  amount_vnd    BIGINT      NOT NULL,
  discount_vnd  BIGINT      NOT NULL DEFAULT 0,
  discount_reason VARCHAR(255) NULL,
  paid_vnd      BIGINT      NOT NULL DEFAULT 0,
  due_date      DATE        NOT NULL,
  status        ENUM('unpaid','partial','paid','void') NOT NULL DEFAULT 'unpaid',
  created_by    CHAR(36)    NOT NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_inv_student (student_id, status),
  KEY ix_inv_due (branch_id, status, due_date),
  CONSTRAINT fk_inv_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_inv_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_inv_enr FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
  CONSTRAINT fk_inv_fee FOREIGN KEY (fee_plan_id) REFERENCES fee_plans(id),
  CONSTRAINT fk_inv_creator FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT ck_inv_amounts CHECK (amount_vnd >= 0 AND discount_vnd >= 0 AND discount_vnd <= amount_vnd AND paid_vnd >= 0)
) ENGINE=InnoDB COMMENT='FR-1101, FR-1102';

CREATE TABLE payments (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  invoice_id    CHAR(36)     NOT NULL,
  amount_vnd    BIGINT       NOT NULL,
  method        ENUM('cash','bank_transfer','gateway') NOT NULL,
  gateway_txn_id VARCHAR(100) NULL,
  paid_at       DATETIME(3)  NOT NULL,
  recorded_by   CHAR(36)     NULL COMMENT 'NULL = webhook cổng thanh toán',
  note          VARCHAR(255) NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pay_gateway (gateway_txn_id),
  CONSTRAINT fk_pay_inv FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  CONSTRAINT fk_pay_user FOREIGN KEY (recorded_by) REFERENCES users(id),
  CONSTRAINT ck_pay_amount CHECK (amount_vnd > 0)
) ENGINE=InnoDB;

CREATE TABLE receipt_counters (
  branch_id  CHAR(36) NOT NULL,
  year_no    SMALLINT NOT NULL,
  last_no    INT      NOT NULL DEFAULT 0,
  PRIMARY KEY (branch_id, year_no),
  CONSTRAINT fk_rc_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB COMMENT='Cấp số biên nhận không trùng (SELECT ... FOR UPDATE)';

CREATE TABLE receipts (
  id          CHAR(36)    NOT NULL DEFAULT (UUID()),
  payment_id  CHAR(36)    NOT NULL,
  receipt_no  VARCHAR(30) NOT NULL COMMENT 'vd: BN-2026-000123',
  file_id     CHAR(36)    NULL,
  sent_at     DATETIME(3) NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_receipt_no (receipt_no),
  UNIQUE KEY uq_receipt_payment (payment_id),
  CONSTRAINT fk_rcp_pay FOREIGN KEY (payment_id) REFERENCES payments(id),
  CONSTRAINT fk_rcp_file FOREIGN KEY (file_id) REFERENCES files(id)
) ENGINE=InnoDB;

CREATE TABLE pay_rates (
  id            CHAR(36)    NOT NULL DEFAULT (UUID()),
  teacher_id    CHAR(36)    NULL COMMENT 'NULL = áp dụng theo loại lớp',
  class_mode    ENUM('offline','online','hybrid') NULL,
  program_id    CHAR(36)    NULL,
  rate_vnd      BIGINT      NOT NULL,
  effective_from DATE       NOT NULL,
  effective_to  DATE        NULL,
  created_by    CHAR(36)    NOT NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_pr_teacher (teacher_id, effective_from),
  CONSTRAINT fk_prt_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  CONSTRAINT fk_prt_program FOREIGN KEY (program_id) REFERENCES programs(id),
  CONSTRAINT fk_prt_creator FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT ck_prt_rate CHECK (rate_vnd >= 0)
) ENGINE=InnoDB COMMENT='FR-1104: đơn giá mỗi buổi do Admin đặt';

CREATE TABLE payroll_periods (
  id          CHAR(36)    NOT NULL DEFAULT (UUID()),
  branch_id   CHAR(36)    NOT NULL,
  period_month CHAR(7)    NOT NULL COMMENT 'YYYY-MM',
  status      ENUM('open','review','closed') NOT NULL DEFAULT 'open',
  closed_by   CHAR(36)    NULL,
  closed_at   DATETIME(3) NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pp (branch_id, period_month),
  CONSTRAINT fk_pp_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_pp_closer FOREIGN KEY (closed_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE payroll_items (
  id             CHAR(36)    NOT NULL DEFAULT (UUID()),
  period_id      CHAR(36)    NOT NULL,
  teacher_id     CHAR(36)    NOT NULL,
  sessions_count INT         NOT NULL DEFAULT 0 COMMENT 'Chỉ buổi đã xác thực',
  rate_vnd       BIGINT      NOT NULL,
  adjustments_vnd BIGINT     NOT NULL DEFAULT 0,
  adjustment_note VARCHAR(500) NULL,
  total_vnd      BIGINT      NOT NULL,
  teacher_feedback VARCHAR(1000) NULL,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pi (period_id, teacher_id),
  CONSTRAINT fk_pi_period FOREIGN KEY (period_id) REFERENCES payroll_periods(id),
  CONSTRAINT fk_pi_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
) ENGINE=InnoDB COMMENT='FR-1105: khóa khi kỳ lương đã chốt (trigger)';

CREATE TABLE payroll_sessions (
  payroll_item_id CHAR(36) NOT NULL,
  session_id      CHAR(36) NOT NULL,
  PRIMARY KEY (payroll_item_id, session_id),
  UNIQUE KEY uq_ps_session (session_id) COMMENT 'Một buổi chỉ tính lương 1 lần',
  CONSTRAINT fk_ps_item FOREIGN KEY (payroll_item_id) REFERENCES payroll_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_session FOREIGN KEY (session_id) REFERENCES class_sessions(id)
) ENGINE=InnoDB;

-- =====================================================================
-- 10. TRIGGER BẢO VỆ DỮ LIỆU
-- =====================================================================

DELIMITER $$

CREATE TRIGGER trg_messages_no_delete BEFORE DELETE ON messages
FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tin nhắn không được xóa (FR-902)';
END$$

CREATE TRIGGER trg_messages_keep_original BEFORE UPDATE ON messages
FOR EACH ROW BEGIN
  IF NOT (OLD.body <=> NEW.body) THEN
    IF TIMESTAMPDIFF(SECOND, OLD.created_at, CURRENT_TIMESTAMP(3)) > 300 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chỉ sửa tin nhắn trong 5 phút (FR-902)';
    END IF;
    INSERT INTO message_edits (message_id, previous_body) VALUES (OLD.id, OLD.body);
    SET NEW.edited_at = CURRENT_TIMESTAMP(3);
  END IF;
  IF NOT (OLD.conversation_id <=> NEW.conversation_id) OR NOT (OLD.sender_id <=> NEW.sender_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không đổi người gửi/hội thoại của tin nhắn';
  END IF;
END$$

CREATE TRIGGER trg_message_edits_no_delete BEFORE DELETE ON message_edits
FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lịch sử sửa tin nhắn không được xóa';
END$$

CREATE TRIGGER trg_message_edits_no_update BEFORE UPDATE ON message_edits
FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lịch sử sửa tin nhắn không được sửa';
END$$

CREATE TRIGGER trg_audit_no_update BEFORE UPDATE ON audit_logs
FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nhật ký thao tác không được sửa (FR-1501)';
END$$

CREATE TRIGGER trg_audit_no_delete BEFORE DELETE ON audit_logs
FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nhật ký thao tác không được xóa (FR-1501)';
END$$

CREATE TRIGGER trg_consents_no_delete BEFORE DELETE ON consents
FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bản ghi đồng ý không được xóa; dùng withdrawn_at';
END$$

CREATE TRIGGER trg_guardianships_max4 BEFORE INSERT ON guardianships
FOR EACH ROW BEGIN
  IF (SELECT COUNT(*) FROM guardianships WHERE student_id = NEW.student_id) >= 4 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mỗi học sinh tối đa 4 phụ huynh (FR-202)';
  END IF;
END$$

CREATE TRIGGER trg_payroll_items_locked BEFORE UPDATE ON payroll_items
FOR EACH ROW BEGIN
  IF (SELECT status FROM payroll_periods WHERE id = OLD.period_id) = 'closed' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kỳ lương đã chốt, không sửa được (FR-1105)';
  END IF;
END$$

CREATE TRIGGER trg_payroll_items_locked_del BEFORE DELETE ON payroll_items
FOR EACH ROW BEGIN
  IF (SELECT status FROM payroll_periods WHERE id = OLD.period_id) = 'closed' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kỳ lương đã chốt, không xóa được (FR-1105)';
  END IF;
END$$

CREATE TRIGGER trg_conversation_participants_no_delete BEFORE DELETE ON conversation_participants
FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không xóa người tham gia hội thoại (giữ vết)';
END$$

DELIMITER ;

-- =====================================================================
-- 11. VIEW TIỆN DÙNG
-- =====================================================================

CREATE OR REPLACE VIEW v_class_fill AS
SELECT c.id AS class_id, c.branch_id, c.code, c.name, c.capacity,
       COUNT(e.id) AS active_students,
       ROUND(COUNT(e.id) / c.capacity, 4) AS fill_rate
FROM classes c
LEFT JOIN enrollments e ON e.class_id = c.id AND e.status = 'active'
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.branch_id, c.code, c.name, c.capacity;

CREATE OR REPLACE VIEW v_lead_funnel_month AS
SELECT branch_id, DATE_FORMAT(created_at, '%Y-%m') AS lead_month, source,
       COUNT(*) AS leads_total,
       SUM(status IN ('contacted','trial_booked','trial_done','enrolled')) AS contacted,
       SUM(status IN ('trial_booked','trial_done','enrolled')) AS trial_booked,
       SUM(status IN ('trial_done','enrolled')) AS trial_done,
       SUM(status = 'enrolled') AS enrolled
FROM leads
WHERE deleted_at IS NULL
GROUP BY branch_id, DATE_FORMAT(created_at, '%Y-%m'), source;

CREATE OR REPLACE VIEW v_invoice_balance AS
SELECT i.id AS invoice_id, i.branch_id, i.student_id, i.due_date, i.status,
       i.amount_vnd - i.discount_vnd AS payable_vnd,
       COALESCE(SUM(p.amount_vnd), 0) AS paid_vnd,
       i.amount_vnd - i.discount_vnd - COALESCE(SUM(p.amount_vnd), 0) AS balance_vnd
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id
GROUP BY i.id, i.branch_id, i.student_id, i.due_date, i.status, i.amount_vnd, i.discount_vnd;

CREATE OR REPLACE VIEW v_ai_cost_month AS
SELECT branch_id, DATE_FORMAT(created_at, '%Y-%m') AS cost_month, feature, provider, model,
       COUNT(*) AS jobs, SUM(input_tokens) AS input_tokens, SUM(output_tokens) AS output_tokens,
       SUM(cost_usd) AS cost_usd
FROM ai_jobs
GROUP BY branch_id, DATE_FORMAT(created_at, '%Y-%m'), feature, provider, model;

-- =====================================================================
-- 12. DỮ LIỆU KHỞI TẠO
-- =====================================================================

SET @branch_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO branches (id, code, name, address, checkin_radius_m)
VALUES (@branch_id, 'CS1', 'CoreLink Academy — Cơ sở 1', 'Cập nhật địa chỉ thật', 150);

INSERT INTO levels (code, name, sort_order) VALUES
 ('PRE',          'Tiền tiểu học', 1),
 ('PRIMARY',      'Tiểu học',      2),
 ('LOWER_SEC',    'THCS',          3),
 ('UPPER_SEC',    'THPT',          4),
 ('STUDY_ABROAD', 'Luyện thi du học (IELTS)', 5);

INSERT INTO roles (code, name) VALUES
 ('admin',      'Admin'),
 ('academic',   'Giáo vụ'),
 ('consultant', 'Tư vấn'),
 ('accountant', 'Kế toán'),
 ('teacher',    'Giáo viên'),
 ('guardian',   'Phụ huynh'),
 ('student',    'Học sinh');

INSERT INTO permissions (code, description) VALUES
 ('user.manage',            'Tạo/sửa/khóa tài khoản'),
 ('role.manage',            'Phân quyền'),
 ('lead.manage',            'Quản lý khách tiềm năng'),
 ('chatbot.configure',      'Cấu hình chatbot, kho kiến thức'),
 ('class.manage',           'Tạo/sửa lớp, lịch, phòng'),
 ('group.approve',          'Duyệt nhóm học tập'),
 ('schedule.approve',       'Duyệt đổi lịch, dạy thay'),
 ('curriculum.manage',      'Tải giáo trình khung'),
 ('curriculum.approve',     'Duyệt giáo án / đề xuất AI'),
 ('question.manage',        'Ngân hàng câu hỏi'),
 ('assignment.manage',      'Giao bài, chấm bài (lớp mình)'),
 ('attendance.take',        'Điểm danh (lớp mình)'),
 ('attendance.edit_after',  'Sửa điểm danh sau buổi'),
 ('report.approve',         'Duyệt báo cáo tháng'),
 ('chat.access_approve',    'Duyệt phụ huynh xem chat'),
 ('chat.audit',             'Truy xuất tin nhắn khi có khiếu nại'),
 ('fee.manage',             'Học phí, công nợ'),
 ('payroll.manage',         'Bảng lương'),
 ('stats.all',              'Thống kê toàn trung tâm'),
 ('settings.manage',        'Cấu hình hệ thống, AI'),
 ('import.run',             'Nhập dữ liệu'),
 ('export.all',             'Xuất toàn bộ dữ liệu');

-- Admin: toàn quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.code = 'admin';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
  ON p.code IN ('class.manage','group.approve','schedule.approve','attendance.edit_after','import.run','user.manage')
WHERE r.code = 'academic';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('lead.manage')
WHERE r.code = 'consultant';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('fee.manage','payroll.manage')
WHERE r.code = 'accountant';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
  ON p.code IN ('question.manage','assignment.manage','attendance.take','report.approve')
WHERE r.code = 'teacher';

INSERT INTO settings (branch_id, setting_key, setting_value) VALUES
 (@branch_id, 'messaging.hours',          JSON_OBJECT('start','07:00','end','21:00')),
 (@branch_id, 'notifications.quiet_hours', JSON_OBJECT('start','21:00','end','07:00')),
 (@branch_id, 'attendance.absent_after_min', JSON_OBJECT('value',15)),
 (@branch_id, 'attendance.photo_retention_days', JSON_OBJECT('value',30)),
 (@branch_id, 'students.young_account_below_grade', JSON_OBJECT('value',6)),
 (@branch_id, 'regrade.window_days',      JSON_OBJECT('value',7)),
 (@branch_id, 'regrade.sla_workdays',     JSON_OBJECT('value',3)),
 (@branch_id, 'chat_access.hours',        JSON_OBJECT('value',72)),
 (@branch_id, 'daily_summary.send_at',    JSON_OBJECT('value','20:00')),
 (@branch_id, 'ai.monthly_budget_usd',    JSON_OBJECT('value',150,'warn_at',0.8)),
 (@branch_id, 'ai.models', JSON_OBJECT(
     'heavy','claude-sonnet-5-5',
     'light','claude-haiku-5-5',
     'fallback_heavy','gemini-3.8-flash',
     'transcribe','gemini-3.5-transcribe',
     'tts','gemini-3.8-flash-tts',
     'image','gemini-nano-banana-2.1',
     'embedding','gemini-embedding-001'));

-- Tài khoản Admin đầu tiên: KHÔNG tạo ở đây. Chạy lệnh seed của ứng dụng
-- (npm run seed:admin) để băm mật khẩu bằng Argon2 rồi gán vai trò admin.

-- Kiểm tra nhanh sau khi chạy:
-- SELECT COUNT(*) AS so_bang FROM information_schema.tables WHERE table_schema = 'corelink' AND table_type = 'BASE TABLE';

