import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Assignment = Tables<"assignments">;
export type Submission = Tables<"submissions">;
export type SubmissionPage = Tables<"submission_pages">;
export type QuestionMark = Tables<"question_marks">;

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * After email verification the user has a session but no profile row yet.
 * Create it from the metadata captured at registration. If that metadata is
 * missing (account created outside the registration form), return
 * "needs-details" so the app can ask instead of inventing a name from the email.
 */
export async function ensureProfile(): Promise<Profile | "needs-details" | null> {
  const existing = await getCurrentProfile();
  if (existing) return existing;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metaRole = meta["role"];
  const metaName = meta["full_name"];
  const metaEnrollment = meta["enrollment_no"];
  const role = metaRole === "teacher" ? "teacher" : metaRole === "student" ? "student" : null;
  const fullName = typeof metaName === "string" ? metaName.trim() : "";

  if (!role || fullName.length < 2) return "needs-details";
  if (role === "student" && !(typeof metaEnrollment === "string" && metaEnrollment.trim()))
    return "needs-details";

  return createMyProfile({
    role,
    fullName,
    enrollmentNo:
      role === "student" && typeof metaEnrollment === "string" ? metaEnrollment.trim() : null,
  });
}

export async function createMyProfile(input: {
  role: "student" | "teacher";
  fullName: string;
  enrollmentNo: string | null;
}): Promise<Profile> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("You are not signed in.");

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      role: input.role,
      full_name: input.fullName.trim(),
      email: user.email ?? "",
      enrollment_no: input.role === "student" ? (input.enrollmentNo?.trim() ?? null) : null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateMyProfile(input: {
  fullName: string;
  enrollmentNo?: string | null;
}): Promise<Profile> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("You are not signed in.");

  const patch: { full_name: string; enrollment_no?: string | null } = {
    full_name: input.fullName.trim(),
  };
  if (input.enrollmentNo !== undefined) patch.enrollment_no = input.enrollmentNo?.trim() || null;

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listAssignments(): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .order("assignment_no", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAssignment(id: string): Promise<Assignment | null> {
  const { data, error } = await supabase.from("assignments").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listStudents(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("enrollment_no", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listSubmissions(assignmentId?: string): Promise<Submission[]> {
  let query = supabase.from("submissions").select("*");
  if (assignmentId) query = query.eq("assignment_id", assignmentId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getOrCreateSubmission(
  assignmentId: string,
  studentId: string,
): Promise<Submission> {
  const { data: existing, error: readError } = await supabase
    .from("submissions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (readError) {
    console.warn("Read submission error, trying server action:", readError);
  }
  if (existing) return existing;

  const { data, error } = await supabase
    .from("submissions")
    .insert({ assignment_id: assignmentId, student_id: studentId })
    .select("*")
    .single();

  if (error) {
    // If client insert fails (e.g. 42501 RLS policy restriction), use the secure server action
    console.warn("Client insert submission failed (RLS), delegating to server action:", error);
    const { getOrCreateSubmissionServerAction } = await import("./submission-action");
    return await getOrCreateSubmissionServerAction({
      data: { assignmentId, studentId },
    });
  }
  return data;
}

export async function listPages(submissionId: string): Promise<SubmissionPage[]> {
  const { data, error } = await supabase
    .from("submission_pages")
    .select("*")
    .eq("submission_id", submissionId)
    .order("question_no", { ascending: true })
    .order("uploaded_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function deletePage(pageId: string): Promise<void> {
  const { error } = await supabase.from("submission_pages").delete().eq("id", pageId);
  if (error) throw error;
}

export async function signedUrl(
  bucket: "submission-scans" | "question-papers",
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}
