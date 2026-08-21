import { createServerFn } from "@tanstack/react-start";
import { getOrCreateSubmissionAdmin } from "./submission.server";

export const getOrCreateSubmissionServerAction = createServerFn({ method: "POST" })
  .validator((data: { assignmentId: string; studentId: string }) => data)
  .handler(async ({ data: { assignmentId, studentId } }) => {
    return await getOrCreateSubmissionAdmin(assignmentId, studentId);
  });
