import { NextResponse } from "next/server";
import { saveMediaAsset } from "@/lib/media-upload";

const MAX_BYTES = 8 * 1024 * 1024; // base64 fits under MongoDB 16MB doc limit

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
      error: NextResponse.json(
        { error: "File must be under 8MB so it can be stored securely" },
        { status: 400 }
      ),
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveMediaAsset({
      buffer,
      contentType: file.type,
      filename: file.name || `support-${Date.now()}`,
    });

    const attachment: SupportAttachment = {
      url: saved.url,
      name: file.name,
      type: file.type,
      size: file.size,
    };

    return { attachment };
  } catch (err) {
    console.error("Support upload failed:", err);
    return {
      error: NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to save upload" },
        { status: 500 }
      ),
    };
  }
}
