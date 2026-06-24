import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import path from "path";
import {
  contentTypeForBillFile,
  isExternalBillUrl,
  readBillFile,
} from "@/lib/bill-storage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const bill = await prisma.clientBill.findUnique({ where: { id } });

  if (!bill?.fileUrl) {
    return NextResponse.json({ error: "Bill file not found" }, { status: 404 });
  }

  const isOwner = bill.clientId === session.user.id;
  const isAdmin = session.user.role === Role.ADMIN;
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isExternalBillUrl(bill.fileUrl)) {
    return NextResponse.redirect(bill.fileUrl);
  }

  try {
    const buffer = await readBillFile(bill.fileUrl);
    const download = new URL(req.url).searchParams.get("download") === "1";
    const ext = path.extname(bill.fileUrl) || ".pdf";
    const filename = `${bill.billNumber.replace(/[^\w.-]+/g, "_")}${ext}`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentTypeForBillFile(bill.fileUrl),
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found on server" }, { status: 404 });
  }
}
