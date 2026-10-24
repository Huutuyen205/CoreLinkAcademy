"use client";

import { useActionState, useState } from "react";
import { Check, Eye, EyeOff, Lock, LogIn, Mail, Sparkles, UserCheck } from "lucide-react";
import { Alert } from "@/components/ui/feedback";
import { SubmitButton } from "@/components/ui/submit-button";
import { login } from "@/server/auth/actions";
import { initialActionState } from "@/server/errors";
import { cn } from "@/lib/format";

const DEMO_ACCOUNTS = [
  { role: "ADMIN", label: "Admin", email: "admin@demo.corelink.vn", badge: "Quản trị viên" },
  { role: "TEACHER", label: "Giáo viên", email: "gv.toan@demo.corelink.vn", badge: "Giảng dạy" },
  { role: "STUDENT", label: "Học sinh", email: "hs1@demo.corelink.vn", badge: "Học tập" },
  { role: "PARENT", label: "Phụ huynh", email: "ph1@demo.corelink.vn", badge: "Đồng hành" },
];

export function LoginForm() {
  const [state, action] = useActionState(login, initialActionState);
  const [identifier, setIdentifier] = useState(state.values?.identifier ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleSelectDemo = (email: string, role: string) => {
    setIdentifier(email);
    setPassword("Demo12345");
    setSelectedRole(role);
  };

  return (
    <div className="space-y-5">
      {/* ─── 1-Click Quick Demo Switcher ─── */}
      <div className="rounded-2xl border border-primary/20 bg-primary-soft/40 p-3.5 backdrop-blur-xs">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5 text-accent animate-pulse" />
            Chọn nhanh tài khoản thử nghiệm
          </span>
          <span className="text-[11px] font-medium text-muted">Mật khẩu: Demo12345</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_ACCOUNTS.map((acc) => {
            const isSelected = selectedRole === acc.role;
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleSelectDemo(acc.email, acc.role)}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs",
                  isSelected
                    ? "bg-primary text-white shadow-sm ring-2 ring-primary/40 scale-102"
                    : "bg-surface text-ink hover:bg-white hover:text-primary hover:shadow-xs border border-line"
                )}
              >
                {isSelected ? (
                  <Check className="size-3 text-white" aria-hidden="true" />
                ) : (
                  <UserCheck className="size-3 text-primary/70" aria-hidden="true" />
                )}
                <span>{acc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form action={action} className="space-y-4" noValidate>
        {state.message && <Alert tone="danger">{state.message}</Alert>}

        <div>
          <label htmlFor="identifier" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink">
            Email hoặc số điện thoại <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
              <Mail className="size-4.5" aria-hidden="true" />
            </div>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              inputMode="email"
              placeholder="example@gmail.com hoặc 09..."
              required
              maxLength={191}
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setSelectedRole(null);
              }}
              className="w-full rounded-control border border-line-strong bg-surface py-2.5 pl-10 pr-3.5 text-sm text-ink placeholder:text-subtle transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-hidden"
            />
          </div>
          {state.fieldErrors?.identifier && (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.identifier[0]}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-ink">
              Mật khẩu <span className="text-danger">*</span>
            </label>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
              <Lock className="size-4.5" aria-hidden="true" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-control border border-line-strong bg-surface py-2.5 pl-10 pr-10 text-sm text-ink placeholder:text-subtle transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-ink cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {state.fieldErrors?.password && (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.password[0]}</p>
          )}
        </div>

        <SubmitButton
          className="mt-3 w-full justify-center gap-2 text-base font-semibold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 cursor-pointer"
          pendingLabel="Đang đăng nhập…"
        >
          <LogIn className="size-4.5" aria-hidden="true" />
          <span>Đăng nhập vào hệ thống</span>
        </SubmitButton>
      </form>
    </div>
  );
}
