import { Resend } from "resend";
import { DEFAULT_PLATFORM_SETTINGS } from "@/lib/constants";

function getFromAddress() {
  const contact = process.env.CONTACT_EMAIL || DEFAULT_PLATFORM_SETTINGS.contact_email;
  return `Lohiya Suppliers <${contact || "onboarding@resend.dev"}>`;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[email:dev]", {
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { ok: true as const, mode: "console" as const };
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM || getFromAddress();
  const result = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  if (result.error) {
    console.error("[email] Resend error:", result.error);
    throw new Error(result.error.message || "Failed to send email");
  }

  return { ok: true as const, mode: "resend" as const, id: result.data?.id };
}

export async function sendPasswordResetOtp(email: string, otp: string) {
  const subject = "Your password reset code — Lohiya Suppliers";
  const text = `Your password reset code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0f3d66;">Password reset</h2>
      <p>Use this code to reset your Lohiya Suppliers password:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #0f3d66;">${otp}</p>
      <p style="color: #64748b; font-size: 14px;">This code expires in 10 minutes.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html, text });
}
