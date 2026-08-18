import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Users,
  Search,
  Download,
  FolderLock,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useProfile } from "@/hooks/use-assignease";
import { listAssignments, listStudents, listSubmissions } from "@/lib/db";
import { buildRosterCsv, downloadCsv } from "@/lib/export-roster";

export const Route = createFileRoute("/_authenticated/teacher/students/")({
  head: () => ({
    meta: [
      { title: "Student Roster & Vault — AssignEase" },
      {
        name: "description",
        content:
          "View all registered students, access individual student vaults and submission records.",
      },
    ],
  }),
  component: TeacherStudentsDashboard,
});

export function TeacherStudentsDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useProfile();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isLoading && profile && profile.role !== "teacher") navigate({ to: "/student" });
    if (!isLoading && !profile)
      navigate({ to: "/register", search: { role: "teacher", email: "" } });
  }, [isLoading, profile, navigate]);

  const assignments = useQuery({ queryKey: ["assignments"], queryFn: listAssignments });
  const students = useQuery({ queryKey: ["students"], queryFn: listStudents });
  const submissions = useQuery({ queryKey: ["submissions"], queryFn: () => listSubmissions() });

  // Real-time synchronization for new students and incoming submissions
  useEffect(() => {
    const channel = supabase
      .channel("teacher-students-vault-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["students"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "submissions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["submissions"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const totalStudents = students.data?.length ?? 0;
  const totalAssignments = assignments.data?.length ?? 0;
  const totalSubmissions = submissions.data?.length ?? 0;
  const totalChecked = submissions.data?.filter((s) => s.checked_status === "checked").length ?? 0;

  // Filter students based on search term (name, enrollment no, or email)
  const filteredStudents = useMemo(() => {
    if (!students.data) return [];
    if (!searchTerm.trim()) return students.data;
    const term = searchTerm.toLowerCase().trim();
    return students.data.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(term) ||
        s.enrollment_no?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term),
    );
  }, [students.data, searchTerm]);

  function getAvatarColor(name: string | null) {
    const colors = [
      "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
      "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
      "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
      "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300",
    ];
    let hash = 0;
    const str = name || "student";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  function getInitials(name: string | null) {
    if (!name) return "ST";
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    <AppShell
      profile={profile ?? null}
      breadcrumbs={[{ label: "Teacher Dashboard", href: "/teacher" }, { label: "Students Roster" }]}
    >
      <div className="space-y-6">
        {/* Navigation Switcher between Assignments and Students */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Student Roster & Vaults
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse your registered students and click on any student vault to inspect their
              complete assignment history and answer scans.
            </p>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="inline-flex rounded-2xl border border-border/80 bg-neutral-100/80 p-1 shadow-xs dark:bg-neutral-800/80">
            <Link
              to="/teacher"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <FileText className="size-4" />
              Assignments
            </Link>
            <Link
              to="/teacher/students"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#0d5c52] shadow-xs dark:bg-neutral-900 dark:text-emerald-400"
            >
              <Users className="size-4" />
              Student List & Vault
            </Link>
          </div>
        </div>

        {/* 3 Metric Cards for Students Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-3xl border border-border/80 bg-white p-5 shadow-xs dark:bg-neutral-900">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-100/70 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Users className="size-6" />
            </div>
            <div>
              <div className="font-display text-2xl font-bold tracking-tight text-foreground">
                {totalStudents}
              </div>
              <div className="text-xs font-medium text-muted-foreground">Registered Students</div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-border/80 bg-white p-5 shadow-xs dark:bg-neutral-900">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <div className="font-display text-2xl font-bold tracking-tight text-foreground">
                {totalSubmissions}
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Total Submissions Received
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-border/80 bg-white p-5 shadow-xs dark:bg-neutral-900">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <div className="font-display text-2xl font-bold tracking-tight text-foreground">
                {totalChecked}
              </div>
              <div className="text-xs font-medium text-muted-foreground">Checked & Graded</div>
            </div>
          </div>
        </div>

        {/* Action & Filter Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by student name, enrollment no, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-2xl border border-border/80 bg-white pl-10 pr-4 text-xs font-medium text-foreground shadow-xs transition placeholder:text-muted-foreground/60 focus:border-[#0d5c52] focus:outline-none focus:ring-2 focus:ring-[#0d5c52]/20 dark:bg-neutral-900"
            />
          </div>

          <button
            type="button"
            disabled={!students.data?.length}
            onClick={() => {
              const csv = buildRosterCsv(
                students.data ?? [],
                assignments.data ?? [],
                submissions.data ?? [],
              );
              downloadCsv(`assignease-roster-${new Date().toISOString().slice(0, 10)}.csv`, csv);
              toast.success("Student roster CSV downloaded");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-white px-4 py-2.5 text-xs font-semibold text-foreground shadow-xs transition hover:bg-neutral-50 disabled:opacity-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            <Download className="size-4 text-muted-foreground" />
            Export Class CSV
          </button>
        </div>

        {/* Student Roster Table matching the Design Aesthetic */}
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-white shadow-xs dark:bg-neutral-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/70 bg-[#FDFBF7] text-xs font-semibold text-muted-foreground dark:bg-neutral-800/60">
                <tr>
                  <th className="py-3.5 pl-6 pr-3 w-16">Avatar</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Enrollment No.</th>
                  <th className="py-3.5 px-4">Registered Email</th>
                  <th className="py-3.5 px-4">Submissions Progress</th>
                  <th className="py-3.5 pr-6 pl-4 text-right">Student Vault</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {students.isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      Loading students roster...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      {searchTerm
                        ? `No students found matching "${searchTerm}".`
                        : "No students registered yet."}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const studentSubmissions =
                      submissions.data?.filter((s) => s.student_id === student.id) ?? [];
                    const submittedCount = studentSubmissions.filter(
                      (s) => s.status === "submitted",
                    ).length;
                    const checkedCount = studentSubmissions.filter(
                      (s) => s.checked_status === "checked",
                    ).length;
                    const initials = getInitials(student.full_name);
                    const colorClass = getAvatarColor(student.full_name);

                    return (
                      <tr
                        key={student.id}
                        className="transition hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50"
                      >
                        {/* Avatar */}
                        <td className="py-4 pl-6 pr-3">
                          <div
                            className={`flex size-9 items-center justify-center rounded-full text-xs font-bold shadow-xs ${colorClass}`}
                          >
                            {initials}
                          </div>
                        </td>

                        {/* Student Name */}
                        <td className="py-4 px-4 font-semibold text-foreground">
                          <Link
                            to="/teacher/students/$studentId"
                            params={{ studentId: student.id }}
                            className="transition hover:text-[#0d5c52] hover:underline"
                          >
                            {student.full_name || "Unnamed Student"}
                          </Link>
                        </td>

                        {/* Enrollment Number */}
                        <td className="py-4 px-4 font-mono text-xs text-muted-foreground">
                          {student.enrollment_no ? (
                            <span className="inline-flex rounded-lg bg-neutral-100 px-2 py-0.5 font-medium text-foreground dark:bg-neutral-800">
                              {student.enrollment_no}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4 text-xs text-muted-foreground">
                          {student.email || "No email"}
                        </td>

                        {/* Submissions Progress */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                              <span>
                                {submittedCount} / {totalAssignments} submitted
                              </span>
                              {checkedCount > 0 && (
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                  ({checkedCount} graded)
                                </span>
                              )}
                            </div>
                            <div className="h-1.5 w-32 rounded-full bg-neutral-100 overflow-hidden dark:bg-neutral-800">
                              <div
                                className="h-full rounded-full bg-[#0d5c52]"
                                style={{
                                  width: `${
                                    totalAssignments > 0
                                      ? Math.min(100, (submittedCount / totalAssignments) * 100)
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Action: View Student Vault */}
                        <td className="py-4 pr-6 pl-4 text-right">
                          <Link
                            to="/teacher/students/$studentId"
                            params={{ studentId: student.id }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0d5c52] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0a4840]"
                          >
                            <FolderLock className="size-3.5" />
                            View Student Vault
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
