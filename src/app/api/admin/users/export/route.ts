import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";
import { formatPaise, formatDate } from "@/lib/utils";
import { Role } from "@prisma/client";
import { clientCode } from "@/lib/export-format";
import { buildClientLocation } from "@/lib/crm-locations";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const userId = new URL(req.url).searchParams.get("userId");

  const users = await prisma.user.findMany({
    where: { role: Role.CLIENT, ...(userId ? { id: userId } : {}) },
    include: {
      clientProfile: true,
      _count: { select: { orders: true } },
      orders: {
        where: { paymentStatus: "PAID" },
        select: { totalPaise: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Client Code",
    "Contact Person",
    "Email",
    "Phone",
    "Company",
    "GSTIN",
    "Billing State",
    "City",
    "Address",
    "Pincode",
    "Country",
    "Full Address",
    "Status",
    "Total Orders",
    "Total Spent (INR)",
    "Joined Date",
  ];

  const rows = users.map((u, idx) => {
    const totalSpent = u.orders.reduce((s, o) => s + o.totalPaise, 0);
    const loc = buildClientLocation({
      address: u.clientProfile?.address,
      city: u.clientProfile?.city,
      billingState: u.clientProfile?.billingState,
      pincode: u.clientProfile?.pincode,
      country: u.clientProfile?.country,
    });
    return [
      clientCode(u.email, idx),
      u.name || "",
      u.email,
      u.phone || "",
      u.clientProfile?.company || "",
      u.clientProfile?.gstin || "",
      u.clientProfile?.billingState || "",
      u.clientProfile?.city || "",
      u.clientProfile?.address || "",
      u.clientProfile?.pincode || "",
      u.clientProfile?.country || "India",
      loc.fullAddress,
      u.isActive ? "Active" : "Suspended",
      u._count.orders,
      formatPaise(totalSpent).replace("₹", ""),
      formatDate(u.createdAt),
    ];
  });

  return csvDownloadResponse(
    buildCsv(headers, rows),
    `lohiya-clients-${new Date().toISOString().slice(0, 10)}.csv`
  );
}
