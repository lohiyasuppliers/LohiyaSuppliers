import path from "path";
import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import { existsSync } from "fs";

const BILL_ROOT = path.join(process.cwd(), "storage", "bills");

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isExternalBillUrl(fileUrl: string) {
  return fileUrl.startsWith("http://") || fileUrl.startsWith("https://");
}

export function isPublicBillPath(fileUrl: string) {
  return fileUrl.startsWith("/uploads/");
}

export function billStoragePath(relativePath: string) {
  const normalized = relativePath.replace(/^\/+/, "").replace(/\.\./g, "");
  return path.join(BILL_ROOT, normalized);
}

export async function saveBillFile(clientId: string, file: File) {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error("Only PDF, JPEG, PNG, and WebP files are allowed");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("File must be under 15MB");
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const relativePath = `${clientId}/${filename}`;
  const fullPath = billStoragePath(relativePath);

  await mkdir(path.dirname(fullPath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  return { relativePath, originalName: file.name };
}

export async function readBillFile(fileUrl: string) {
  if (isExternalBillUrl(fileUrl)) {
    throw new Error("External URL");
  }

  if (isPublicBillPath(fileUrl)) {
    const full = path.join(process.cwd(), "public", fileUrl);
    return readFile(full);
  }

  const full = billStoragePath(fileUrl);
  if (!existsSync(full)) {
    throw new Error("File not found");
  }
  return readFile(full);
}

export async function deleteBillFile(fileUrl: string | null | undefined) {
  if (!fileUrl || isExternalBillUrl(fileUrl)) return;

  try {
    if (isPublicBillPath(fileUrl)) {
      const full = path.join(process.cwd(), "public", fileUrl);
      if (existsSync(full)) await unlink(full);
      return;
    }
    const full = billStoragePath(fileUrl);
    if (existsSync(full)) await unlink(full);
  } catch {
    /* ignore missing files */
  }
}

export function contentTypeForBillFile(fileUrl: string) {
  const ext = path.extname(fileUrl).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}
