import { Badge } from "@/components/ui/badge";
import type { Submission } from "@/lib/db";

export function StatusBadge({
  submission,
  audience,
}: {
  submission: Pick<Submission, "status" | "checked_status" | "total_marks"> | null | undefined;
  audience: "student" | "teacher";
}) {
  if (!submission || submission.status === "not_submitted") {
    return <Badge variant="outline">Not submitted</Badge>;
  }
  if (submission.checked_status === "checked") {
    return <Badge>Checked — {submission.total_marks ?? 0}</Badge>;
  }
  return (
    <Badge variant="secondary">
      {audience === "student" ? "Submitted — awaiting check" : "Submitted — pending"}
    </Badge>
  );
}
