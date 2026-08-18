import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, UserRoundPen, FileText, Users, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { ParticleField } from "@/components/particle-field";
import { NotificationBell } from "@/components/notification-bell";
import { AssignEaseLogo } from "@/components/assignease-logo";

import type { Profile } from "@/lib/db";

export function AppShell({
  profile,
  breadcrumbs,
  children,
}: {
  profile: Profile | null;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="app-bg min-h-screen">
      <ParticleField />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link
              to={profile?.role === "teacher" ? "/teacher" : "/student"}
              className="flex items-center"
            >
              <AssignEaseLogo size="sm" />
            </Link>

            {/* Quick Navigation for Teachers */}
            {profile?.role === "teacher" && (
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/teacher"
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    currentPath === "/teacher" || currentPath.startsWith("/teacher/assignments")
                      ? "bg-[#0d5c52]/10 text-[#0d5c52] dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800"
                  }`}
                >
                  <FileText className="size-3.5" />
                  Assignments
                </Link>
                <Link
                  to="/teacher/students"
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    currentPath.startsWith("/teacher/students")
                      ? "bg-[#0d5c52]/10 text-[#0d5c52] dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800"
                  }`}
                >
                  <Users className="size-3.5" />
                  Student List & Vault
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {profile && <NotificationBell userId={profile.id} />}
            {profile && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Edit your profile"
                className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 text-left transition hover:bg-accent/60 sm:px-3"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-auth-gold-subtle text-xs font-bold text-auth-gold-foreground">
                  {profile.full_name.slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden leading-tight sm:block">
                  <span className="block text-sm font-semibold">{profile.full_name}</span>
                  <span className="block text-xs capitalize text-muted-foreground">
                    {profile.role === "student" ? profile.enrollment_no : "Teacher"}
                  </span>
                </span>
                <UserRoundPen className="size-4 text-muted-foreground" />
              </button>
            )}
            <Button size="sm" onClick={signOut}>
              <LogOut className="mr-2 size-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>
      {profile && <EditProfileDialog profile={profile} open={editing} onOpenChange={setEditing} />}
      <main className="relative mx-auto max-w-6xl px-4 py-8">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <div key={crumb.label} className="flex items-center gap-1.5">
                  {idx > 0 && <ChevronRight className="size-3 text-muted-foreground/60" />}
                  {crumb.href && !isLast ? (
                    <Link
                      to={crumb.href}
                      className="transition hover:text-[#0d5c52] hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={isLast ? "font-semibold text-foreground" : ""}>
                      {crumb.label}
                    </span>
                  )}
                </div>
              );
            })}
          </nav>
        )}
        {children}
      </main>
    </div>
  );
}
