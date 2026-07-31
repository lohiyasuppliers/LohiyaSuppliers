import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";
import { clientCode } from "@/lib/export-format";

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
    "Ticket No",
    "Subject",
    "Client Code",
    "Client Name",
    "Email",
    "Company",
    "Message Count",
    "Last Activity",
    "Conversation Summary",
  ];

  const rows = threads.map((t, idx) => [
    `TKT-${String(idx + 1).padStart(4, "0")}`,
    t.subject,
    clientCode(t.client.email, idx),
    t.client.name || "",
    t.client.email,
    t.client.clientProfile?.company || "",
    t._count.messages,
    new Date(t.lastMessageAt).toISOString().slice(0, 16).replace("T", " "),
    t.messages
      .map((m) => `[${m.senderRole}] ${m.body.replace(/\s+/g, " ").trim().slice(0, 120)}`)
      .join(" | "),
  ]);

  return csvDownloadResponse(buildCsv(headers, rows), "lohiya-support.csv");
}
