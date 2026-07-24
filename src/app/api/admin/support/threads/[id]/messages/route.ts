import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { apiError, parseJsonBody } from "@/lib/api";
import { Role } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const { id } = await params;

  const thread = await prisma.supportThread.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          clientProfile: { select: { company: true } },
        },
      },
    },
  });
  if (!thread) return apiError("Thread not found", 404);

  const messages = await prisma.supportMessage.findMany({
    where: { threadId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ thread, messages });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const { id } = await params;

  const thread = await prisma.supportThread.findUnique({ where: { id } });
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
        senderRole: Role.ADMIN,
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

  return NextResponse.json(message, { status: 201 });
}
