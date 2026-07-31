import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export type CrmClientRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  company: string;
  gstin: string | null;
  billingState: string;
  city: string | null;
  address: string | null;
  pincode: string | null;
  orderCount: number;
  totalSpentPaise: number;
  lastOrderAt: string | null;
  clientType: "online" | "offline";
  allowGstChoice: boolean;
  cashbackBalancePaise: number;
};

export type CrmDashboardData = {
  stats: {
    totalClients: number;
    activeClients: number;
    onlineClients: number;
    offlineClients: number;
    totalRevenuePaise: number;
    totalProducts: number;
    activeProducts: number;
    totalCategories: number;
    totalBrands: number;
  };
  clients: CrmClientRow[];
  stateBreakdown: { state: string; count: number }[];
  cityBreakdown: { city: string; state: string; count: number }[];
  categoryBreakdown: { name: string; slug: string; productCount: number; application: string }[];
  brandBreakdown: { brand: string; productCount: number }[];
};

export async function getCrmDashboardData(): Promise<CrmDashboardData> {
  const [clientsRaw, productStats, categoryRows, brandRows] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.CLIENT },
      include: {
        clientProfile: true,
        orders: {
          select: { totalPaise: true, paymentStatus: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.groupBy({
      by: ["isActive"],
      _count: true,
    }),
    prisma.category.findMany({
      where: { isActive: true, parentId: { not: null } },
      select: {
        name: true,
        slug: true,
        application: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.product.groupBy({
      by: ["brand"],
      where: { isActive: true, brand: { not: null } },
      _count: true,
      orderBy: { brand: "asc" },
    }),
  ]);

  const clients: CrmClientRow[] = clientsRaw.map((u) => {
    const paid = u.orders.filter((o) => o.paymentStatus === "PAID");
    const totalSpentPaise = paid.reduce((s, o) => s + o.totalPaise, 0);
    const lastOrder = u.orders[0]?.createdAt;
    return {
      id: u.id,
      name: u.name || "",
      email: u.email,
      phone: u.phone,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      company: u.clientProfile?.company || "—",
      gstin: u.clientProfile?.gstin ?? null,
      billingState: u.clientProfile?.billingState || "—",
      city: u.clientProfile?.city ?? null,
      address: u.clientProfile?.address ?? null,
      pincode: u.clientProfile?.pincode ?? null,
      orderCount: u.orders.length,
      totalSpentPaise,
      lastOrderAt: lastOrder ? lastOrder.toISOString() : null,
      clientType: u.orders.length > 0 ? "online" : "offline",
      allowGstChoice: u.clientProfile?.allowGstChoice ?? false,
      cashbackBalancePaise: u.clientProfile?.cashbackBalancePaise ?? 0,
    };
  });

  const stateMap = new Map<string, number>();
  const cityMap = new Map<string, { city: string; state: string; count: number }>();

  for (const c of clients) {
    const state = c.billingState || "Unknown";
    stateMap.set(state, (stateMap.get(state) || 0) + 1);
    const cityKey = `${c.city || "Unknown"}|${state}`;
    const existing = cityMap.get(cityKey);
    if (existing) existing.count += 1;
    else cityMap.set(cityKey, { city: c.city || "Unknown", state, count: 1 });
  }

  const activeProducts =
    productStats.find((p) => p.isActive)?._count ?? 0;
  const inactiveProducts =
    productStats.find((p) => !p.isActive)?._count ?? 0;

  return {
    stats: {
      totalClients: clients.length,
      activeClients: clients.filter((c) => c.isActive).length,
      onlineClients: clients.filter((c) => c.clientType === "online").length,
      offlineClients: clients.filter((c) => c.clientType === "offline").length,
      totalRevenuePaise: clients.reduce((s, c) => s + c.totalSpentPaise, 0),
      totalProducts: activeProducts + inactiveProducts,
      activeProducts,
      totalCategories: categoryRows.length,
      totalBrands: brandRows.filter((b) => b.brand).length,
    },
    clients,
    stateBreakdown: [...stateMap.entries()]
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count),
    cityBreakdown: [...cityMap.values()].sort((a, b) => b.count - a.count),
    categoryBreakdown: categoryRows.map((c) => ({
      name: c.name,
      slug: c.slug,
      productCount: c._count.products,
      application: c.application,
    })),
    brandBreakdown: brandRows
      .filter((b) => b.brand)
      .map((b) => ({ brand: b.brand!, productCount: b._count })),
  };
}
