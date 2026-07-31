import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { getCrmDashboardData } from "@/lib/crm-data";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const data = await getCrmDashboardData();
  return NextResponse.json(data);
}
