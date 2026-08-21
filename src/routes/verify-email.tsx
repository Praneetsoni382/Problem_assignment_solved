import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { CheckCircle2, Mail, Loader2, AlertCircle, RefreshCw, ArrowRight } from "lucide-react";
import { AuthShell, AuthCard, AuthHero } from "@/components/auth-shell";
import { verifyEmailWithToken, resendVerificationEmail } from "@/lib/auth-service";

const searchSchema = z.object({
  email: z.string().catch(""),
  token: z.string().catch(""),
  code: z.string().catch(""),
  role: z.enum(["student", "teacher"]).catch("student"),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Verify Your Email — AssignEase" },
      {
        name: "description",
        content: "Verify your email address to activate your AssignEase account.",
      },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const email = search.email || "";
  const token = search.token || search.code || "";

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [userProfile, setUserProfile] = useState<{ role?: string; full_name?: string } | null>(
    null,
  );

  useEffect(() => {
    // If a token is provided in the URL (e.g. user clicked the link in Gmail), verify it immediately!
    if (token && email) {
      setVerifying(true);
      setError(null);
      verifyEmailWithToken(email, token)
        .then(({ profile }) => {
          setVerifying(false);
          setVerified(true);
          setUserProfile(profile);
          queryClient.setQueryData(["profile"], profile);
          queryClient.invalidateQueries();
          toast.success("Email verified successfully! Welcome to AssignEase.");

          // Automatically navigate after 1.5 seconds
          setTimeout(() => {
            if (profile.role === "teacher") {
              navigate({ to: "/teacher" });
            } else {
              navigate({ to: "/student" });
            }
          }, 1500);
        })
        .catch((err: unknown) => {
          setVerifying(false);
          const msg =
            (err as Error)?.message ||
            "Verification link is invalid or expired. Please request a new verification email.";
          setError(msg);
        });
    }
  }, [token, email, navigate, queryClient]);

  async function handleResendEmail() {
    if (!email) {
      toast.error("Please enter your registered email address.");
      return;
    }
    setResending(true);
    setError(null);
    try {
      await resendVerificationEmail(email, search.role);
      setResending(false);
      toast.success(`New verification email dispatched to ${email}!`, {
        description: "Please check your Gmail inbox and click the verify button.",
        duration: 7000,
      });
    } catch (err: unknown) {
      setResending(false);
      const msg = (err as Error)?.message || "Could not resend email. Please try again.";
      toast.error(msg);
    }
  }

  return (
    <AuthShell>
      <AuthHero />
      <AuthCard>
        <div className="py-4 text-center">
          {/* State 1: Verifying in progress */}
          {verifying && (
            <div className="space-y-4 py-6">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                <Loader2 className="size-7 animate-spin text-[#0d5c52] dark:text-emerald-400" />
              </div>
              <h1 className="font-display text-xl font-bold text-[#14423b] dark:text-emerald-100">
                Verifying Your Email…
              </h1>
              <p className="text-xs text-muted-foreground">
                Connecting to AssignEase to activate your account.
              </p>
            </div>
          )}

          {/* State 2: Successfully Verified */}
          {!verifying && verified && (
            <div className="space-y-4 py-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-[#14423b] dark:text-emerald-100">
                  Email Verified!
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your account is fully activated. Redirecting to your dashboard…
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (userProfile?.role === "teacher") {
                      navigate({ to: "/teacher" });
                    } else {
                      navigate({ to: "/student" });
                    }
                  }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#0F685C] px-6 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0c564c]"
                >
                  <span>Continue to Dashboard</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* State 3: Waiting for user to click verification email in Gmail */}
          {!verifying && !verified && (
            <div className="space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                <Mail className="size-7 text-[#0d5c52] dark:text-emerald-400" />
              </div>

              <div>
                <h1 className="font-display text-xl font-bold text-[#14423b] dark:text-emerald-100">
                  Check Your Email
                </h1>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  We've sent a verification link to{" "}
                  <strong className="font-semibold text-foreground">
                    {email || "your registered email"}
                  </strong>
                  . Please click the button inside the email to activate your account.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-200/60 bg-red-50/95 p-3 text-left text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/70 dark:text-red-300">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
                  <p className="flex-1 leading-snug">{error}</p>
                </div>
              )}

              <div className="space-y-2.5 pt-2">
                {/* Resend button */}
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={resending || !email}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0F685C] px-5 text-sm font-semibold text-white shadow-md shadow-[#0d5c52]/20 transition-all hover:bg-[#0c564c] active:scale-[0.99] disabled:opacity-60 dark:bg-[#107568] dark:hover:bg-[#0d5c52]"
                >
                  {resending ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-white" />
                      <span>Sending new email…</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-4" />
                      <span>Resend Verification Email</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 text-xs text-muted-foreground">
                Already verified?{" "}
                <Link
                  to="/"
                  search={{ email }}
                  className="font-semibold text-[#13463F] hover:underline dark:text-emerald-300"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </AuthCard>
    </AuthShell>
  );
}
