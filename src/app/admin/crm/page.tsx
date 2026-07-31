import { getCrmDashboardData } from "@/lib/crm-data";
import { CrmDashboard } from "@/components/admin/CrmDashboard";

export const metadata = { title: "CRM" };
export const revalidate = 60;

export default async function AdminCrmPage() {
  const data = await getCrmDashboardData();
  return <CrmDashboard data={data} />;
}
