import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAdminApi } from "@/lib/admin-api";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const SUPPORT_TYPES = new Set(["video/mp4", "application/pdf"]);

function isAllowedType(type: string) {
  return IMAGE_TYPES.has(type) || SUPPORT_TYPES.has(type) || type.startsWith("audio/");
}

function folderForType(type: string) {
  if (IMAGE_TYPES.has(type)) return "products";
  return "support";
}

function maxBytesForType(type: string) {
  if (IMAGE_TYPES.has(type)) return 5 * 1024 * 1024;
  if (type === "video/mp4") return 50 * 1024 * 1024;
  if (type.startsWith("audio/")) return 20 * 1024 * 1024;
  return 15 * 1024 * 1024; // pdf / other support
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type || !isAllowedType(file.type)) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Allowed: JPEG, PNG, WebP, GIF, MP4, PDF, or audio files.",
      },
      { status: 400 }
    );
  }

  const maxBytes = maxBytesForType(file.type);
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return NextResponse.json(
      { error: `File must be under ${maxMb}MB (received ${(file.size / (1024 * 1024)).toFixed(1)}MB)` },
      { status: 400 }
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const folder = folderForType(file.type);
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${folder}/${filename}`;
    return NextResponse.json({ url, contentType: file.type });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save upload" },
      { status: 500 }
    );
  }
}
