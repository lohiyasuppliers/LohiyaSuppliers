import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const clientId = new URL(req.url).searchParams.get("clientId");
  const bills = await prisma.clientBill.findMany({
    where: clientId ? { clientId } : undefined,
    include: { client: { select: { name: true, email: true } } },
    orderBy: { billDate: "desc" },
  });
  return NextResponse.json(bills);
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const { clientId, billNumber, title, description, fileUrl, amountRupees, billDate, orderId, notes } =
    body;

  if (!clientId || !billNumber) {
    return NextResponse.json({ error: "clientId and billNumber required" }, { status: 400 });
  }

  if (!fileUrl?.trim()) {
    return NextResponse.json({ error: "Bill file is required" }, { status: 400 });
  }

  const bill = await prisma.clientBill.create({
    data: {
      clientId,
      billNumber,
      title: title || null,
      description: description || null,
      fileUrl: fileUrl || null,
      amountPaise: amountRupees != null ? Math.round(Number(amountRupees) * 100) : null,
      billDate: billDate ? new Date(billDate) : new Date(),
      orderId: orderId || null,
      notes: notes || null,
      createdById: auth.session?.user?.id,
    },
  });

  return NextResponse.json(bill, { status: 201 });
}
