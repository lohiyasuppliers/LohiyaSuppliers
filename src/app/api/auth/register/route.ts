import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      phone,
      company,
      gstin,
      billingState,
      address,
      city,
      pincode,
    } = body;

    if (!name || !email || !password || !company || !billingState) {
      return NextResponse.json(
        {
          error:
            "Name, email, password, company name, and billing state are required",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashed,
        phone: phone ? String(phone).trim() : null,
        role: Role.CLIENT,
        isActive: true,
        clientProfile: {
          create: {
            company: String(company).trim(),
            gstin: gstin ? String(gstin).trim().toUpperCase() : null,
            billingState: String(billingState).trim(),
            address: address ? String(address).trim() : null,
            city: city ? String(city).trim() : null,
            pincode: pincode ? String(pincode).trim() : null,
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
