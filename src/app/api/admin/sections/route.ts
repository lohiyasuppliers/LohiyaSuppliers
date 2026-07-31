import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";

const DEFAULT_SECTIONS = [
  {
    key: "faq",
    title: "Frequently Asked Questions",
    subtitle: "Common questions about ordering, pricing, and delivery",
    content: JSON.stringify([
      {
        question: "How do I get personalized pricing?",
        answer:
          "Register as a B2B client. Your account manager will set per-product or per-variant rates visible when you log in.",
      },
      {
        question: "Do you supply across India?",
        answer:
          "Yes. We ship industrial abrasives and tools nationwide with reliable logistics partners.",
      },
    ]),
    sortOrder: 1,
  },
  {
    key: "testimonials",
    title: "What Our Clients Say",
    subtitle: "Trusted by workshops and manufacturers",
    content: JSON.stringify([
      {
        author: "Rajesh Kumar",
        company: "Kumar Woodworks Pvt Ltd",
        text: "Consistent quality and reliable B2B pricing on abrasives for our production line.",
      },
    ]),
    sortOrder: 2,
  },
  {
    key: "why_choose",
    title: "Why Choose Lohiya Suppliers",
    subtitle: "Your authorized B2B partner for industrial abrasives",
    content: JSON.stringify([
      { title: "Authorized Brands", text: "Deerfros, Leitz & AIPL genuine products." },
      { title: "Per-Client Pricing", text: "Custom rates for registered B2B accounts." },
      { title: "GST Invoicing", text: "Proper tax documentation for every order." },
    ]),
    sortOrder: 3,
  },
];

async function ensureDefaultSections() {
  const count = await prisma.pageSection.count();
  if (count > 0) return;
  for (const section of DEFAULT_SECTIONS) {
    await prisma.pageSection.create({ data: section });
  }
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  await ensureDefaultSections();
  const sections = await prisma.pageSection.findMany({
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });
  return NextResponse.json(sections);
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const key = String(body.key || "").trim().toLowerCase().replace(/\s+/g, "_");
  if (!key) {
    return NextResponse.json({ error: "Section key is required" }, { status: 400 });
  }

  const section = await prisma.pageSection.create({
    data: {
      key,
      title: body.title || key,
      subtitle: body.subtitle || null,
      content: body.content || "[]",
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json(section);
}
