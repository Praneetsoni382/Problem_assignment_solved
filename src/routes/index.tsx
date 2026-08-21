import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, AlertCircle, Mail } from "lucide-react";
import { AuthShell, AuthHero, AuthCard } from "@/components/auth-shell";
import { PasswordInput } from "@/components/password-input";
import { loginWithEmail, loginWithGoogle } from "@/lib/auth-service";

const searchSchema = z.object({
  email: z.string().catch(""),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign In — AssignEase" },
      {
        name: "description",
        content:
          "Sign in to AssignEase with Google or your email. Students submit handwritten assignments; teachers grade them in real time.",
      },
      { property: "og:title", content: "Sign In — AssignEase" },
      {
        property: "og:description",
        content: "Sign in to AssignEase for students and teachers.",
      },
    ],
  }),
  component: LoginPage,
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

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email || "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpNotAllowed, setIsOpNotAllowed] = useState(false);

  useEffect(() => {
    if (search.email) {
      setEmail(search.email);
    }
  }, [search.email]);

  async function handleGoogleSignIn() {
    setGoogleBusy(true);
    setError(null);
    setIsOpNotAllowed(false);
    try {
      const { profile, isNew } = await loginWithGoogle();
      setGoogleBusy(false);

      if (isNew) {
        toast.success(`Welcome to AssignEase, ${profile.full_name}!`);
      } else {
        toast.success(`Welcome back, ${profile.full_name}`);
      }

      queryClient.setQueryData(["profile"], profile);
      await queryClient.invalidateQueries();

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
      setError(msg || "Could not complete Google sign-in. Please try again.");
    }
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setIsOpNotAllowed(false);

    try {
      const { profile } = await loginWithEmail(email, password);
      setBusy(false);
      queryClient.setQueryData(["profile"], profile);
      await queryClient.invalidateQueries();
      toast.success(`Welcome back, ${profile.full_name}`);
      navigate({ to: profile.role === "teacher" ? "/teacher" : "/student" });
    } catch (signInError: unknown) {
      setBusy(false);
      const msg = (signInError as Error)?.message || "";
      setError(msg || "Could not sign in. Please check your credentials.");
    }
  }

  return (
    <AuthShell>
      {/* 3D Graduate Character Avatar from reference image */}
      <AuthHero />

      <AuthCard>
        <div className="w-full space-y-4">
          {/* 1-Click Google Sign-In Button */}
          <button
            type="button"
            id="google-signin-button"
            onClick={handleGoogleSignIn}
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
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Clean Divider */}
          <div className="relative flex items-center justify-center py-1">
            <div className="w-full border-t border-[#13463F]/15 dark:border-emerald-900/30" />
            <span className="absolute bg-[#FAF7F2] px-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase dark:bg-[#0c1614]">
              Or sign in with email
            </span>
          </div>

          <form onSubmit={signIn} className="w-full space-y-3">
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
              <div className="space-y-2 rounded-2xl border border-red-200/60 bg-red-50/95 p-3.5 text-center text-xs font-medium text-red-700 shadow-xs dark:border-red-900/50 dark:bg-red-950/70 dark:text-red-300">
                <div className="flex items-start gap-2 text-left">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    <p className="leading-snug">{error.replace("EMAIL_NOT_VERIFIED: ", "")}</p>
                    {error.includes("EMAIL_NOT_VERIFIED") && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <Link
                          to="/verify-email"
                          search={{ email: email.trim().toLowerCase(), role: "student", token: "" }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#0F685C] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0c564c]"
                        >
                          <Mail className="size-3.5" />
                          <span>Verify Email Now</span>
                        </Link>
                      </div>
                    )}
                    {isOpNotAllowed && (
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          className="inline-flex items-center gap-1.5 rounded-full bg-red-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500"
                        >
                          <GoogleIcon />
                          <span>Sign in with Google instead</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sign In Button - Vibrant Pine/Teal Pill matching image */}
            <div className="pt-1">
              <button
                type="submit"
                id="email-signin-button"
                disabled={busy || googleBusy}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#0F685C] px-6 text-base font-semibold text-white shadow-md shadow-[#0d5c52]/20 transition-all hover:bg-[#0c564c] active:scale-[0.99] disabled:opacity-70 dark:bg-[#107568] dark:hover:bg-[#0d5c52]"
              >
                {busy ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-white" />
                    <span>Signing In…</span>
                  </div>
                ) : (
                  "Sign In with Email"
                )}
              </button>
            </div>

            {/* Footer Action Links matching reference image */}
            <div className="flex items-center justify-between px-2 pt-1 text-xs font-medium sm:text-sm">
              <Link
                to="/reset-password"
                search={{ email }}
                className="text-[#13463F] transition-colors hover:text-[#0a2c27] hover:underline dark:text-emerald-300 dark:hover:text-emerald-100"
              >
                Forgot Password?
              </Link>

              <Link
                to="/register"
                search={{ role: "student", email }}
                className="text-[#13463F] transition-colors hover:text-[#0a2c27] hover:underline dark:text-emerald-300 dark:hover:text-emerald-100"
              >
                Create Account
              </Link>
            </div>
          </form>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
