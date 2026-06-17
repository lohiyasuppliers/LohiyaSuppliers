import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      clientProfile: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...user,
    profileComplete: !!user.clientProfile,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const { name, phone, company, gstin, billingState, address, city, pincode } = data;

  if (!company?.trim() || !billingState?.trim()) {
    return NextResponse.json({ error: "Company and billing state are required" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name?.trim() || undefined,
      phone: phone?.trim() || undefined,
      clientProfile: {
        upsert: {
          create: {
            company: company.trim(),
            gstin: gstin?.trim()?.toUpperCase() || null,
            billingState: billingState.trim(),
            address: address?.trim() || null,
            city: city?.trim() || null,
            pincode: pincode?.trim() || null,
          },
          update: {
            company: company.trim(),
            gstin: gstin?.trim()?.toUpperCase() || null,
            billingState: billingState.trim(),
            address: address?.trim() || null,
            city: city?.trim() || null,
            pincode: pincode?.trim() || null,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      clientProfile: true,
    },
  });

  return NextResponse.json({ ...user, profileComplete: true });
}
