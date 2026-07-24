import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClientApi } from "@/lib/admin-api";
import { apiError, parseJsonBody } from "@/lib/api";
import { createAdminNotification } from "@/lib/admin-notifications";
import { Role } from "@prisma/client";

async function getOwnedThread(threadId: string, clientId: string) {
  return prisma.supportThread.findFirst({
    where: { id: threadId, clientId },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireClientApi();
  if (!auth.authorized) return auth.response;
  const { id } = await params;

  const thread = await getOwnedThread(id, auth.session.user.id);
  if (!thread) return apiError("Thread not found", 404);

  const messages = await prisma.supportMessage.findMany({
    where: { threadId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ thread, messages });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireClientApi();
  if (!auth.authorized) return auth.response;
  const { id } = await params;

  const thread = await getOwnedThread(id, auth.session.user.id);
  if (!thread) return apiError("Thread not found", 404);

  const body = await parseJsonBody<{ body?: string; attachments?: unknown }>(req);
  const text = String(body?.body || "").trim();
  const attachments = Array.isArray(body?.attachments) ? body!.attachments : [];
  if (!text && attachments.length === 0) {
    return apiError("Message body or attachment required");
  }

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.supportMessage.create({
      data: {
        threadId: id,
        senderId: auth.session.user.id,
        senderRole: Role.CLIENT,
        body: text,
        attachments: JSON.stringify(attachments),
      },
    });
    await tx.supportThread.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });
    return created;
  });

  const clientName = auth.session.user.name || auth.session.user.email || "Client";
  await createAdminNotification({
    type: "SUPPORT",
    title: "New support message",
    body: `${clientName}: ${text.slice(0, 120) || "Sent an attachment"}`,
    href: `/admin/support?thread=${id}`,
  });

  return NextResponse.json(message, { status: 201 });
}
