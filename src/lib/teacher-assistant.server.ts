import { GoogleGenAI } from "@google/genai";
import { processLocalTeacherQuery } from "./teacher-query-engine";

export interface StudentRecord {
  id: string;
  full_name: string;
  enrollment_no: string | null;
  email: string;
  created_at?: string;
}

export interface AssignmentRecord {
  id: string;
  assignment_no: number;
  title: string;
  total_questions: number;
  is_open: boolean;
  created_at?: string;
}

export interface SubmissionRecord {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name?: string;
  student_enrollment?: string | null;
  assignment_no?: number;
  assignment_title?: string;
  status: "draft" | "submitted" | "checked";
  checked_status: "pending" | "checked" | "partially_checked" | "unchecked";
  total_marks: number | null;
  submitted_at: string | null;
}

export interface TeacherAssistantContext {
  teacherName?: string;
  students: StudentRecord[];
  assignments: AssignmentRecord[];
  submissions: SubmissionRecord[];
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface TeacherAssistantQueryPayload {
  message: string;
  history?: ChatMessage[];
  context: TeacherAssistantContext;
  preferLocalEngine?: boolean;
}

export async function askTeacherAssistant({
  message,
  history = [],
  context,
  preferLocalEngine = false,
}: TeacherAssistantQueryPayload): Promise<string> {
  // If user explicitly chose local engine or wants 0 API dependency
  if (preferLocalEngine) {
    return processLocalTeacherQuery(message, context);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Graceful automatic fallback: answer directly with local deterministic engine instead of crashing
    console.warn("GEMINI_API_KEY not configured. Falling back to local classroom query engine.");
    return processLocalTeacherQuery(message, context);
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const { students = [], assignments = [], submissions = [], teacherName } = context;

  // Build aggregated metrics for immediate context grounding
  const totalStudents = students.length;
  const totalAssignments = assignments.length;

  const assignmentSummaries = assignments.map((a) => {
    const subsForAssignment = submissions.filter((s) => s.assignment_id === a.id);
    const submittedCount = subsForAssignment.filter(
      (s) => s.status === "submitted" || s.status === "checked",
    ).length;
    const checkedCount = subsForAssignment.filter((s) => s.checked_status === "checked").length;
    const pendingCount = subsForAssignment.filter(
      (s) =>
        (s.status === "submitted" || s.status === "checked") &&
        (s.checked_status === "pending" ||
          s.checked_status === "unchecked" ||
          s.checked_status === "partially_checked"),
    ).length;
    const remainingCount = Math.max(0, totalStudents - submittedCount);

    return {
      assignment_no: a.assignment_no,
      title: a.title,
      id: a.id,
      total_questions: a.total_questions,
      is_open: a.is_open,
      submitted_count: submittedCount,
      remaining_students_count: remainingCount,
      checked_count: checkedCount,
      pending_grade_count: pendingCount,
    };
  });

  // Map of student lookup for quick reasoning
  const studentRosterSummary = students.map((s) => ({
    name: s.full_name,
    enrollment_no: s.enrollment_no || "N/A",
    email: s.email,
  }));

  // Build high-density context snapshot
  const knowledgeBaseText = `
=== CURRENT LIVE CLASSROOM KNOWLEDGE BASE ===
Teacher Name: ${teacherName || "Instructor"}
Total Registered Students: ${totalStudents}
Total Assignments Created: ${totalAssignments}

ASSIGNMENT OVERVIEW & STATUS:
${
  assignmentSummaries.length === 0
    ? "No assignments created yet."
    : assignmentSummaries
        .map(
          (a) =>
            `- Assignment #${a.assignment_no}: "${a.title}" | Status: ${
              a.is_open ? "Open" : "Closed"
            } | Total Questions: ${a.total_questions} | Submitted: ${
              a.submitted_count
            }/${totalStudents} | Remaining: ${a.remaining_students_count} | Checked: ${
              a.checked_count
            } | Pending Grading: ${a.pending_grade_count}`,
        )
        .join("\n")
}

REGISTERED STUDENT ROSTER (${totalStudents} students):
${
  studentRosterSummary.length === 0
    ? "No students registered in roster."
    : studentRosterSummary
        .map(
          (s, idx) =>
            `${idx + 1}. Name: "${s.name}" | Enrollment No: ${s.enrollment_no} | Email: ${s.email}`,
        )
        .join("\n")
}

DETAILED SUBMISSION LOGS (${submissions.length} records):
${
  submissions.length === 0
    ? "No submissions logged yet."
    : submissions
        .map(
          (s) =>
            `- Student: "${s.student_name || "Unknown"}" (Enrollment: ${
              s.student_enrollment || "N/A"
            }) | Assignment #${s.assignment_no ?? "?"} ("${
              s.assignment_title || "Unknown"
            }") | Status: ${s.status} | Checked: ${s.checked_status} | Marks: ${
              s.total_marks !== null ? s.total_marks : "Not Graded"
            } | Submitted At: ${s.submitted_at || "Draft"}`,
        )
        .join("\n")
}

APP APPLICATION SYSTEM KNOWLEDGE:
- AssignEase is a specialized college assignment submission and grading portal.
- Only teachers can create assignments, evaluate answer scans question-by-question, delete students permanently from the vault, and export CSV/Excel marks sheets.
- CSV/Excel export format strictly orders: "enrollment_no", "names", followed by each assignment number (e.g. assignment 1, assignment 2, etc.) with awarded marks or 0 if unsubmitted/unchecked.
- Permanent deletion removes the student from profiles, authentication, user accounts, and robs them of login capability permanently unless re-registered.
- Each assignment typically has a configured number of questions (e.g., 5 questions of 20 marks = 100 marks total, or custom per question).
=== END KNOWLEDGE BASE ===
`;

  const systemInstruction = `
You are the "AssignEase Teacher Assistant", an intelligent, authoritative AI assistant integrated strictly into the Teacher Dashboard.
Your role is to empower the teacher by querying, analyzing, and reporting on their classroom database, students, submissions, marks, and application workflows.

CRITICAL INSTRUCTIONS & BEHAVIOR:
1. STRICT GROUNDING IN APPLICATION DATA:
   - All factual queries regarding student names, enrollment numbers, submission numbers, remaining non-submitters, assignment titles, deadlines, marks, and pending reviews MUST be derived directly from the LIVE CLASSROOM KNOWLEDGE BASE above.
   - If asked: "tell me how many students have submitted 4th assignment how many remaining":
     * Locate Assignment #4 (or matching title).
     * Report the exact number of submitted students and the exact number of remaining students (Total Students - Submitted).
     * If helpful, list the names of the students who have submitted or who are still remaining.
   - If asked: "tell me the student enrollment number if name is present" (or any variation like "What is [Student Name]'s enrollment number?"):
     * Search the student roster for the name (case-insensitive fuzzy or exact match).
     * Clearly provide their full name, enrollment number, and email.
     * If not found, explicitly state that no student with that name is registered in the current roster.
   - If asked about pending grading:
     * List assignments and students whose work is submitted but not yet fully checked (pending/partially_checked/unchecked).
   - If asked for class analytics or averages:
     * Compute and report the calculated statistics based on the marks in the records.

2. CONTEXT LIMITATION & GUARDRAIL:
   - You must strictly remain inside the context of the AssignEase application, classroom records, students, assignments, and educational grading.
   - If the teacher asks an off-topic question unrelated to AssignEase or classroom management (e.g., general world trivia, unrelated software, casual conversation), politely acknowledge and redirect: "I am your dedicated AssignEase Classroom Assistant. I can help you with student enrollment details, assignment submissions, pending grading, score summaries, and classroom records."

3. FORMATTING & TONE:
   - Professional, supportive, concise, and structured.
   - Use bold highlights for numbers, markdown bullet points, and tables where displaying lists of students or assignments.
   - Avoid generic AI disclaimers or verbose filler. Answer the teacher's exact question directly and efficiently.
`;

  // Build the message sequence for multi-turn conversation
  const contents: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [];

  // Provide initial knowledge context in the first prompt
  const initialContextPrompt = `${knowledgeBaseText}\n\nTeacher's Request: ${message}`;

  if (history && history.length > 0) {
    // Inject knowledge base into first user turn or prepend
    let isFirst = true;
    for (const item of history) {
      if (isFirst && item.role === "user") {
        contents.push({
          role: "user",
          parts: [{ text: `${knowledgeBaseText}\n\n${item.text}` }],
        });
        isFirst = false;
      } else {
        contents.push({
          role: item.role,
          parts: [{ text: item.text }],
        });
      }
    }
    // Append current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });
  } else {
    contents.push({
      role: "user",
      parts: [{ text: initialContextPrompt }],
    });
  }

  // Robust Model Cascading:
  // Starts with 'gemini-flash-latest' (primary high-throughput, lowest latency),
  // cascades to 'gemini-3.1-flash-lite' (high concurrency efficiency),
  // and cascades to 'gemini-3.8-flash' (advanced reasoning flash model).
  // Includes exponential backoff retry for transient 503 high demand spikes.
  const candidateModels = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.8-flash"];
  let lastError: unknown = null;

  for (const model of candidateModels) {
    // Attempt with retry on temporary 503 spikes
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.2, // Low temperature for high factual accuracy
          },
        });

        const reply = response.text?.trim();
        if (reply) {
          return reply;
        }
      } catch (err: unknown) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);
        const isSpikeOrRateLimit =
          errMsg.includes("503") ||
          errMsg.includes("high demand") ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("UNAVAILABLE");

        console.warn(`[Model Cascade] Attempt ${attempt} on model ${model} encountered: ${errMsg}`);

        if (isSpikeOrRateLimit && attempt < 2) {
          // Brief backoff before next attempt or next model
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        // Break out of retry loop to cascade immediately to next model
        break;
      }
    }
  }

  // If all Gemini models in the cascade are experiencing simultaneous capacity spikes,
  // gracefully fall back to the built-in deterministic query engine so the teacher never gets an error
  console.warn(
    "All Gemini candidate models in cascade experienced demand spikes. Seamlessly answering via built-in engine.",
    lastError,
  );
  try {
    const localAnswer = processLocalTeacherQuery(message, context);
    return `> 💡 *Note: Google Gemini models experienced a temporary peak demand spike (503). Your question was answered seamlessly by our live database query engine.*\n\n${localAnswer}`;
  } catch (engineErr) {
    console.error("Local query engine error:", engineErr);
    const errMessage =
      lastError instanceof Error ? lastError.message : "Error contacting Gemini API";
    throw new Error(`Teacher Assistant: ${errMessage}`);
  }
}
