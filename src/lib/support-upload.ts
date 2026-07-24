import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const MAX_BYTES = 15 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
]);

export type SupportAttachment = {
  url: string;
  name: string;
  type: string;
  size: number;
};

export async function saveSupportUpload(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) {
    return { error: NextResponse.json({ error: "No file provided" }, { status: 400 }) };
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      error: NextResponse.json(
        { error: "Only images, PDF, video, and audio files are allowed" },
        { status: 400 }
      ),
    };
  }

  if (file.size > MAX_BYTES) {
    return {
      error: NextResponse.json({ error: "File must be under 15MB" }, { status: 400 }),
    };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "support");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  const attachment: SupportAttachment = {
    url: `/uploads/support/${filename}`,
    name: file.name,
    type: file.type,
    size: file.size,
  };

  return { attachment };
}
