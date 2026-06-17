import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json({ error: "Subscribers are not available" }, { status: 410 });
}
