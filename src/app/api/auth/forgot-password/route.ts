import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, parseJsonBody } from "@/lib/api";
import { sendPasswordResetOtp } from "@/lib/email";
import { Role } from "@prisma/client";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  const body = await parseJsonBody<{ email?: string }>(req);
  const email = String(body?.email || "")
    .toLowerCase()
    .trim();

  if (!email) return apiError("Email is required");

  // Always return success to avoid email enumeration
  const generic = NextResponse.json({
    success: true,
    message: "If an account exists for that email, a reset code has been sent.",
  });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role === Role.ADMIN || !user.isActive) {
    return generic;
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.passwordResetOtp.create({
    data: { email, otpHash, expiresAt },
  });

  try {
    await sendPasswordResetOtp(email, otp);
  } catch (err) {
    console.error("Failed to send reset OTP:", err);
    if (!process.env.RESEND_API_KEY) {
      console.log(`[forgot-password] OTP for ${email}: ${otp}`);
    } else {
      return apiError("Failed to send reset email. Please try again later.", 500);
    }
  }

  if (!process.env.RESEND_API_KEY) {
    console.log(`[forgot-password] OTP for ${email}: ${otp}`);
  }

  return generic;
}
