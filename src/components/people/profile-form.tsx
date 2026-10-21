import type { MemberStatus, Role } from "@prisma/client";
import { ConfigForm, type FieldConfig } from "@/components/forms/config-form";
import { updateProfileAction } from "@/server/people/actions";
import { GRADE_OPTIONS, memberStatusLabel } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";

type Profile = {
  id: string;
  role: Role;
  fullName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  memberStatus?: MemberStatus;
  profileNote?: string | null;
  expertise?: string | null;
  gradeLevel?: number | null;
};

/** Form hồ sơ dùng chung cho giáo viên / học sinh / phụ huynh (FR-036). Quyền sửa kiểm tra lại ở server. */
export function ProfileForm({ profile }: { profile: Profile }) {
  const statuses: MemberStatus[] = ["ACTIVE", "ON_LEAVE", "INACTIVE"];
  const fields: FieldConfig[] = [
    { type: "text", name: "fullName", label: "Họ tên", required: true, maxLength: 120, defaultValue: profile.fullName },
    {
      type: "select",
      name: "memberStatus",
      label: profile.role === "STUDENT" ? "Trạng thái học tập" : "Trạng thái",
      required: true,
      options: statuses.map((s) => ({ value: s, label: memberStatusLabel(profile.role, s).label })),
      defaultValue: profile.memberStatus ?? "ACTIVE",
    },
    { type: "email", name: "email", label: "Email", maxLength: 191, defaultValue: profile.email ?? "" },
    { type: "tel", name: "phone", label: "Số điện thoại", maxLength: 20, defaultValue: profile.phone ? formatPhone(profile.phone) : "" },
    { type: "date", name: "dateOfBirth", label: "Ngày sinh", defaultValue: profile.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : "" },
    { type: "text", name: "address", label: "Địa chỉ", maxLength: 255, defaultValue: profile.address ?? "" },
  ];
  if (profile.role === "STUDENT") {
    fields.push({
      type: "select",
      name: "gradeLevel",
      label: "Khối lớp",
      required: true,
      options: [{ value: "0", label: "Tiền tiểu học" }, ...GRADE_OPTIONS],
      defaultValue: profile.gradeLevel === null || profile.gradeLevel === undefined ? "" : String(profile.gradeLevel),
    });
  }
  if (profile.role === "TEACHER") {
    fields.push({ type: "text", name: "expertise", label: "Chuyên môn / môn dạy", maxLength: 200, defaultValue: profile.expertise ?? "" });
  }
  fields.push({
    type: "textarea",
    name: "profileNote",
    label: profile.role === "STUDENT" ? "Ghi chú hồ sơ (năng lực đầu vào, mục tiêu học tập…)" : "Ghi chú hồ sơ",
    maxLength: 5000,
    rows: 3,
    wide: true,
    defaultValue: profile.profileNote ?? "",
  });
  return (
    <ConfigForm
      action={updateProfileAction}
      hidden={{ userId: profile.id, ...(profile.role !== "STUDENT" ? { gradeLevel: "" } : {}), ...(profile.role !== "TEACHER" ? { expertise: "" } : {}) }}
      submitLabel="Lưu hồ sơ"
      columns={2}
      fields={fields}
    />
  );
}
