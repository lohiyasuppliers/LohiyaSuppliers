import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, parseJsonBody } from "@/lib/api";

export async function POST(req: Request) {
  const body = await parseJsonBody<{
    email?: string;
    otp?: string;
    newPassword?: string;
  }>(req);

  const email = String(body?.email || "")
    .toLowerCase()
    .trim();
  const otp = String(body?.otp || "").trim();
  const newPassword = String(body?.newPassword || "");

  if (!email || !otp || !newPassword) {
    return apiError("Email, OTP, and new password are required");
  }
  if (newPassword.length < 6) {
    return apiError("Password must be at least 6 characters");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return apiError("Invalid or expired reset code", 400);
  }

  const candidates = await prisma.passwordResetOtp.findMany({
    where: {
      email,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  let matched: (typeof candidates)[number] | null = null;
  for (const row of candidates) {
    if (await bcrypt.compare(otp, row.otpHash)) {
      matched = row;
      break;
    }
  }

  if (!matched) {
    return apiError("Invalid or expired reset code", 400);
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
    prisma.passwordResetOtp.update({
      where: { id: matched.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ success: true, message: "Password updated. You can sign in now." });
}
