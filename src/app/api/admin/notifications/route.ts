import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { apiError, parseJsonBody } from "@/lib/api";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "1";

  const notifications = await prisma.adminNotification.findMany({
    where: unreadOnly ? { isRead: false } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.adminNotification.count({ where: { isRead: false } });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const body = await parseJsonBody<{ id?: string; markAllRead?: boolean }>(req);
  if (body?.markAllRead) {
    await prisma.adminNotification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  if (!body?.id) return apiError("Notification id required");

  await prisma.adminNotification.update({
    where: { id: body.id },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
