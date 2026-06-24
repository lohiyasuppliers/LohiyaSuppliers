import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { saveBillFile } from "@/lib/bill-storage";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const clientId = formData.get("clientId") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: { role: true },
  });
  if (!client || client.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Invalid client" }, { status: 400 });
  }

  try {
    const { relativePath, originalName } = await saveBillFile(clientId, file);
    return NextResponse.json({
      fileUrl: relativePath,
      originalFileName: originalName,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 }
    );
  }
}
