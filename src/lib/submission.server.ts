import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Tables } from "@/integrations/supabase/types";

export type Submission = Tables<"submissions">;

export async function getOrCreateSubmissionAdmin(
  assignmentId: string,
  studentId: string,
): Promise<Submission> {
  // 1. Check if submission already exists
  const { data: existing, error: readError } = await supabaseAdmin
    .from("submissions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (readError) {
    console.error("Error reading existing submission:", readError);
    throw new Error(`Database error: ${readError.message}`);
  }

  if (existing) {
    return existing;
  }

  // 2. Insert new submission row bypassing RLS via server admin client
  const { data: created, error: insertError } = await supabaseAdmin
    .from("submissions")
    .insert({
      assignment_id: assignmentId,
      student_id: studentId,
      status: "in_progress",
      checked_status: "unchecked",
    })
    .select("*")
    .single();

  if (insertError) {
    console.error("Error creating submission with admin client:", insertError);
    throw new Error(`Failed to create submission: ${insertError.message}`);
  }

  return created;
}
