import { redirect } from "next/navigation";

export default function TeacherRequestRedirect() {
  redirect("/giao-vien/don?tab=cua-toi");
}
