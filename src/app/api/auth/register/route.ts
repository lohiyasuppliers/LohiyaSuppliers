import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  normalizeIndianPhone,
  validateContactNumber,
  validateContactPersonName,
} from "@/lib/contact-fields";
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

    const nameError = validateContactPersonName(String(name || ""));
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    const phoneError = validateContactNumber(String(phone || ""));
    if (phoneError) {
      return NextResponse.json({ error: phoneError }, { status: 400 });
    }

    if (!email || !password || !company || !billingState) {
      return NextResponse.json(
        {
          error:
            "Email, password, company name, billing state, contact person name, and contact number are required",
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
    const normalizedPhone = normalizeIndianPhone(String(phone))!;
    await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashed,
        phone: normalizedPhone,
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
