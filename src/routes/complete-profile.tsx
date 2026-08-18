import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserRoundPen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, AuthCard, AuthHero } from "@/components/auth-shell";
import { AuthRoleTabs } from "@/components/auth-role-tabs";
import { createMyProfile, getCurrentProfile } from "@/lib/db";

export const Route = createFileRoute("/complete-profile")({
  head: () => ({
    meta: [
      { title: "Complete Profile — AssignEase" },
      {
        name: "description",
        content: "Finish setting up your AssignEase profile details.",
      },
    ],
  }),
  component: CompleteProfilePage,
});

function CompleteProfilePage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [fullName, setFullName] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        navigate({ to: "/", replace: true });
        return;
      }
      const profile = await getCurrentProfile();
      if (!active || !profile) return;
      navigate({ to: profile.role === "teacher" ? "/teacher" : "/student", replace: true });
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) return setError("Please enter your full name.");
    if (role === "student" && !enrollmentNo.trim())
      return setError("Please enter your enrollment number.");

    setBusy(true);
    try {
      const profile = await createMyProfile({
        role,
        fullName,
        enrollmentNo: role === "student" ? enrollmentNo : null,
      });
      toast.success(`Welcome, ${profile.full_name}`);
      navigate({ to: profile.role === "teacher" ? "/teacher" : "/student", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <AuthHero />
      <AuthCard>
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
            <UserRoundPen className="size-6 text-[#0d5c52] dark:text-emerald-400" />
          </div>
          <h1 className="font-display text-xl font-bold text-[#14423b] dark:text-emerald-100">
            Complete Your Profile
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Provide your details so your teacher and peers see your name.
          </p>
        </div>

        <form onSubmit={save} className="space-y-3.5">
          <div className="mb-1">
            <AuthRoleTabs value={role} onChange={setRole} />
          </div>

          <div className="w-full">
            <input
              id="profile-fullname"
              required
              maxLength={100}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your Full Name"
              className="h-12 w-full rounded-full bg-[#13463F] px-6 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:bg-[#0f3d37] focus:ring-2 focus:ring-emerald-400/60 dark:bg-[#113e38] dark:placeholder:text-emerald-200/50"
            />
          </div>

          {role === "student" && (
            <div className="w-full">
              <input
                id="profile-enrollment"
                required
                maxLength={40}
                value={enrollmentNo}
                onChange={(e) => setEnrollmentNo(e.target.value)}
                placeholder="Enrollment Number (e.g. 014202)"
                className="h-12 w-full rounded-full bg-[#13463F] px-6 text-sm font-medium text-white placeholder:text-emerald-100/60 shadow-xs outline-hidden transition-all focus:bg-[#0f3d37] focus:ring-2 focus:ring-emerald-400/60 dark:bg-[#113e38] dark:placeholder:text-emerald-200/50"
              />
            </div>
          )}

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
                  <span>Saving…</span>
                </div>
              ) : (
                "Save & Continue"
              )}
            </button>
          </div>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
