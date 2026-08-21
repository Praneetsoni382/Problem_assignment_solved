/**
 * Brevo (Sendinblue) Transactional Email Service
 * Handles sending email verification links and password reset links to users
 */

const DEFAULT_BREVO_API_KEY =
  "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";
const DEFAULT_SENDER_EMAIL = "praneetsoni20480@gmail.com";
const SENDER_NAME = "AssignEase";

export interface SendVerificationEmailParams {
  toEmail: string;
  toName: string;
  verificationUrl: string;
  role?: "student" | "teacher";
}

export interface SendPasswordResetEmailParams {
  toEmail: string;
  toName?: string;
  resetUrl: string;
}

/**
 * Send Transactional Email via Brevo REST API v3
 */
async function sendBrevoEmail(payload: {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}): Promise<{ success: boolean; messageId?: string }> {
  const apiKey = process.env.BREVO_API_KEY || DEFAULT_BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || DEFAULT_SENDER_EMAIL;

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured.");
  }

  const body = {
    sender: {
      name: SENDER_NAME,
      email: senderEmail,
    },
    to: [
      {
        email: payload.toEmail.trim().toLowerCase(),
        name: payload.toName || "AssignEase User",
      },
    ],
    subject: payload.subject,
    htmlContent: payload.htmlContent,
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Brevo API Error Response:", response.status, errorText);
    let parsedMsg = errorText;
    try {
      const parsed = JSON.parse(errorText) as { message?: string; code?: string };
      if (parsed.message) parsedMsg = parsed.message;
    } catch {
      // keep raw
    }
    throw new Error(`Failed to send email via Brevo: ${parsedMsg}`);
  }

  const result = (await response.json()) as { messageId?: string };
  console.info(
    `Brevo Email successfully dispatched to ${payload.toEmail}, messageId:`,
    result.messageId,
  );
  return { success: true, messageId: result.messageId };
}

/**
 * Send Account Verification Email with 1-click verification link
 */
export async function sendVerificationEmailBrevo({
  toEmail,
  toName,
  verificationUrl,
  role = "student",
}: SendVerificationEmailParams): Promise<{ success: boolean; messageId?: string }> {
  const roleLabel = role === "teacher" ? "Teacher" : "Student";
  const subject = `Verify your AssignEase ${roleLabel} account`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #FAF7F2;
      margin: 0;
      padding: 24px;
      color: #1c2624;
    }
    .email-container {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      border: 1px solid #e7dfd5;
    }
    .header {
      background: #13463F;
      padding: 32px 28px;
      text-align: center;
      color: #ffffff;
    }
    .logo-text {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
      color: #ffffff;
    }
    .logo-badge {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #d1fae5;
    }
    .content {
      padding: 36px 32px;
      text-align: left;
    }
    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #13463F;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .message {
      font-size: 15px;
      line-height: 1.6;
      color: #4b5563;
      margin-bottom: 28px;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background-color: #0F685C;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 700;
      padding: 14px 36px;
      border-radius: 999px;
      box-shadow: 0 4px 14px rgba(15, 104, 92, 0.3);
      transition: background-color 0.2s ease;
    }
    .btn:hover {
      background-color: #0c564c;
    }
    .link-alt {
      font-size: 12px;
      color: #6b7280;
      word-break: break-all;
      background: #f9fafb;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      margin-top: 24px;
    }
    .footer {
      background: #FAF7F2;
      padding: 20px 32px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      border-top: 1px solid #ede7df;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 class="logo-text">AssignEase</h1>
      <span class="logo-badge">Account Verification</span>
    </div>
    <div class="content">
      <h2 class="greeting">Hello ${toName || "there"},</h2>
      <p class="message">
        Thank you for registering on <strong>AssignEase</strong> as a <strong>${roleLabel}</strong>.
        Please click the button below to verify your email address and activate your account.
      </p>
      
      <div class="btn-container">
        <a href="${verificationUrl}" target="_blank" class="btn">Verify My Email Address</a>
      </div>

      <p class="message" style="margin-bottom: 8px; font-size: 13px;">
        If the button above does not work, copy and paste this link into your browser:
      </p>
      <div class="link-alt">
        <a href="${verificationUrl}" style="color: #0F685C;">${verificationUrl}</a>
      </div>

      <p class="message" style="margin-top: 24px; font-size: 13px; color: #9ca3af;">
        This verification link will remain active for 24 hours. If you did not create an AssignEase account, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} AssignEase. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  return await sendBrevoEmail({
    toEmail,
    toName,
    subject,
    htmlContent,
  });
}

/**
 * Send Password Reset Email with 1-click password reset link
 */
export async function sendPasswordResetEmailBrevo({
  toEmail,
  toName = "User",
  resetUrl,
}: SendPasswordResetEmailParams): Promise<{ success: boolean; messageId?: string }> {
  const subject = "Reset your AssignEase password";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #FAF7F2;
      margin: 0;
      padding: 24px;
      color: #1c2624;
    }
    .email-container {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      border: 1px solid #e7dfd5;
    }
    .header {
      background: #13463F;
      padding: 32px 28px;
      text-align: center;
      color: #ffffff;
    }
    .logo-text {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
      color: #ffffff;
    }
    .logo-badge {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #d1fae5;
    }
    .content {
      padding: 36px 32px;
      text-align: left;
    }
    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #13463F;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .message {
      font-size: 15px;
      line-height: 1.6;
      color: #4b5563;
      margin-bottom: 28px;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background-color: #0F685C;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 700;
      padding: 14px 36px;
      border-radius: 999px;
      box-shadow: 0 4px 14px rgba(15, 104, 92, 0.3);
      transition: background-color 0.2s ease;
    }
    .btn:hover {
      background-color: #0c564c;
    }
    .link-alt {
      font-size: 12px;
      color: #6b7280;
      word-break: break-all;
      background: #f9fafb;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      margin-top: 24px;
    }
    .footer {
      background: #FAF7F2;
      padding: 20px 32px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      border-top: 1px solid #ede7df;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 class="logo-text">AssignEase</h1>
      <span class="logo-badge">Password Reset</span>
    </div>
    <div class="content">
      <h2 class="greeting">Hello ${toName || "there"},</h2>
      <p class="message">
        We received a request to reset the password for your AssignEase account. Click the button below to choose a new password:
      </p>
      
      <div class="btn-container">
        <a href="${resetUrl}" target="_blank" class="btn">Reset Password</a>
      </div>

      <p class="message" style="margin-bottom: 8px; font-size: 13px;">
        If the button does not work, copy and paste this link into your browser:
      </p>
      <div class="link-alt">
        <a href="${resetUrl}" style="color: #0F685C;">${resetUrl}</a>
      </div>

      <p class="message" style="margin-top: 24px; font-size: 13px; color: #9ca3af;">
        This password reset link is valid for 2 hours. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} AssignEase. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  return await sendBrevoEmail({
    toEmail,
    toName,
    subject,
    htmlContent,
  });
}
