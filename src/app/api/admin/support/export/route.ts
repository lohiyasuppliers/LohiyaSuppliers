import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const threads = await prisma.supportThread.findMany({
    include: {
      client: {
        select: {
          name: true,
          email: true,
          clientProfile: { select: { company: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { body: true, senderRole: true, createdAt: true },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const headers = [
    "Thread ID",
    "Subject",
    "Client",
    "Email",
    "Company",
    "Messages",
    "Last Activity",
    "Conversation",
  ];

  const rows = threads.map((t) => [
    t.id,
    t.subject,
    t.client.name || "",
    t.client.email,
    t.client.clientProfile?.company || "",
    t._count.messages,
    new Date(t.lastMessageAt).toISOString(),
    t.messages
      .map((m) => `[${m.senderRole}] ${m.body.replace(/\s+/g, " ").trim()}`)
      .join(" | "),
  ]);

  return csvDownloadResponse(buildCsv(headers, rows), "lohiya-support.csv");
}
