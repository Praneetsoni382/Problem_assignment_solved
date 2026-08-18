import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, MessageSquare, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-assignease";

export function StudentGradeNotificationListener() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!profile?.id || profile.role !== "student") return;

    // Listen for realtime notifications (feedback added by teacher)
    const notificationChannel = supabase
      .channel(`student-grading-toasts-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const newNotif = payload.new as {
            assignment_title?: string | null;
            assignment_no?: number | null;
            question_no?: number | null;
            message?: string | null;
          };

          const title = newNotif.assignment_title
            ? newNotif.assignment_title
            : newNotif.assignment_no
              ? `Assignment #${newNotif.assignment_no}`
              : "Assignment";

          const target =
            newNotif.question_no && newNotif.question_no > 0
              ? `Question ${newNotif.question_no}`
              : "Overall Assignment";

          toast.custom(
            () => (
              <div className="flex w-full max-w-md items-start gap-3 rounded-2xl border border-[#b8ded4] bg-white p-4 shadow-xl ring-1 ring-black/5 dark:border-teal-900/60 dark:bg-slate-900">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f2ee] text-[#0d5c52] dark:bg-teal-950 dark:text-teal-300">
                  <MessageSquare className="size-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#0d5c52] dark:text-teal-400">
                      New Teacher Feedback
                    </p>
                    <span className="text-[10px] font-medium text-muted-foreground">{target}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  {newNotif.message && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      "{newNotif.message}"
                    </p>
                  )}
                </div>
              </div>
            ),
            { duration: 6000 },
          );

          queryClient.invalidateQueries({ queryKey: ["notifications", profile.id] });
          queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
          queryClient.invalidateQueries({ queryKey: ["question-marks"] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "submissions",
          filter: `student_id=eq.${profile.id}`,
        },
        (payload) => {
          const oldRecord = payload.old as { checked_status?: string | null };
          const newRecord = payload.new as {
            checked_status?: string | null;
            total_marks?: number | null;
            assignment_id?: string;
          };

          // If status transitioned to checked or total marks were published
          if (newRecord.checked_status === "checked" && oldRecord.checked_status !== "checked") {
            toast.custom(
              () => (
                <div className="flex w-full max-w-md items-start gap-3 rounded-2xl border border-amber-200 bg-white p-4 shadow-xl ring-1 ring-black/5 dark:border-amber-900/60 dark:bg-slate-900">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                    <Award className="size-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Grading Complete
                      </p>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" /> Checked
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      Your assignment has been checked and graded!
                    </p>
                    {newRecord.total_marks !== null && newRecord.total_marks !== undefined && (
                      <p className="text-xs font-medium text-muted-foreground">
                        Total Marks Awarded:{" "}
                        <strong className="text-foreground">{newRecord.total_marks} Marks</strong>
                      </p>
                    )}
                  </div>
                </div>
              ),
              { duration: 7000 },
            );

            queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
            queryClient.invalidateQueries({ queryKey: ["submissions"] });
            queryClient.invalidateQueries({ queryKey: ["student-submissions-list"] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
    };
  }, [profile?.id, profile?.role, queryClient]);

  return null;
}
