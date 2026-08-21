import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, AlertCircle, Mail } from "lucide-react";
import { AuthShell, AuthHero, AuthCard } from "@/components/auth-shell";
import { PasswordInput } from "@/components/password-input";
import { loginWithEmail } from "@/lib/auth-service";

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
          "Sign in to AssignEase with your email. Students submit handwritten assignments; teachers grade them in real time.",
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

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email || "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (search.email) {
      setEmail(search.email);
    }
  }, [search.email]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

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
      {/* 3D Graduate Character Avatar */}
      <AuthHero />

      <AuthCard>
        <div className="w-full space-y-4">
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

            {/* Error notice if sign-in fails - High visibility red banner */}
            {error && (
              <div className="space-y-2 rounded-2xl border-2 border-red-500/80 bg-red-50/95 p-3.5 text-center text-xs font-semibold text-red-700 shadow-sm dark:border-red-600/80 dark:bg-red-950/80 dark:text-red-300">
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
                  </div>
                </div>
              </div>
            )}

            {/* Sign In Button - Vibrant Pine/Teal Pill */}
            <div className="pt-1">
              <button
                type="submit"
                id="email-signin-button"
                disabled={busy}
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

            {/* Footer Action Links */}
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
                className="font-semibold text-[#13463F] transition-colors hover:text-[#0a2c27] hover:underline dark:text-emerald-300 dark:hover:text-emerald-100"
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
