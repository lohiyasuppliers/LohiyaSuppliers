import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { deleteUserPermanently } from "@/lib/delete-user";
import { Role } from "@prisma/client";

async function getTargetUser(id: string) {
  return prisma.user.findUnique({ where: { id }, select: { id: true, role: true, email: true } });
}

function cannotManageAdmin(target: { role: Role }) {
  return target.role === Role.ADMIN;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      clientProfile: true,
      orders: {
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
      },
      priceOverrides: { include: { product: { select: { name: true } } } },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { password: _, ...safeUser } = user;
  return NextResponse.json(safeUser);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const { id } = await params;
  const data = await req.json();

  const target = await getTargetUser(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (cannotManageAdmin(target)) {
    return NextResponse.json({ error: "Admin accounts cannot be suspended" }, { status: 400 });
  }
  if (auth.session.user.id === id && data.isActive === false) {
    return NextResponse.json({ error: "Cannot suspend your own account" }, { status: 400 });
  }

  const userUpdate: Record<string, unknown> = {};
  if (data.name !== undefined) userUpdate.name = data.name;
  if (data.email !== undefined) userUpdate.email = data.email;
  if (data.phone !== undefined) userUpdate.phone = data.phone;
  if (data.role !== undefined) userUpdate.role = data.role;
  if (data.isActive !== undefined) userUpdate.isActive = data.isActive;

  const profileUpdate: Record<string, unknown> = {};
  if (data.company !== undefined) profileUpdate.company = data.company;
  if (data.gstin !== undefined) profileUpdate.gstin = data.gstin;
  if (data.billingState !== undefined) profileUpdate.billingState = data.billingState;
  if (data.address !== undefined) profileUpdate.address = data.address;
  if (data.city !== undefined) profileUpdate.city = data.city;
  if (data.pincode !== undefined) profileUpdate.pincode = data.pincode;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...userUpdate,
      ...(Object.keys(profileUpdate).length > 0 && data.role !== Role.ADMIN
        ? {
            clientProfile: {
              upsert: {
                create: {
                  company: (profileUpdate.company as string) || "—",
                  billingState: (profileUpdate.billingState as string) || "—",
                  ...profileUpdate,
                },
                update: profileUpdate,
              },
            },
          }
        : {}),
    },
    include: { clientProfile: true },
  });

  const { password: _, ...safe } = user;
  return NextResponse.json(safe);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const { id } = await params;

  if (auth.session.user.id === id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const target = await getTargetUser(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (cannotManageAdmin(target)) {
    return NextResponse.json({ error: "Admin accounts cannot be deleted" }, { status: 400 });
  }

  try {
    await deleteUserPermanently(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("delete user failed", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
