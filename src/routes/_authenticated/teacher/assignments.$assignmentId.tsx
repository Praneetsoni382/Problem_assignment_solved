import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { collection, doc, updateDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppShell } from "@/components/app-shell";
import { QuestionPaperDialog } from "@/components/question-paper-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProfile, useSignedUrl } from "@/hooks/use-assignease";
import { getAssignment, getOrCreateSubmission, listStudents, listSubmissions } from "@/lib/db";
import {
  getAssignmentMarksPerQuestion,
  getAssignmentTotalMarks,
  getCleanAssignmentTitle,
} from "@/lib/assignment-utils";

export const Route = createFileRoute("/_authenticated/teacher/assignments/$assignmentId")({
  head: () => ({
    meta: [
      { title: "Assignment submissions — AssignEase" },
      {
        name: "description",
        content:
          "Track who has submitted this assignment, close the submission window, and open a student's scans to grade.",
      },
      { property: "og:title", content: "Assignment submissions — AssignEase" },
      { property: "og:description", content: "Live submission status for one assignment." },
    ],
  }),
  component: TeacherAssignmentPage,
});

export function TeacherAssignmentPage() {
  const { assignmentId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const assignment = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => getAssignment(assignmentId),
  });
  const students = useQuery({ queryKey: ["students"], queryFn: listStudents });
  const submissions = useQuery({
    queryKey: ["submissions", assignmentId],
    queryFn: () => listSubmissions(assignmentId),
  });
  const paperUrl = useSignedUrl("question-papers", assignment.data?.question_paper_url);

  useEffect(() => {
    const q = query(collection(db, "submissions"), where("assignment_id", "==", assignmentId));
    const unsubscribe = onSnapshot(q, () => {
      queryClient.invalidateQueries({ queryKey: ["submissions", assignmentId] });
    });
    return () => unsubscribe();
  }, [assignmentId, queryClient]);

  const close = useMutation({
    mutationFn: async () => {
      await updateDoc(doc(db, "assignments", assignmentId), {
        is_open: false,
        closed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Submission window closed");
      queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setConfirmOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openGrading = useMutation({
    mutationFn: async (studentId: string) => {
      const existing = submissions.data?.find((s) => s.student_id === studentId);
      if (existing) return existing.id;
      const created = await getOrCreateSubmission(assignmentId, studentId);
      return created.id;
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function getAvatarColor(name: string | null) {
    const colors = [
      "bg-amber-100 text-amber-800",
      "bg-emerald-100 text-emerald-800",
      "bg-indigo-100 text-indigo-800",
      "bg-purple-100 text-purple-800",
      "bg-rose-100 text-rose-800",
      "bg-teal-100 text-teal-800",
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

  const totalQuestions = assignment.data?.total_questions || 5;
  const marksPerQuestion = getAssignmentMarksPerQuestion(assignment.data);
  const totalAssignmentMarks =
    getAssignmentTotalMarks(assignment.data) || totalQuestions * marksPerQuestion;
  const cleanTitle = getCleanAssignmentTitle(assignment.data?.title);

  return (
    <AppShell
      profile={profile ?? null}
      breadcrumbs={[
        { label: "Assignments", href: "/teacher" },
        { label: cleanTitle || "Assignment Details" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {cleanTitle || "Assignment"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground font-medium">
              Assignment #{assignment.data?.assignment_no ?? 1} • {totalQuestions} Questions •{" "}
              {marksPerQuestion} Marks/Q • Total {totalAssignmentMarks} Marks
            </p>
          </div>

          <div className="flex items-center gap-3">
            {assignment.data?.is_open ? (
              <span className="inline-flex items-center rounded-full bg-[#0d5c52] px-4 py-1.5 text-xs font-semibold text-white shadow-xs">
                Open
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-neutral-200 px-4 py-1.5 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                Closed
              </span>
            )}

            {paperUrl && (
              <QuestionPaperDialog
                url={paperUrl}
                title={`${cleanTitle || "Assignment"} — Question Paper`}
                className="rounded-2xl border-border/80 bg-white hover:bg-neutral-50 dark:bg-neutral-900"
              />
            )}

            {assignment.data?.is_open && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-xs transition hover:bg-neutral-50 dark:bg-neutral-900"
              >
                Close Submission Window
              </button>
            )}
          </div>
        </div>

        {/* Submissions Table Card */}
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-white shadow-xs dark:bg-neutral-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/70 bg-[#FDFBF7] text-xs font-semibold text-muted-foreground dark:bg-neutral-800/60">
                <tr>
                  <th className="py-3.5 pl-6 pr-3 w-16">Avatar</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Enrollment No.</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 pr-6 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {students.isLoading || submissions.isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      Loading submissions...
                    </td>
                  </tr>
                ) : students.data?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      No students registered yet.
                    </td>
                  </tr>
                ) : (
                  students.data?.map((student) => {
                    const sub = submissions.data?.find((s) => s.student_id === student.id);
                    const isChecked =
                      sub?.checked_status === "checked" ||
                      (sub?.total_marks !== null && sub?.total_marks !== undefined);
                    const isSubmitted = sub?.status === "submitted";
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

                        {/* Name */}
                        <td className="py-4 px-4 font-semibold text-foreground">
                          <Link
                            to="/teacher/students/$studentId"
                            params={{ studentId: student.id }}
                            className="transition hover:text-[#0d5c52] hover:underline"
                            title="View student vault"
                          >
                            {student.full_name || "Unnamed Student"}
                          </Link>
                        </td>

                        {/* Enrollment No */}
                        <td className="py-4 px-4 font-mono text-xs text-muted-foreground">
                          {student.enrollment_no || "014202"}
                        </td>

                        {/* Submission Date */}
                        <td className="py-4 px-4 text-xs text-muted-foreground">
                          {sub?.submitted_at
                            ? new Date(sub.submitted_at).toLocaleDateString("en-GB")
                            : "21/07/2023"}
                        </td>

                        {/* Status with colored dot */}
                        <td className="py-4 px-4">
                          {isChecked ? (
                            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                              <span className="size-2 rounded-full bg-amber-500" />
                              <span>
                                Checked - {sub?.total_marks ?? 0}/{totalAssignmentMarks}
                              </span>
                            </div>
                          ) : isSubmitted ? (
                            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                              <span className="size-2 rounded-full bg-amber-500" />
                              <span>Submitted - pending</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                              <span className="size-2 rounded-full bg-red-500" />
                              <span>Not submitted</span>
                            </div>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-4 pr-6 pl-4 text-right">
                          {sub ? (
                            <Link
                              to="/teacher/grade/$submissionId"
                              params={{ submissionId: sub.id }}
                              className="inline-flex items-center gap-1 rounded-xl bg-[#0d5c52] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0a4840]"
                            >
                              {isChecked ? "Review" : "Grade"}
                            </Link>
                          ) : (
                            <button
                              type="button"
                              disabled={openGrading.isPending}
                              onClick={async () => {
                                const subId = await openGrading.mutateAsync(student.id);
                                if (subId) {
                                  navigate({
                                    to: "/teacher/grade/$submissionId",
                                    params: { submissionId: subId },
                                  });
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-xs transition hover:bg-neutral-50 dark:bg-neutral-800"
                            >
                              Open & Grade
                            </button>
                          )}
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl border border-white/60 bg-white/95 p-7 shadow-2xl backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-bold">
              Close the submission window?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Students will no longer be able to submit or edit this assignment. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-3">
            <AlertDialogCancel className="rounded-xl border border-border/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => close.mutate()}
              disabled={close.isPending}
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              {close.isPending ? "Closing…" : "Close window"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
