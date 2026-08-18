import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-assignease";
import { listAssignments, listSubmissions } from "@/lib/db";

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
    if (!isLoading && profile && profile.role === "teacher") navigate({ to: "/teacher" });
    if (!isLoading && !profile)
      navigate({ to: "/register", search: { role: "student", email: "" } });
  }, [isLoading, profile, navigate]);

  const assignments = useQuery({ queryKey: ["assignments"], queryFn: listAssignments });
  const submissions = useQuery({ queryKey: ["submissions"], queryFn: () => listSubmissions() });

  useEffect(() => {
    const channel = supabase
      .channel("student-submissions")
      .on("postgres_changes", { event: "*", schema: "public", table: "submissions" }, () =>
        queryClient.invalidateQueries({ queryKey: ["submissions"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
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
                  <th className="py-3.5 px-4">Questions</th>
                  <th className="py-3.5 px-4">Submission Status</th>
                  <th className="py-3.5 pr-6 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {assignments.isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                      Loading assignments...
                    </td>
                  </tr>
                ) : assignments.data?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                      No assignments have been posted yet.
                    </td>
                  </tr>
                ) : (
                  assignments.data?.map((assignment) => {
                    const submission = submissions.data?.find(
                      (s) => s.assignment_id === assignment.id,
                    );
                    const isSubmitted = submission?.status === "submitted";
                    const isChecked = submission?.checked_status === "checked";

                    return (
                      <tr
                        key={assignment.id}
                        className="transition hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50"
                      >
                        <td className="py-4 pl-6 pr-3 font-semibold text-foreground">
                          {assignment.title}
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-muted-foreground">
                          #{assignment.assignment_no}
                        </td>
                        <td className="py-4 px-4 text-xs text-muted-foreground">
                          {assignment.total_questions} Questions
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge submission={submission} audience="student" />
                        </td>
                        <td className="py-4 pr-6 pl-4 text-right">
                          <Button
                            asChild
                            size="sm"
                            className="rounded-xl bg-[#0d5c52] font-semibold text-white shadow-xs hover:bg-[#0a4840]"
                          >
                            <Link
                              to="/student/assignments/$assignmentId"
                              params={{ assignmentId: assignment.id }}
                            >
                              {isChecked
                                ? "View Marks"
                                : isSubmitted
                                  ? "View Submission"
                                  : "Submit Answers"}
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
