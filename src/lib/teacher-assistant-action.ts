import { createServerFn } from "@tanstack/react-start";
import { askTeacherAssistant, type TeacherAssistantQueryPayload } from "./teacher-assistant.server";

export const queryTeacherAssistantServerAction = createServerFn({ method: "POST" })
  .validator((data: TeacherAssistantQueryPayload) => data)
  .handler(async ({ data }) => {
    return await askTeacherAssistant(data);
  });
