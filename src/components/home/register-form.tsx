"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { useActionState } from "react";
import { Alert } from "@/components/ui/feedback";
import { CheckboxField, SelectField, TextareaField, TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { GRADE_CHOICES, SUBJECT_TABS } from "@/data/home";
import { phoneHref, SITE } from "@/data/site";
import { initialActionState } from "@/server/errors";
import { submitHomeTrialAction } from "@/server/leads/actions";
import { Reveal } from "./motion";

export function RegisterForm() {
  const [state, action] = useActionState(submitHomeTrialAction, initialActionState);
  const e = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const chosen = new Set((v.subjects ?? "").split(",").filter(Boolean));

  return (
    <section id="dang-ky" aria-labelledby="tieu-de-dang-ky" className="scroll-mt-24 px-4 py-14 sm:py-20">
      <Reveal className="mx-auto grid max-w-[1200px] overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-line lg:grid-cols-[0.85fr_1.15fr]">
        <div className="on-brand relative flex flex-col justify-between gap-8 bg-primary p-7 sm:p-10">
          <div>
            <div className="relative size-16 shrink-0 aspect-square overflow-hidden rounded-2xl ring-1 ring-white/30 shadow-md">
              <Image src="/brand/logo.png" alt="" width={64} height={64} className="size-full object-cover" />
            </div>
            <h2 id="tieu-de-dang-ky" className="mt-6 text-2xl text-white sm:text-3xl">
              Đăng ký học thử miễn phí
            </h2>
            <p className="mt-3 text-on-brand-muted">
              Để lại thông tin, giáo vụ sẽ liên hệ tư vấn, kiểm tra đầu vào và hẹn lịch học thử phù hợp với con.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <span>
                <span className="block text-on-brand-muted">Hotline</span>
                <a href={phoneHref(SITE.hotline)} className="font-semibold">
                  {SITE.hotline}
                </a>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <span>
                <span className="block text-on-brand-muted">Địa chỉ</span>
                <span className="font-semibold">{SITE.address}</span>
              </span>
            </li>
          </ul>
        </div>

        <div className="p-6 sm:p-10">
          <AnimatePresence mode="wait" initial={false}>
            {state.ok ? (
              <motion.div
                key="done"
                role="status"
                className="flex min-h-[26rem] flex-col items-center justify-center text-center"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.span
                  className="flex size-20 items-center justify-center rounded-full bg-success-soft text-success"
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
                >
                  <CheckCircle2 className="size-11" aria-hidden="true" />
                </motion.span>
                <h3 className="mt-5 text-2xl text-ink">Cảm ơn quý phụ huynh!</h3>
                <p className="mt-2 max-w-sm text-muted">
                  CoreLink Academy đã nhận được đăng ký. Giáo vụ sẽ gọi lại để tư vấn và hẹn lịch học thử trong thời gian sớm nhất.
                </p>
              </motion.div>
            ) : (
              <motion.form key="form" action={action} className="space-y-5" noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {state.message && <Alert tone="danger">{state.message}</Alert>}

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField name="parentName" defaultValue={v.parentName} label="Họ tên phụ huynh" autoComplete="name" required maxLength={120} error={e.parentName} />
                  <TextField
                    name="phone"
                    defaultValue={v.phone}
                    type="tel"
                    label="Số điện thoại"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    maxLength={20}
                    error={e.phone}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField name="studentName" defaultValue={v.studentName} label="Họ tên học sinh" required maxLength={120} error={e.studentName} />
                  <SelectField
                    name="gradeLevel"
                    defaultValue={v.gradeLevel ?? ""}
                    label="Lớp hiện tại"
                    required
                    placeholder="Chọn lớp"
                    options={GRADE_CHOICES}
                    error={e.gradeLevel}
                  />
                </div>

                <fieldset aria-describedby={e.subjectId ? "subjects-error" : undefined}>
                  <legend className="mb-2 text-sm font-medium text-ink">
                    Môn quan tâm<span className="text-danger" aria-hidden="true"> *</span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECT_TABS.map((s) => (
                      <label key={s.slug} className="cursor-pointer">
                        <input type="checkbox" name="subjects" value={s.slug} defaultChecked={chosen.has(s.slug)} className="peer sr-only" />
                        <span className="inline-flex min-h-11 items-center rounded-full border border-line-strong bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-primary peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                          {s.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {e.subjectId && (
                    <p id="subjects-error" className="mt-1.5 text-sm text-danger">
                      {e.subjectId}
                    </p>
                  )}
                </fieldset>

                <TextareaField name="note" defaultValue={v.note} label="Ghi chú" maxLength={800} rows={3} hint="Mục tiêu học tập, thời gian có thể học…" error={e.note} />

                {/* Honeypot chống bot (FR-005): người dùng không thấy ô này. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  <label htmlFor="website">Website</label>
                  <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                </div>

                <CheckboxField
                  name="consent"
                  label="Tôi đồng ý để CoreLink Academy liên hệ qua số điện thoại trên để tư vấn khóa học."
                  error={e.consent}
                />

                <SubmitButton className="w-full rounded-full sm:w-auto sm:px-8" pendingLabel="Đang gửi…">
                  Gửi đăng ký
                </SubmitButton>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </Reveal>
    </section>
  );
}
