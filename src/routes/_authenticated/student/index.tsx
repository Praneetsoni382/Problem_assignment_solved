import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-assignease";
import { listAssignments, listSubmissions } from "@/lib/db";
import {
  getAssignmentMarksPerQuestion,
  getAssignmentTotalMarks,
  getCleanAssignmentTitle,
} from "@/lib/assignment-utils";

export const Route = createFileRoute("/_authenticated/student/")({
  head: () => ({
    meta: [
      { title: "My assignments — AssignEase" },
      {
        name: "description",
        content:
          "See your open assignments, scan answers with your camera, submit them, and check your marks.",
      },
      { property: "og:title", content: "My assignments — AssignEase" },
      {
        property: "og:description",
        content: "Scan and submit your assignments, then see your marks.",
      },
    ],
  }),
  component: StudentDashboard,
});

export function StudentDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useProfile();

  useEffect(() => {
    if (!isLoading && profile && profile.role === "teacher") {
      navigate({ to: "/teacher" });
    }
  }, [isLoading, profile, navigate]);

  const assignments = useQuery({ queryKey: ["assignments"], queryFn: listAssignments });
  const submissions = useQuery({ queryKey: ["submissions"], queryFn: () => listSubmissions() });

  useEffect(() => {
    const unsubSub = onSnapshot(collection(db, "submissions"), () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    });
    const unsubAssign = onSnapshot(collection(db, "assignments"), () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    });
    return () => {
      unsubSub();
      unsubAssign();
    };
  }, [queryClient]);

  return (
    <AppShell profile={profile ?? null} breadcrumbs={[{ label: "My Assignments" }]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Assignments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Capture photos of your answers, submit them for grading, and view your marks.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border/80 bg-white shadow-xs dark:bg-neutral-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/70 bg-[#FDFBF7] text-xs font-semibold text-muted-foreground dark:bg-neutral-800/60">
                <tr>
                  <th className="py-3.5 pl-6 pr-3">Assignment</th>
                  <th className="py-3.5 px-4">No.</th>
                  <th className="py-3.5 px-4">Questions & Marks</th>
                  <th className="py-3.5 px-4">Total Marks</th>
                  <th className="py-3.5 px-4">Submission Status</th>
                  <th className="py-3.5 pr-6 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {assignments.isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      Loading assignments...
                    </td>
                  </tr>
                ) : assignments.data?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      No assignments have been posted yet.
                    </td>
                  </tr>
                ) : (
                  assignments.data?.map((assignment) => {
                    const submission = submissions.data?.find(
                      (s) => s.assignment_id === assignment.id && s.student_id === profile?.id,
                    );
                    const isSubmitted = submission?.status === "submitted";
                    const isChecked = isSubmitted && submission?.checked_status === "checked";
                    const mpq = getAssignmentMarksPerQuestion(assignment);
                    const totalMarks = getAssignmentTotalMarks(assignment);
                    const cleanTitle = getCleanAssignmentTitle(assignment.title);

                    return (
                      <tr
                        key={assignment.id}
                        className="transition hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50"
                      >
                        <td className="py-4 pl-6 pr-3 font-semibold text-foreground">
                          {cleanTitle}
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-muted-foreground">
                          #{assignment.assignment_no}
                        </td>
                        <td className="py-4 px-4 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {assignment.total_questions} Qs
                          </span>
                          <span className="text-muted-foreground/80"> • {mpq} M/Q</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40">
                            {totalMarks} Marks
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge
                            submission={submission}
                            audience="student"
                            maxMarks={totalMarks}
                          />
                        </td>
                        <td className="py-4 pr-6 pl-4 text-right">
                          <Button
                            asChild
                            size="sm"
                            variant={isChecked ? "default" : isSubmitted ? "secondary" : "default"}
                            className={`rounded-xl font-semibold shadow-xs ${
                              isChecked
                                ? "bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                                : isSubmitted
                                  ? "border border-border/80 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                                  : "bg-[#0d5c52] text-white hover:bg-[#0a4840]"
                            }`}
                          >
                            <Link
                              to="/student/assignments/$assignmentId"
                              params={{ assignmentId: assignment.id }}
                            >
                              {isChecked
                                ? "View Marks"
                                : isSubmitted
                                  ? "Submitted & Review"
                                  : "Submit"}
                            </Link>
                          </Button>
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
