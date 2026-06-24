/**
 * After DATABASE_URL in .env points to Atlas (mongodb+srv://...),
 * run: npm run db:finish-atlas
 */
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");

function readDatabaseUrl() {
  if (!fs.existsSync(envPath)) throw new Error(".env not found");
  const match = fs.readFileSync(envPath, "utf8").match(/^DATABASE_URL="([^"]+)"/m);
  if (!match) throw new Error("DATABASE_URL not set in .env");
  return match[1];
}

async function main() {
  const uri = readDatabaseUrl();
  if (!uri.startsWith("mongodb+srv://") && !uri.includes("mongodb.net")) {
    console.error(
      "DATABASE_URL is not an Atlas URI yet.\nRun: npm run atlas:login\nOr paste your Atlas connection string into .env first."
    );
    process.exit(1);
  }
  console.log("Using Atlas DATABASE_URL from .env");
  await execFileAsync("npx", ["prisma", "db", "push", "--accept-data-loss"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  await execFileAsync("npm", ["run", "db:seed"], { cwd: root, stdio: "inherit", shell: true });
  console.log("\nAtlas database ready. Run: npm run dev");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
