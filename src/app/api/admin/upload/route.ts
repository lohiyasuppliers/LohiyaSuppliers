import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { saveMediaAsset } from "@/lib/media-upload";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const SUPPORT_TYPES = new Set(["video/mp4", "application/pdf"]);

function isAllowedType(type: string) {
  return IMAGE_TYPES.has(type) || SUPPORT_TYPES.has(type) || type.startsWith("audio/");
}

function maxBytesForType(type: string) {
  if (IMAGE_TYPES.has(type)) return 5 * 1024 * 1024;
  if (type === "video/mp4") return 12 * 1024 * 1024; // MongoDB doc ~16MB with base64
  if (type.startsWith("audio/")) return 8 * 1024 * 1024;
  return 8 * 1024 * 1024; // pdf / other
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
      {
        error: `File must be under ${maxMb}MB (received ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
      },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveMediaAsset({
      buffer,
      contentType: file.type,
      filename: file.name || `upload-${Date.now()}`,
    });
    return NextResponse.json({
      url: saved.url,
      contentType: saved.contentType,
      id: saved.id,
    });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save upload" },
      { status: 500 }
    );
  }
}
