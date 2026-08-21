import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, AlertCircle } from "lucide-react";
import { AuthShell, AuthCard, AuthHero } from "@/components/auth-shell";
import { AuthRoleTabs } from "@/components/auth-role-tabs";
import { PasswordInput } from "@/components/password-input";
import { registerWithEmail, loginWithGoogle } from "@/lib/auth-service";

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
          "Register on AssignEase with Google or email as a student or teacher to manage handwritten assignment submissions and live grading.",
      },
      {
        property: "og:title",
        content: "Create Account — AssignEase",
      },
      {
        property: "og:description",
        content:
          "Register for AssignEase with Google or email to start submitting and grading assignments.",
      },
    ],
  }),
  component: RegisterPage,
});

function GoogleIcon() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

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
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpNotAllowed, setIsOpNotAllowed] = useState(false);

  async function handleGoogleSignUp() {
    setGoogleBusy(true);
    setError(null);
    setIsOpNotAllowed(false);
    try {
      const { profile } = await loginWithGoogle(role, {
        fullName: fullName.trim() || undefined,
        enrollmentNo: role === "student" ? enrollmentNo.trim() || undefined : null,
      });
      setGoogleBusy(false);

      queryClient.setQueryData(["profile"], profile);
      await queryClient.invalidateQueries();

      toast.success(`Welcome to AssignEase, ${profile.full_name}!`);

      if (profile.role === "teacher") {
        navigate({ to: "/teacher" });
      } else {
        navigate({ to: "/student" });
      }
    } catch (err: unknown) {
      setGoogleBusy(false);
      const msg = (err as Error)?.message || "";
      if (msg.includes("popup-closed-by-user") || msg.includes("cancelled-popup-request")) {
        return;
      }
      setError(msg || "Could not complete Google sign-up. Please try again.");
    }
  }

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsOpNotAllowed(false);

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

          {/* 1-Click Google Sign-Up Button */}
          <button
            type="button"
            id="google-signup-button"
            onClick={handleGoogleSignUp}
            disabled={googleBusy || busy}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#13463F]/20 bg-white px-6 text-sm font-semibold text-neutral-800 shadow-sm transition-all hover:bg-neutral-50 active:scale-[0.99] disabled:opacity-70 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            {googleBusy ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin text-[#0d5c52]" />
                <span>Connecting to Google…</span>
              </div>
            ) : (
              <>
                <GoogleIcon />
                <span>Sign up as {role === "teacher" ? "Teacher" : "Student"} with Google</span>
              </>
            )}
          </button>

          {/* Clean Divider */}
          <div className="relative flex items-center justify-center py-1">
            <div className="w-full border-t border-[#13463F]/15 dark:border-emerald-900/30" />
            <span className="absolute bg-[#FAF7F2] px-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase dark:bg-[#0c1614]">
              Or with email
            </span>
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

            {/* Error Notice */}
            {error && (
              <div className="space-y-2 rounded-2xl border border-red-200/60 bg-red-50/95 p-3.5 text-center text-xs font-medium text-red-700 shadow-xs dark:border-red-900/50 dark:bg-red-950/70 dark:text-red-300">
                <div className="flex items-start gap-2 text-left">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    <p className="leading-snug">{error}</p>
                    {isOpNotAllowed && (
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={handleGoogleSignUp}
                          className="inline-flex items-center gap-1.5 rounded-full bg-red-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500"
                        >
                          <GoogleIcon />
                          <span>Register with Google instead</span>
                        </button>
                      </div>
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
                disabled={busy || googleBusy}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#0F685C] px-6 text-base font-semibold text-white shadow-md shadow-[#0d5c52]/20 transition-all hover:bg-[#0c564c] active:scale-[0.99] disabled:opacity-70 dark:bg-[#107568] dark:hover:bg-[#0d5c52]"
              >
                {busy ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-white" />
                    <span>Creating Account…</span>
                  </div>
                ) : (
                  "Create Account with Email"
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
