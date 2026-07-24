import { prisma } from "@/lib/prisma";

export type AdminNotificationType = "ORDER" | "PAYMENT" | "SUPPORT" | "SYSTEM";

export async function createAdminNotification(input: {
  type: AdminNotificationType;
  title: string;
  body: string;
  href?: string | null;
}) {
  try {
    return await prisma.adminNotification.create({
      data: {
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to create admin notification:", err);
    return null;
  }
}
