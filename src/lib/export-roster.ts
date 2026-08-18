import type { Assignment, Profile, Submission } from "@/lib/db";

const HEADERS = [
  "Registered name",
  "Enrollment no.",
  "Email",
  "Assignment no.",
  "Assignment",
  "Submission status",
  "Marks",
  "Checked",
];

function cell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildRosterCsv(
  students: Profile[],
  assignments: Assignment[],
  submissions: Submission[],
): string {
  const rows: string[] = [HEADERS.join(",")];

  for (const student of students) {
    if (assignments.length === 0) {
      rows.push(
        [student.full_name, student.enrollment_no, student.email, "", "", "", "", ""]
          .map(cell)
          .join(","),
      );
      continue;
    }
    for (const assignment of assignments) {
      const submission = submissions.find(
        (s) => s.assignment_id === assignment.id && s.student_id === student.id,
      );
      const submitted = submission?.status === "submitted";
      const checked = submission?.checked_status === "checked";
      rows.push(
        [
          student.full_name,
          student.enrollment_no,
          student.email,
          assignment.assignment_no,
          assignment.title,
          submitted ? "Submitted" : "Not submitted",
          checked ? (submission?.total_marks ?? 0) : "",
          checked ? "Checked" : "Pending",
        ]
          .map(cell)
          .join(","),
      );
    }
  }

  return rows.join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  // BOM keeps Excel happy with UTF-8 names.
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
