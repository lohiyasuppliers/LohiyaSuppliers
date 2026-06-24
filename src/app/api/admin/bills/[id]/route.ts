import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { deleteBillFile } from "@/lib/bill-storage";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const bill = await prisma.clientBill.findUnique({ where: { id } });
  if (bill?.fileUrl) await deleteBillFile(bill.fileUrl);
  await prisma.clientBill.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
