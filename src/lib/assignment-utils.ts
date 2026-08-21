import type { Assignment } from "./db";

/**
 * Extracts the marks per question configured for this assignment.
 * Fallback to 5 marks per question if unspecified.
 */
export function getAssignmentMarksPerQuestion(assignment?: Assignment | null): number {
  if (!assignment) return 5;

  // 1. Check if question_paper_url contains mpq query parameter or meta:mpq
  if (assignment.question_paper_url) {
    const match = assignment.question_paper_url.match(/mpq=(\d+)/i);
    if (match && Number(match[1]) > 0) {
      return Number(match[1]);
    }
  }

  // 2. Check if title contains [X marks/q] or [X M/Q]
  if (assignment.title) {
    const match =
      assignment.title.match(/\[(\d+)\s*(?:marks?\/q|m\/q|marks|m)\]/i) ||
      assignment.title.match(/\((\d+)\s*(?:marks?\/q|m\/q|marks|m)\)/i);
    if (match && Number(match[1]) > 0) {
      return Number(match[1]);
    }
  }

  return 5;
}

/**
 * Calculates the total marks for an assignment:
 * total_questions * marks_per_question
 */
export function getAssignmentTotalMarks(assignment?: Assignment | null): number {
  if (!assignment) return 0;
  const questions = Number(assignment.total_questions) || 1;
  const mpq = getAssignmentMarksPerQuestion(assignment);
  return questions * mpq;
}

/**
 * Strips any internal marks tag from the title for clean visual display
 */
export function getCleanAssignmentTitle(title?: string | null): string {
  if (!title) return "Assignment";
  return title
    .replace(/\s*\[\d+\s*(?:marks?\/q|m\/q|marks|m)\]/i, "")
    .replace(/\s*\(\d+\s*(?:marks?\/q|m\/q|marks|m)\)/i, "")
    .trim();
}

/**
 * Encodes marks per question into the question_paper_url storage path
 */
export function encodeQuestionPaperUrl(
  path: string | null | undefined,
  marksPerQuestion: number,
): string {
  if (path && path.trim()) {
    // If it's a base64 Data URL, we should not corrupt base64 with ?mpq
    if (path.startsWith("data:")) {
      return path;
    }
    const cleanPath = path.split("?")[0];
    return `${cleanPath}?mpq=${marksPerQuestion}`;
  }
  return `meta:mpq=${marksPerQuestion}`;
}

/**
 * Extracts the real storage path from a question_paper_url (removing mpq param)
 */
export function getStoragePathFromQuestionPaperUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("meta:mpq=")) return null;
  if (url.startsWith("data:")) {
    // Strip trailing ?mpq= or &mpq= if it was previously appended
    return url.replace(/[?&]mpq=\d+$/, "");
  }
  return url.split("?")[0];
}
