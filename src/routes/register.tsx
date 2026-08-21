import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, AlertCircle } from "lucide-react";
import { AuthShell, AuthCard, AuthHero } from "@/components/auth-shell";
import { AuthRoleTabs } from "@/components/auth-role-tabs";
import { PasswordInput } from "@/components/password-input";
import { registerWithEmail } from "@/lib/auth-service";

const searchSchema = z.object({
  role: z.enum(["student", "teacher"]).catch("student"),
  email: z.string().catch(""),
});

export const Route = createFileRoute("/register")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Create Account — AssignEase" },
      {
        name: "description",
        content:
          "Register on AssignEase with email as a student or teacher to manage handwritten assignment submissions and live grading.",
      },
      {
        property: "og:title",
        content: "Create Account — AssignEase",
      },
      {
        property: "og:description",
        content: "Register for AssignEase with email to start submitting and grading assignments.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const [role, setRole] = useState<"student" | "teacher">(search.role);
  const [fullName, setFullName] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [email, setEmail] = useState(search.email);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) return setError("Please enter your full name.");
    if (role === "student" && enrollmentNo.trim().length < 1)
      return setError("Please enter your enrollment number.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");

    setBusy(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      await registerWithEmail({
        email: cleanEmail,
        password,
        fullName,
        role,
        enrollmentNo,
      });

      setBusy(false);

      toast.success(`Verification email sent to ${cleanEmail}!`, {
        description:
          "Please check your inbox and click the verify button to activate your account.",
        duration: 8000,
      });

      navigate({
        to: "/verify-email",
        search: { email: cleanEmail, role, token: "" },
      });
    } catch (signUpError: unknown) {
      setBusy(false);
      const msg = (signUpError as Error)?.message || "";
      setError(msg || "Could not create account. Please try again.");
    }
  }

  const isEmailAlreadyRegistered =
    error?.toLowerCase().includes("already registered") ||
    error?.toLowerCase().includes("already in use") ||
    error?.toLowerCase().includes("already associated");

  return (
    <AuthShell>
      {/* 3D Graduate Avatar */}
      <AuthHero />

      <AuthCard>
        <div className="w-full space-y-3.5">
          {/* Role Switcher Pill */}
          <div className="mb-1">
            <AuthRoleTabs value={role} onChange={setRole} />
          </div>

          <form onSubmit={register} className="w-full space-y-3">
            {/* Full Name input */}
            <div className="w-full">
              <input
                id="register-fullname"
                required
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="h-12 w-full rounded-full bg-[#13463F] px-6 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:bg-[#0f3d37] focus:ring-2 focus:ring-emerald-400/60 dark:bg-[#113e38] dark:placeholder:text-emerald-200/50"
              />
            </div>

            {/* Enrollment Number (Student only) */}
            {role === "student" && (
              <div className="w-full">
                <input
                  id="register-enrollment"
                  required
                  maxLength={40}
                  value={enrollmentNo}
                  onChange={(e) => setEnrollmentNo(e.target.value)}
                  placeholder="Enrollment Number (e.g. 014202)"
                  className="h-12 w-full rounded-full bg-[#13463F] px-6 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:bg-[#0f3d37] focus:ring-2 focus:ring-emerald-400/60 dark:bg-[#113e38] dark:placeholder:text-emerald-200/50"
                />
              </div>
            )}

            {/* Email Address */}
            <div className="w-full">
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="h-12 w-full rounded-full bg-[#13463F] px-6 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:bg-[#0f3d37] focus:ring-2 focus:ring-emerald-400/60 dark:bg-[#113e38] dark:placeholder:text-emerald-200/50"
              />
            </div>

            {/* Password */}
            <div className="w-full">
              <PasswordInput
                id="register-password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create Password (min 8 chars)"
              />
            </div>

            {/* Confirm Password */}
            <div className="w-full">
              <PasswordInput
                id="register-confirm"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm Password"
              />
            </div>

            {/* Error Notice - High visibility bold RED banner for duplicate email and errors */}
            {error && (
              <div className="space-y-2 rounded-2xl border-2 border-red-600 bg-red-50 p-4 text-center shadow-md dark:border-red-600 dark:bg-red-950/90">
                <div className="flex items-start gap-2.5 text-left">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    {isEmailAlreadyRegistered ? (
                      <div>
                        <p className="text-sm font-extrabold tracking-wide text-red-700 uppercase dark:text-red-300">
                          Email already registered
                        </p>
                        <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
                          This email address is already associated with an existing account. Please
                          sign in or use a different email.
                        </p>
                        <div className="mt-2.5">
                          <Link
                            to="/"
                            search={{ email: email.trim().toLowerCase() }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-red-700"
                          >
                            Sign In to this account →
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-red-700 dark:text-red-300">{error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-1.5">
              <button
                type="submit"
                id="email-signup-button"
                disabled={busy}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#0F685C] px-6 text-base font-semibold text-white shadow-md shadow-[#0d5c52]/20 transition-all hover:bg-[#0c564c] active:scale-[0.99] disabled:opacity-70 dark:bg-[#107568] dark:hover:bg-[#0d5c52]"
              >
                {busy ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-white" />
                    <span>Creating Account…</span>
                  </div>
                ) : (
                  `Create Account as ${role === "teacher" ? "Teacher" : "Student"}`
                )}
              </button>
            </div>

            {/* Footer Link */}
            <div className="flex items-center justify-center px-2 pt-1 text-xs font-medium sm:text-sm">
              <span className="text-muted-foreground">Already have an account?&nbsp;</span>
              <Link
                to="/"
                className="font-semibold text-[#13463F] transition-colors hover:text-[#0a2c27] hover:underline dark:text-emerald-300 dark:hover:text-emerald-100"
              >
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
