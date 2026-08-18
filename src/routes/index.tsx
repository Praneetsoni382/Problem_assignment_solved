import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, AuthHero, AuthCard } from "@/components/auth-shell";
import { PasswordInput } from "@/components/password-input";
import { ensureProfile } from "@/lib/db";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign In — AssignEase" },
      {
        name: "description",
        content:
          "Sign in to AssignEase with your email and password. Students submit assignments; teachers grade them in real time.",
      },
      { property: "og:title", content: "Sign In — AssignEase" },
      {
        property: "og:description",
        content: "Email and password sign in for students and teachers on AssignEase.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (signInError) {
      setBusy(false);
      const msg = signInError.message.toLowerCase();
      setError(
        msg.includes("not confirmed")
          ? "Please verify your email first — check your inbox for the verification link."
          : msg.includes("invalid login")
            ? "Incorrect email or password."
            : signInError.message,
      );
      return;
    }

    try {
      const profile = await ensureProfile();
      setBusy(false);
      if (!profile) {
        setError("We couldn't load your account. Please try again.");
        return;
      }
      if (profile === "needs-details") {
        navigate({ to: "/complete-profile" });
        return;
      }
      toast.success(`Welcome back, ${profile.full_name}`);
      navigate({ to: profile.role === "teacher" ? "/teacher" : "/student" });
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleForgotPassword(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) {
      setError("Please enter your email address first.");
      toast.error("Please enter your email address first.");
      return;
    }
    setResetBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(clean, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetBusy(false);
    if (resetError) {
      setError(resetError.message);
      toast.error(resetError.message);
      return;
    }
    toast.success("Password reset link sent to your email!");
    setShowForgotModal(false);
  }

  return (
    <AuthShell>
      {/* 3D Graduate Character Avatar from reference image */}
      <AuthHero />

      <AuthCard>
        <form onSubmit={signIn} className="w-full space-y-3.5">
          {/* Email input - dark pine/emerald pill */}
          <div className="w-full">
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="h-12 w-full rounded-full bg-[#13463F] px-6 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:bg-[#0f3d37] focus:ring-2 focus:ring-emerald-400/60 dark:bg-[#113e38] dark:placeholder:text-emerald-200/50"
            />
          </div>

          {/* Password input - dark pine/emerald pill with eye reveal */}
          <div className="w-full">
            <PasswordInput
              id="login-password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>

          {/* Error notice if sign-in fails */}
          {error && (
            <div className="rounded-2xl border border-red-200/50 bg-red-50/90 px-4 py-2.5 text-center text-xs font-medium text-red-700 shadow-xs dark:border-red-900/40 dark:bg-red-950/60 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Sign In Button - Vibrant Pine/Teal Pill matching image */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={busy}
              className="flex h-12 w-full items-center justify-center rounded-full bg-[#0F685C] px-6 text-base font-semibold text-white shadow-md shadow-[#0d5c52]/20 transition-all hover:bg-[#0c564c] active:scale-[0.99] disabled:opacity-70 dark:bg-[#107568] dark:hover:bg-[#0d5c52]"
            >
              {busy ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-white" />
                  <span>Signing In…</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </div>

          {/* Footer Action Links matching reference image */}
          <div className="flex items-center justify-between px-2 pt-2 text-xs font-medium sm:text-sm">
            <button
              type="button"
              onClick={() => {
                if (!email.trim()) {
                  setShowForgotModal(true);
                } else {
                  handleForgotPassword();
                }
              }}
              className="text-[#13463F] transition-colors hover:text-[#0a2c27] hover:underline dark:text-emerald-300 dark:hover:text-emerald-100"
            >
              Forgot Password?
            </button>

            <Link
              to="/register"
              search={{ role: "student", email }}
              className="text-[#13463F] transition-colors hover:text-[#0a2c27] hover:underline dark:text-emerald-300 dark:hover:text-emerald-100"
            >
              Create Account
            </Link>
          </div>
        </form>
      </AuthCard>

      {/* Forgot Password Quick Prompt Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-emerald-900/10 bg-[#FAF7F2] p-6 shadow-2xl dark:bg-[#0c1614]">
            <h2 className="font-display text-lg font-bold text-[#14423b] dark:text-emerald-100">
              Reset Your Password
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter your registered email address and we will send you a secure password reset link.
            </p>

            <form onSubmit={handleForgotPassword} className="mt-4 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="h-11 w-full rounded-full bg-[#13463F] px-5 text-sm text-white placeholder:text-emerald-100/60 outline-hidden focus:ring-2 focus:ring-emerald-400"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetBusy}
                  className="rounded-full bg-[#0F685C] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0c564c] disabled:opacity-60"
                >
                  {resetBusy ? "Sending…" : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
