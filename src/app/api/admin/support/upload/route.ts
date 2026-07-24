import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { saveSupportUpload } from "@/lib/support-upload";

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const formData = await req.formData();
  const result = await saveSupportUpload(formData);
  if ("error" in result && result.error) return result.error;
  return NextResponse.json(result.attachment);
}
