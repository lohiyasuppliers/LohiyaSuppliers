import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClientApi } from "@/lib/admin-api";
import { apiError, parseJsonBody } from "@/lib/api";

export async function GET() {
  const auth = await requireClientApi();
  if (!auth.authorized) return auth.response;

  const threads = await prisma.supportThread.findMany({
    where: { clientId: auth.session.user.id },
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return NextResponse.json(threads);
}

export async function POST(req: Request) {
  const auth = await requireClientApi();
  if (!auth.authorized) return auth.response;

  const body = await parseJsonBody<{ subject?: string }>(req);
  const subject = String(body?.subject || "Support").trim() || "Support";

  const existing = await prisma.supportThread.findFirst({
    where: { clientId: auth.session.user.id },
    orderBy: { lastMessageAt: "desc" },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const thread = await prisma.supportThread.create({
    data: {
      clientId: auth.session.user.id,
      subject,
    },
  });

  return NextResponse.json(thread, { status: 201 });
}
