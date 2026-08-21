import { createServerFn } from "@tanstack/react-start";
import { analyzeQuestionScans } from "./gemini-feedback.server";

export const generateAiFeedbackServerAction = createServerFn({ method: "POST" })
  .validator(
    (data: {
      questionNo: number;
      assignmentTitle?: string;
      images: Array<{ mimeType: string; data: string }>;
    }) => data,
  )
  .handler(async ({ data }) => {
    return await analyzeQuestionScans(data);
  });
