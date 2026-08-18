import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, AuthCard, AuthHero } from "@/components/auth-shell";
import { PasswordInput } from "@/components/password-input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password — AssignEase" },
      {
        name: "description",
        content:
          "Choose a new AssignEase password after following the reset link sent to your email.",
      },
      {
        property: "og:title",
        content: "Set New Password — AssignEase",
      },
      {
        property: "og:description",
        content: "Securely set a new password for your AssignEase account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    toast.success("Password updated successfully!");
    navigate({ to: "/" });
  }

  return (
    <AuthShell>
      <AuthHero />
      <AuthCard>
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
            <KeyRound className="size-6 text-[#0d5c52] dark:text-emerald-400" />
          </div>
          <h1 className="font-display text-xl font-bold text-[#14423b] dark:text-emerald-100">
            Set New Password
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter and confirm your new secure password.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
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
            <div className="rounded-2xl border border-red-200/50 bg-red-50/90 px-4 py-2 text-center text-xs font-medium text-red-700 shadow-xs dark:border-red-900/40 dark:bg-red-950/60 dark:text-red-300">
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
                  <span>Updating…</span>
                </div>
              ) : (
                "Update Password"
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/"
              className="text-xs font-semibold text-[#13463F] hover:underline dark:text-emerald-300"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
