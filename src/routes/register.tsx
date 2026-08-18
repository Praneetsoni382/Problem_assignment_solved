import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { MailCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, AuthCard, AuthHero } from "@/components/auth-shell";
import { AuthRoleTabs } from "@/components/auth-role-tabs";
import { PasswordInput } from "@/components/password-input";

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
          "Register on AssignEase as a student with your enrollment number, or as a teacher to manage assignments.",
      },
      {
        property: "og:title",
        content: "Create Account — AssignEase",
      },
      {
        property: "og:description",
        content:
          "Register for AssignEase with email and password, then verify via the emailed link.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const search = Route.useSearch();
  const [role, setRole] = useState<"student" | "teacher">(search.role);
  const [fullName, setFullName] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [email, setEmail] = useState(search.email);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sent, setSent] = useState(false);
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
    const cleanEmail = email.trim().toLowerCase();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          role,
          full_name: fullName.trim(),
          enrollment_no: role === "student" ? enrollmentNo.trim() : null,
        },
      },
    });
    setBusy(false);

    if (signUpError) {
      setError(
        signUpError.message.toLowerCase().includes("already registered")
          ? "That email is already registered. Try signing in instead."
          : signUpError.message,
      );
      return;
    }

    if (data.session) {
      toast.success("Account created successfully!");
      window.location.assign("/");
      return;
    }

    setSent(true);
    toast.success("Verification link sent to your email!");
  }

  if (sent) {
    return (
      <AuthShell>
        <AuthHero />
        <AuthCard className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
            <MailCheck className="size-8 text-[#0d5c52] dark:text-emerald-400" />
          </div>
          <h1 className="font-display text-xl font-bold text-[#14423b] dark:text-emerald-100">
            Check Your Email
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            We sent a verification link to{" "}
            <span className="font-medium text-foreground">{email}</span>. Click it to confirm your
            account, then sign in with your password.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#0F685C] px-6 text-sm font-semibold text-white shadow-md shadow-[#0d5c52]/20 hover:bg-[#0c564c]"
            >
              Back to Sign In
            </Link>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {/* 3D Graduate Avatar */}
      <AuthHero />

      <AuthCard>
        <form onSubmit={register} className="w-full space-y-3">
          {/* Role Switcher Pill */}
          <div className="mb-1">
            <AuthRoleTabs value={role} onChange={setRole} />
          </div>

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
            <div className="rounded-2xl border border-red-200/50 bg-red-50/90 px-4 py-2 text-center text-xs font-medium text-red-700 shadow-xs dark:border-red-900/40 dark:bg-red-950/60 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-1.5">
            <button
              type="submit"
              disabled={busy}
              className="flex h-12 w-full items-center justify-center rounded-full bg-[#0F685C] px-6 text-base font-semibold text-white shadow-md shadow-[#0d5c52]/20 transition-all hover:bg-[#0c564c] active:scale-[0.99] disabled:opacity-70 dark:bg-[#107568] dark:hover:bg-[#0d5c52]"
            >
              {busy ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-white" />
                  <span>Creating Account…</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </div>

          {/* Footer Link */}
          <div className="flex items-center justify-center px-2 pt-2 text-xs font-medium sm:text-sm">
            <span className="text-muted-foreground">Already have an account?&nbsp;</span>
            <Link
              to="/"
              className="font-semibold text-[#13463F] transition-colors hover:text-[#0a2c27] hover:underline dark:text-emerald-300 dark:hover:text-emerald-100"
            >
              Sign In
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
