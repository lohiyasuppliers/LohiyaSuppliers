#!/usr/bin/env node
/**
 * Clean restart for local dev on Windows:
 * - stops process on port 3000 (if any)
 * - removes .next cache
 * - regenerates Prisma client
 * - starts next dev on port 3000
 */
import { execSync, spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const PORT = 3000;

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root, ...opts });
}

function killPort(port) {
  if (process.platform !== "win32") return;
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
    const pids = new Set(
      out
        .split(/\r?\n/)
        .map((line) => line.trim().split(/\s+/).pop())
        .filter((pid) => pid && /^\d+$/.test(pid))
    );
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        console.log(`Stopped process ${pid} on port ${port}`);
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* nothing listening */
  }
}

try {
  killPort(PORT);

  const nextDir = join(root, ".next");
  if (existsSync(nextDir)) {
    console.log("Removing .next …");
    rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  }

  run("npx prisma generate");
  console.log(`\nStarting dev server at http://localhost:${PORT}\n`);

  const child = spawn("npx", ["next", "dev", "--turbopack", "-p", String(PORT)], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    detached: process.platform === "win32",
  });

  if (process.platform === "win32") {
    child.unref();
  }

  child.on("exit", (code) => process.exit(code ?? 0));
} catch (err) {
  console.error(err);
  process.exit(1);
}
