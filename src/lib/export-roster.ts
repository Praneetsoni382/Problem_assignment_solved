import type { Assignment, Profile, Submission } from "@/lib/db";

function cell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildRosterCsv(
  students: Profile[],
  assignments: Assignment[],
  submissions: Submission[],
): string {
  // Sort assignments logically by assignment_no ascending (e.g., assignment 1, assignment 2)
  const sortedAssignments = [...assignments].sort((a, b) => {
    const noA = Number(a.assignment_no) || 0;
    const noB = Number(b.assignment_no) || 0;
    if (noA !== noB) return noA - noB;
    return a.title.localeCompare(b.title);
  });

  // Columns: "enrollment_no" first, then "names", then all assigned assignments as "assignment X"
  const headers = [
    "enrollment_no",
    "names",
    ...sortedAssignments.map((a) => `assignment ${a.assignment_no}`),
  ];

  const rows: string[] = [headers.map(cell).join(",")];

  for (const student of students) {
    const studentEnrollment = student.enrollment_no || "";
    const studentName = student.full_name || "";

    const assignmentMarks = sortedAssignments.map((assignment) => {
      const submission = submissions.find(
        (s) => s.assignment_id === assignment.id && s.student_id === student.id,
      );

      // If checked/graded by teacher, use marks awarded; otherwise (not checked or not submitted), mark as 0
      const isChecked = submission?.checked_status === "checked";
      if (isChecked && typeof submission?.total_marks === "number") {
        return submission.total_marks;
      }
      return 0;
    });

    const row = [studentEnrollment, studentName, ...assignmentMarks];
    rows.push(row.map(cell).join(","));
  }

  return rows.join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  // BOM (\uFEFF) keeps Excel and spreadsheet software happy with UTF-8 encoding
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
