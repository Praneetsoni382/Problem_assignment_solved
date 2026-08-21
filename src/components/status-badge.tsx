import { Badge } from "@/components/ui/badge";
import type { Submission } from "@/lib/db";

export function StatusBadge({
  submission,
  audience = "student",
  maxMarks,
}: {
  submission: Pick<Submission, "status" | "checked_status" | "total_marks"> | null | undefined;
  audience?: "student" | "teacher";
  maxMarks?: number;
}) {
  // If not submitted yet (no submission record or status is draft / not_submitted)
  if (!submission || submission.status !== "submitted") {
    return (
      <Badge
        variant="outline"
        className="rounded-lg border-dashed border-neutral-300 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
      >
        Not submitted
      </Badge>
    );
  }

  // If teacher has graded/checked the submission
  if (submission.checked_status === "checked") {
    const marksText =
      submission.total_marks !== null && submission.total_marks !== undefined
        ? `${submission.total_marks}`
        : "0";
    return (
      <Badge className="rounded-lg border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900 shadow-xs hover:bg-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
        Checked — {marksText}
        {maxMarks !== undefined ? ` / ${maxMarks}` : ""}
      </Badge>
    );
  }

  // If submitted, but teacher has not checked yet
  return (
    <Badge
      variant="secondary"
      className="rounded-lg border border-amber-300/80 bg-amber-100/90 px-2.5 py-0.5 text-xs font-semibold text-amber-900 shadow-xs dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-300"
    >
      {audience === "student" ? "Submitted (Pending Review)" : "Submitted — Pending"}
    </Badge>
  );
}
