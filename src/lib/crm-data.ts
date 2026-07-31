import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { buildClientLocation, stateCoords } from "@/lib/crm-locations";

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
  country: string;
  fullAddress: string;
  mapUrl: string;
  hasLocation: boolean;
  orderCount: number;
  totalSpentPaise: number;
  lastOrderAt: string | null;
  clientType: "online" | "offline";
  allowGstChoice: boolean;
  cashbackBalancePaise: number;
};

export type CrmProductRow = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: string;
  department: string;
  application: string;
  hsnCode: string;
  defaultPricePaise: number;
  isActive: boolean;
  variationCount: number;
};

export type CrmDepartmentRow = {
  id: string;
  name: string;
  slug: string;
  application: string;
  subcategoryCount: number;
  productCount: number;
  isActive: boolean;
};

export type CrmCategoryRow = {
  id: string;
  name: string;
  slug: string;
  department: string;
  application: string;
  type: string;
  productCount: number;
  isActive: boolean;
};

export type CrmLocationPin = {
  id: string;
  name: string;
  company: string;
  phone: string | null;
  city: string;
  state: string;
  pincode: string | null;
  fullAddress: string;
  mapUrl: string;
  lat: number;
  lng: number;
  clientType: "online" | "offline";
  orderCount: number;
};

export type CrmDashboardData = {
  stats: {
    totalClients: number;
    activeClients: number;
    onlineClients: number;
    offlineClients: number;
    clientsWithLocation: number;
    totalRevenuePaise: number;
    totalOrders: number;
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    totalDepartments: number;
    totalCategories: number;
    totalBrands: number;
    totalVariations: number;
    openSupportThreads: number;
  };
  clients: CrmClientRow[];
  locations: CrmLocationPin[];
  products: CrmProductRow[];
  departments: CrmDepartmentRow[];
  categories: CrmCategoryRow[];
  stateBreakdown: { state: string; count: number; revenuePaise: number }[];
  cityBreakdown: { city: string; state: string; count: number }[];
  brandBreakdown: { brand: string; productCount: number }[];
  recentClients: { id: string; name: string; company: string; joinedAt: string }[];
};

export async function getCrmDashboardData(): Promise<CrmDashboardData> {
  const [
    clientsRaw,
    productStats,
    allProducts,
    departmentRows,
    categoryRows,
    brandRows,
    variationCount,
    orderCount,
    openSupport,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.CLIENT },
      include: {
        clientProfile: true,
        orders: {
          select: { totalPaise: true, paymentStatus: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.groupBy({ by: ["isActive"], _count: true }),
    prisma.product.findMany({
      include: {
        category: {
          select: {
            name: true,
            slug: true,
            application: true,
            parent: { select: { name: true } },
          },
        },
        _count: { select: { variations: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      include: {
        _count: {
          select: {
            children: true,
            products: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.category.findMany({
      where: { parentId: { not: null } },
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.product.groupBy({
      by: ["brand"],
      where: { brand: { not: null } },
      _count: true,
      orderBy: { brand: "asc" },
    }),
    prisma.productVariation.count(),
    prisma.order.count({ where: { client: { role: Role.CLIENT } } }),
    prisma.supportThread.count(),
  ]);

  const clients: CrmClientRow[] = clientsRaw.map((u) => {
    const paid = u.orders.filter((o) => o.paymentStatus === "PAID");
    const totalSpentPaise = paid.reduce((s, o) => s + o.totalPaise, 0);
    const lastOrder = u.orders[0]?.createdAt;
    const loc = buildClientLocation({
      address: u.clientProfile?.address,
      city: u.clientProfile?.city,
      billingState: u.clientProfile?.billingState,
      pincode: u.clientProfile?.pincode,
      country: u.clientProfile?.country,
    });

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
      country: u.clientProfile?.country ?? "India",
      fullAddress: loc.fullAddress,
      mapUrl: loc.mapUrl,
      hasLocation: loc.hasLocation,
      orderCount: u.orders.length,
      totalSpentPaise,
      lastOrderAt: lastOrder ? lastOrder.toISOString() : null,
      clientType: u.orders.length > 0 ? "online" : "offline",
      allowGstChoice: u.clientProfile?.allowGstChoice ?? false,
      cashbackBalancePaise: u.clientProfile?.cashbackBalancePaise ?? 0,
    };
  });

  const locations: CrmLocationPin[] = clients
    .filter((c) => c.hasLocation || c.billingState !== "—")
    .map((c, i) => {
      const coords = stateCoords(c.billingState);
      const jitter = ((i % 20) - 10) / 200;
      return {
        id: c.id,
        name: c.name || c.email,
        company: c.company,
        phone: c.phone,
        city: c.city || "—",
        state: c.billingState,
        pincode: c.pincode,
        fullAddress: c.fullAddress || [c.city, c.billingState].filter(Boolean).join(", "),
        mapUrl: c.mapUrl,
        lat: coords.lat + jitter,
        lng: coords.lng + jitter * 1.5,
        clientType: c.clientType,
        orderCount: c.orderCount,
      };
    });
  const stateMap = new Map<string, { count: number; revenuePaise: number }>();
  const cityMap = new Map<string, { city: string; state: string; count: number }>();

  for (const c of clients) {
    const state = c.billingState || "Unknown";
    const prev = stateMap.get(state) || { count: 0, revenuePaise: 0 };
    stateMap.set(state, {
      count: prev.count + 1,
      revenuePaise: prev.revenuePaise + c.totalSpentPaise,
    });
    const cityKey = `${c.city || "Unknown"}|${state}`;
    const existing = cityMap.get(cityKey);
    if (existing) existing.count += 1;
    else cityMap.set(cityKey, { city: c.city || "Unknown", state, count: 1 });
  }

  const activeProducts = productStats.find((p) => p.isActive)?._count ?? 0;
  const inactiveProducts = productStats.find((p) => !p.isActive)?._count ?? 0;

  const products: CrmProductRow[] = allProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: p.category.name,
    department: p.category.parent?.name || p.category.name,
    application: p.category.application,
    hsnCode: p.hsnCode,
    defaultPricePaise: p.defaultPricePaise,
    isActive: p.isActive,
    variationCount: p._count.variations,
  }));

  const departments: CrmDepartmentRow[] = departmentRows.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    application: d.application,
    subcategoryCount: d._count.children,
    productCount: d._count.products,
    isActive: d.isActive,
  }));

  const categories: CrmCategoryRow[] = categoryRows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    department: c.parent?.name || "—",
    application: c.application,
    type: c.type,
    productCount: c._count.products,
    isActive: c.isActive,
  }));

  return {
    stats: {
      totalClients: clients.length,
      activeClients: clients.filter((c) => c.isActive).length,
      onlineClients: clients.filter((c) => c.clientType === "online").length,
      offlineClients: clients.filter((c) => c.clientType === "offline").length,
      clientsWithLocation: clients.filter((c) => c.hasLocation).length,
      totalRevenuePaise: clients.reduce((s, c) => s + c.totalSpentPaise, 0),
      totalOrders: orderCount,
      totalProducts: activeProducts + inactiveProducts,
      activeProducts,
      inactiveProducts,
      totalDepartments: departments.length,
      totalCategories: categories.length,
      totalBrands: brandRows.filter((b) => b.brand).length,
      totalVariations: variationCount,
      openSupportThreads: openSupport,
    },
    clients,
    locations,
    products,
    departments,
    categories,
    stateBreakdown: [...stateMap.entries()]
      .map(([state, v]) => ({ state, count: v.count, revenuePaise: v.revenuePaise }))
      .sort((a, b) => b.count - a.count),
    cityBreakdown: [...cityMap.values()].sort((a, b) => b.count - a.count),
    brandBreakdown: brandRows
      .filter((b) => b.brand)
      .map((b) => ({ brand: b.brand!, productCount: b._count })),
    recentClients: clients.slice(0, 8).map((c) => ({
      id: c.id,
      name: c.name || c.email,
      company: c.company,
      joinedAt: c.createdAt,
    })),
  };
}
