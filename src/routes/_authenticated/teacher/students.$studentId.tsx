import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  FolderLock,
  FileText,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Calendar,
  Mail,
  Award,
  Sparkles,
  Layers,
  AlertCircle,
  Eye,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useProfile } from "@/hooks/use-assignease";
import {
  getOrCreateSubmission,
  listAssignments,
  listSubmissions,
  type Profile,
  type SubmissionPage,
} from "@/lib/db";

export const Route = createFileRoute("/_authenticated/teacher/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student Vault — AssignEase" },
      {
        name: "description",
        content: "Access all assignment submissions and scanned answer pages for this student.",
      },
    ],
  }),
  component: StudentVaultPage,
});

export function StudentVaultPage() {
  const { studentId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: teacherProfile, isLoading: profileLoading } = useProfile();

  useEffect(() => {
    if (!profileLoading && teacherProfile && teacherProfile.role !== "teacher") {
      navigate({ to: "/student" });
    }
  }, [profileLoading, teacherProfile, navigate]);

  // Fetch Student Profile
  const studentQuery = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  // Fetch All Assignments created by teacher
  const assignmentsQuery = useQuery({
    queryKey: ["assignments"],
    queryFn: listAssignments,
  });

  // Fetch all submissions for this student
  const studentSubmissionsQuery = useQuery({
    queryKey: ["submissions", "student", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("student_id", studentId);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch all submission pages uploaded by this student to know page counts
  const studentPagesQuery = useQuery({
    queryKey: ["student-pages", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submission_pages")
        .select("*, submission:submissions!inner(student_id)")
        .eq("submission.student_id", studentId);
      if (error) {
        // Fallback if relation query fails
        const { data: simpleData } = await supabase.from("submission_pages").select("*");
        return (simpleData as SubmissionPage[]) ?? [];
      }
      return (data as SubmissionPage[]) ?? [];
    },
  });

  // Real-time synchronization for this student's submissions and page uploads
  useEffect(() => {
    const channel = supabase
      .channel(`student-vault-live-${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submissions",
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["submissions", "student", studentId] });
          queryClient.invalidateQueries({ queryKey: ["submissions"] });
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "submission_pages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["student-pages", studentId] });
        queryClient.invalidateQueries({ queryKey: ["pages"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "question_marks" }, () => {
        queryClient.invalidateQueries({ queryKey: ["submissions", "student", studentId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId, queryClient]);

  // Open & Grade mutation for assignments not yet initialized
  const openSubmissionMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return await getOrCreateSubmission(assignmentId, studentId);
    },
    onSuccess: (sub) => {
      navigate({
        to: "/teacher/grade/$submissionId",
        params: { submissionId: sub.id },
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to open student submission canvas");
    },
  });

  const student = studentQuery.data;
  const assignments = assignmentsQuery.data ?? [];
  const submissions = studentSubmissionsQuery.data ?? [];
  const allPages = studentPagesQuery.data ?? [];

  const totalAssignments = assignments.length;
  const submittedCount = submissions.filter((s) => s.status === "submitted").length;
  const checkedCount = submissions.filter((s) => s.checked_status === "checked").length;

  // Calculate total marks scored & max possible marks
  const totalScored = submissions.reduce((acc, curr) => acc + (curr.total_marks ?? 0), 0);
  const maxMarksPossible = assignments.reduce(
    (acc, curr) => acc + (curr.total_questions ? curr.total_questions * 5 : 25),
    0,
  );

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
      profile={teacherProfile ?? null}
      breadcrumbs={[
        { label: "Teacher Dashboard", href: "/teacher" },
        { label: "Students Roster", href: "/teacher/students" },
        { label: student ? `${student.full_name}'s Vault` : "Student Vault" },
      ]}
    >
      <div className="space-y-6">
        {/* Back Link */}
        <div>
          <Link
            to="/teacher/students"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to Student Roster
          </Link>
        </div>

        {/* Student Profile Hero Card matching Design System */}
        <div className="rounded-3xl border border-border/80 bg-white p-6 shadow-xs dark:bg-neutral-900 sm:p-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Left: Avatar and Identity */}
            <div className="flex items-center gap-5">
              <div
                className={`flex size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold shadow-xs sm:size-20 sm:text-2xl ${getAvatarColor(
                  student?.full_name ?? "Student",
                )}`}
              >
                {getInitials(student?.full_name ?? null)}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {student?.full_name || "Student Vault"}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <FolderLock className="size-3" />
                    Vault Active
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-mono font-medium text-foreground">
                    Enrollment: {student?.enrollment_no || "N/A"}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="size-3.5" />
                    {student?.email || "No email"}
                  </span>
                  {student?.created_at && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        Joined {new Date(student.created_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Stat Chips */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
              <div className="rounded-2xl border border-border/70 bg-[#FDFBF7] p-3 text-center dark:bg-neutral-800/60">
                <div className="font-display text-lg font-bold text-foreground">
                  {totalAssignments}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">Total Assigned</div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-[#FDFBF7] p-3 text-center dark:bg-neutral-800/60">
                <div className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {submittedCount}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">Submitted</div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-[#FDFBF7] p-3 text-center dark:bg-neutral-800/60">
                <div className="font-display text-lg font-bold text-amber-600 dark:text-amber-400">
                  {checkedCount}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  Graded & Checked
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-[#FDFBF7] p-3 text-center dark:bg-neutral-800/60">
                <div className="font-display text-lg font-bold text-foreground">
                  {checkedCount > 0 ? `${totalScored} pts` : "—"}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">Points Scored</div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments Vault Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
                All Assignment Records & Answer Scans
              </h2>
              <p className="text-xs text-muted-foreground">
                Click "View Answers & Grade" to inspect every scanned answer page in the high-res
                grading workspace.
              </p>
            </div>
            <div className="text-xs font-semibold text-muted-foreground">
              {assignments.length} Total Assignments
            </div>
          </div>

          {/* Assignments List in the Vault */}
          <div className="space-y-3">
            {assignmentsQuery.isLoading ? (
              <div className="flex items-center justify-center rounded-3xl border border-border/80 bg-white p-12 shadow-xs dark:bg-neutral-900">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="size-5 animate-spin text-[#0d5c52]" />
                  Loading student assignment vault...
                </div>
              </div>
            ) : assignments.length === 0 ? (
              <div className="rounded-3xl border border-border/80 bg-white p-12 text-center shadow-xs dark:bg-neutral-900">
                <FileText className="mx-auto size-8 text-muted-foreground/60" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">
                  No assignments created
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create assignments from the teacher dashboard to track this student's submissions.
                </p>
              </div>
            ) : (
              assignments.map((assignment) => {
                const submission = submissions.find((s) => s.assignment_id === assignment.id);
                const isSubmitted = submission?.status === "submitted";
                const isChecked =
                  submission?.checked_status === "checked" ||
                  (submission?.total_marks !== null && submission?.total_marks !== undefined);

                // Count pages uploaded for this submission
                const pageCount = submission
                  ? allPages.filter((p) => p.submission_id === submission.id).length
                  : 0;

                const maxAssignmentMarks = assignment.total_questions
                  ? assignment.total_questions * 5
                  : 25;

                return (
                  <div
                    key={assignment.id}
                    className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-white p-5 shadow-xs transition hover:border-[#0d5c52]/40 dark:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {/* Left: Assignment details */}
                    <div className="flex items-start gap-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#0d5c52]/10 font-display text-sm font-bold text-[#0d5c52] dark:bg-emerald-950/60 dark:text-emerald-400">
                        #{assignment.assignment_no}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-bold text-foreground">
                            {assignment.title}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              assignment.is_open
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                            }`}
                          >
                            {assignment.is_open ? "Window Open" : "Closed"}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{assignment.total_questions} Questions</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <Layers className="size-3.5 text-muted-foreground" />
                            {pageCount > 0
                              ? `${pageCount} answer scan${pageCount === 1 ? "" : "s"} uploaded`
                              : "0 scans uploaded"}
                          </span>
                          {submission?.submitted_at && (
                            <>
                              <span>•</span>
                              <span>
                                Submitted:{" "}
                                {new Date(submission.submitted_at).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Submission Status Badge */}
                    <div className="flex items-center gap-3">
                      {isChecked ? (
                        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
                          <CheckCircle2 className="size-4 text-amber-600 dark:text-amber-400" />
                          <span>
                            Checked • {submission?.total_marks ?? 0} / {maxAssignmentMarks} Marks
                          </span>
                        </div>
                      ) : isSubmitted ? (
                        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Submitted • Pending Grading</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-2 text-xs font-medium text-muted-foreground dark:bg-neutral-800">
                          <span className="size-2 rounded-full bg-red-400" />
                          <span>Not submitted yet</span>
                        </div>
                      )}

                      {/* Right Action: Navigate to Grading Canvas */}
                      {submission ? (
                        <Link
                          to="/teacher/grade/$submissionId"
                          params={{ submissionId: submission.id }}
                          className="inline-flex items-center gap-2 rounded-2xl bg-[#0d5c52] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0a4840]"
                        >
                          <Eye className="size-3.5" />
                          {isChecked ? "Review Answers & Marks" : "View Answers & Grade"}
                          <ChevronRight className="size-3.5" />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={openSubmissionMutation.isPending}
                          onClick={() => openSubmissionMutation.mutate(assignment.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-white px-4 py-2.5 text-xs font-semibold text-foreground shadow-xs transition hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                        >
                          {openSubmissionMutation.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Eye className="size-3.5 text-muted-foreground" />
                          )}
                          Open Submission Canvas
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
