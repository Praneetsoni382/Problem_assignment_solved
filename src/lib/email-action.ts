import { createServerFn } from "@tanstack/react-start";
import {
  sendVerificationEmailBrevo,
  sendPasswordResetEmailBrevo,
  type SendVerificationEmailParams,
  type SendPasswordResetEmailParams,
} from "./brevo-email.server";

export const sendVerificationEmailServerAction = createServerFn({ method: "POST" })
  .validator((data: SendVerificationEmailParams) => data)
  .handler(async ({ data }) => {
    return await sendVerificationEmailBrevo(data);
  });

export const sendPasswordResetEmailServerAction = createServerFn({ method: "POST" })
  .validator((data: SendPasswordResetEmailParams) => data)
  .handler(async ({ data }) => {
    return await sendPasswordResetEmailBrevo(data);
  });
