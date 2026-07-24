import { prisma } from "@/lib/prisma";

export async function saveMediaAsset(opts: {
  buffer: Buffer;
  contentType: string;
  filename: string;
}) {
  const asset = await prisma.mediaAsset.create({
    data: {
      filename: opts.filename.slice(0, 180),
      contentType: opts.contentType,
      dataBase64: opts.buffer.toString("base64"),
      byteSize: opts.buffer.length,
    },
  });

  return {
    id: asset.id,
    url: `/api/media/${asset.id}`,
    contentType: asset.contentType,
    byteSize: asset.byteSize,
  };
}

export function isMediaApiUrl(url: string) {
  return url.startsWith("/api/media/") || url.startsWith("data:");
}
