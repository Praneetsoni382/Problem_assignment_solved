import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { KeyRound, Loader2, CheckCircle2, ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { AuthShell, AuthCard, AuthHero } from "@/components/auth-shell";
import { PasswordInput } from "@/components/password-input";
import { confirmAndResetPassword, sendPasswordResetEmailLink } from "@/lib/auth-service";

const searchSchema = z.object({
  token: z.string().catch(""),
  oobCode: z.string().catch(""),
  apiKey: z.string().catch(""),
  mode: z.string().catch(""),
  email: z.string().catch(""),
});

export const Route = createFileRoute("/reset-password")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Reset Password — AssignEase" },
      {
        name: "description",
        content: "Reset your AssignEase password securely via verified email link.",
      },
      {
        property: "og:title",
        content: "Reset Password — AssignEase",
      },
      {
        property: "og:description",
        content: "Securely reset your password for your AssignEase account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const hasToken = Boolean(search.token || search.oobCode);

  const [emailInput, setEmailInput] = useState(search.email || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Action 1: Dispatch Reset Link to User's Email
  async function handleSendResetLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const targetEmail = emailInput.trim().toLowerCase();
    if (!targetEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    setBusy(true);
    try {
      await sendPasswordResetEmailLink(targetEmail);
      setBusy(false);
      setEmailSent(true);
      toast.success(`Password reset link dispatched to ${targetEmail}!`);
    } catch (err: unknown) {
      setBusy(false);
      const msg =
        (err as Error)?.message ||
        "Could not dispatch reset email. Please ensure the email is registered.";
      setError(msg);
    }
  }

  // Action 2: Resend Reset Link
  async function handleResendResetLink() {
    const targetEmail = emailInput.trim().toLowerCase() || search.email.trim().toLowerCase();
    if (!targetEmail) {
      toast.error("Please provide your email address.");
      return;
    }
    setResending(true);
    setError(null);
    try {
      await sendPasswordResetEmailLink(targetEmail);
      setResending(false);
      toast.success("A fresh reset link has been dispatched to your inbox!");
    } catch (err: unknown) {
      setResending(false);
      const msg = (err as Error)?.message || "Could not resend reset link.";
      toast.error(msg);
    }
  }

  // Action 3: Set New Password (only when opening with verified token from email)
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");

    const targetEmail = emailInput?.trim().toLowerCase() || search.email?.trim().toLowerCase();
    if (!targetEmail) {
      return setError(
        "Email address is missing from the link. Please open the link directly from your email.",
      );
    }

    setBusy(true);
    try {
      await confirmAndResetPassword({
        token: search.token || null,
        oobCode: search.oobCode || null,
        email: targetEmail,
        newPassword: password,
      });
      setBusy(false);
      setSuccess(true);
      toast.success("Password updated successfully! You can now sign in.", { duration: 5000 });
      setTimeout(() => {
        navigate({ to: "/", search: { email: targetEmail } });
      }, 1800);
    } catch (err: unknown) {
      setBusy(false);
      const msg =
        (err as Error)?.message ||
        "Could not update password. The link may have expired or is invalid.";
      setError(msg);
    }
  }

  return (
    <AuthShell>
      <AuthHero />
      <AuthCard>
        {/* State A: Password Successfully Updated */}
        {success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-[#14423b] dark:text-emerald-100">
                Password Updated!
              </h1>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Your new password has been set. Redirecting you to sign in…
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/"
                search={{ email: emailInput || search.email }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#0F685C] px-6 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0c564c]"
              >
                <span>Go to Sign In</span>
              </Link>
            </div>
          </div>
        ) : hasToken ? (
          /* State B: User arrived via Email Reset Link (Token is present) */
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                <KeyRound className="size-6 text-[#0d5c52] dark:text-emerald-400" />
              </div>
              <h1 className="font-display text-xl font-bold text-[#14423b] dark:text-emerald-100">
                Set New Password
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {search.email ? (
                  <span>
                    Updating password for{" "}
                    <strong className="font-semibold text-foreground">{search.email}</strong>
                  </span>
                ) : (
                  "Enter your new password below to update your account."
                )}
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              {!search.email && (
                <div className="w-full">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Registered Email Address"
                    className="h-12 w-full rounded-full bg-[#13463F] px-6 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:bg-[#0f3d37] focus:ring-2 focus:ring-emerald-400/60 dark:bg-[#113e38] dark:placeholder:text-emerald-200/50"
                  />
                </div>
              )}

              <div className="w-full">
                <PasswordInput
                  id="reset-password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password (min 8 chars)"
                />
              </div>

              <div className="w-full">
                <PasswordInput
                  id="reset-confirm"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm New Password"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200/50 bg-red-50/90 px-4 py-2.5 text-center text-xs font-medium text-red-700 shadow-xs dark:border-red-900/40 dark:bg-red-950/60 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex h-12 w-full items-center justify-center rounded-full bg-[#0F685C] px-6 text-base font-semibold text-white shadow-md shadow-[#0d5c52]/20 transition-all hover:bg-[#0c564c] active:scale-[0.99] disabled:opacity-70 dark:bg-[#107568] dark:hover:bg-[#0d5c52]"
                >
                  {busy ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin text-white" />
                      <span>Updating Password…</span>
                    </div>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          </div>
        ) : emailSent ? (
          /* State C: Reset Link Dispatched -> "Go to your verified email and click on reset." */
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <Mail className="size-7 text-[#0d5c52] dark:text-emerald-400" />
            </div>

            <div>
              <h1 className="font-display text-xl font-bold text-[#14423b] dark:text-emerald-100">
                Check Your Inbox
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                We sent a password reset link to{" "}
                <strong className="font-semibold text-foreground">{emailInput}</strong>
              </p>
            </div>

            {/* Prominent directive as requested by user */}
            <div className="rounded-2xl border border-emerald-800/15 bg-emerald-50/90 p-4 text-center dark:border-emerald-700/20 dark:bg-emerald-950/40">
              <p className="text-sm font-bold text-[#0d5c52] dark:text-emerald-300">
                Go to your verified email and click on reset.
              </p>
              <p className="mt-1.5 text-xs text-emerald-900/80 dark:text-emerald-200/80">
                Clicking the link in your email will securely redirect you to the new password page.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleResendResetLink}
                disabled={resending}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0F685C] px-5 text-sm font-semibold text-white shadow-md shadow-[#0d5c52]/20 transition-all hover:bg-[#0c564c] active:scale-[0.99] disabled:opacity-60 dark:bg-[#107568] dark:hover:bg-[#0d5c52]"
              >
                {resending ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-white" />
                    <span>Sending new link…</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4" />
                    <span>Resend Reset Link</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* State D: Initial Request Screen (Enter registered email) */
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                <KeyRound className="size-6 text-[#0d5c52] dark:text-emerald-400" />
              </div>
              <h1 className="font-display text-xl font-bold text-[#14423b] dark:text-emerald-100">
                Reset Password
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter your registered email address and we will email you a secure link to reset
                your password.
              </p>
            </div>

            <form onSubmit={handleSendResetLink} className="space-y-3.5">
              <div className="w-full">
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Registered Email Address"
                  className="h-12 w-full rounded-full bg-[#13463F] px-6 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:bg-[#0f3d37] focus:ring-2 focus:ring-emerald-400/60 dark:bg-[#113e38] dark:placeholder:text-emerald-200/50"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200/50 bg-red-50/90 px-4 py-2.5 text-center text-xs font-medium text-red-700 shadow-xs dark:border-red-900/40 dark:bg-red-950/60 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={busy || !emailInput.trim()}
                  className="flex h-12 w-full items-center justify-center rounded-full bg-[#0F685C] px-6 text-base font-semibold text-white shadow-md shadow-[#0d5c52]/20 transition-all hover:bg-[#0c564c] active:scale-[0.99] disabled:opacity-70 dark:bg-[#107568] dark:hover:bg-[#0d5c52]"
                >
                  {busy ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin text-white" />
                      <span>Sending Reset Link…</span>
                    </div>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/"
                  search={{ email: emailInput }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          </div>
        )}
      </AuthCard>
    </AuthShell>
  );
}
