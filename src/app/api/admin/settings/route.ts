import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { upsertPlatformSetting } from "@/lib/settings";

export async function PUT(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const data = await req.json();
  for (const [key, value] of Object.entries(data)) {
    await upsertPlatformSetting(key, String(value));
  }
  return NextResponse.json({ success: true });
}
