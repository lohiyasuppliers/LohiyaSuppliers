/**
 * Ensures local MongoDB (replica set) is running before dev/db commands.
 * Skipped when .env already uses MongoDB Atlas (mongodb+srv://).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "prisma", "mongo-data");
const envPath = path.join(root, ".env");
const pidFile = path.join(dataDir, "mongod.pid");

const MONGOD =
  process.env.MONGOD_PATH ??
  "C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe";
const PORT = 27018;
const REPL_SET = "rs0";
const DB_URI = `mongodb://127.0.0.1:${PORT}/lohiyasuppliers?replicaSet=${REPL_SET}`;

function readDatabaseUrl() {
  if (!fs.existsSync(envPath)) return "";
  const match = fs.readFileSync(envPath, "utf8").match(/^DATABASE_URL="([^"]+)"/m);
  return match?.[1] ?? "";
}

function usesAtlas(uri) {
  return uri.startsWith("mongodb+srv://") || uri.includes("mongodb.net");
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: "127.0.0.1" }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

function upsertEnvDatabaseUrl() {
  const line = `DATABASE_URL="${DB_URI}"`;
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  if (/^DATABASE_URL=/m.test(content)) {
    content = content.replace(/^DATABASE_URL=.*$/m, line);
  } else {
    content = `${line}\n${content}`;
  }
  fs.writeFileSync(envPath, content);
}

async function runMongoshEval(script) {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);
  const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const { stdout } = await execFileAsync(
    cmd,
    ["--yes", "mongosh", DB_URI, "--quiet", "--eval", script],
    { cwd: root, env: process.env, windowsHide: true, timeout: 60000 }
  );
  return stdout.trim();
}

async function waitForReplicaSet(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (!(await portOpen(PORT))) {
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }
    try {
      const ping = await runMongoshEval("db.adminCommand({ ping: 1 }).ok");
      if (ping === "1") return true;
    } catch {
      try {
        await runMongoshEval(
          `try { rs.status() } catch(e) { rs.initiate({_id:'${REPL_SET}',members:[{_id:0,host:'127.0.0.1:${PORT}'}]}) }`
        );
      } catch {
        /* retry */
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return portOpen(PORT);
}

function startMongod() {
  if (!fs.existsSync(MONGOD)) {
    console.error(
      `MongoDB not found at ${MONGOD}. Install with: winget install MongoDB.Server`
    );
    process.exit(1);
  }

  fs.mkdirSync(dataDir, { recursive: true });

  const logPath = path.join(dataDir, "mongod.log");
  const args = [
    "--replSet",
    REPL_SET,
    "--port",
    String(PORT),
    "--dbpath",
    dataDir,
    "--bind_ip",
    "127.0.0.1",
    "--logpath",
    logPath,
    "--logappend",
  ];

  const child = spawn(MONGOD, args, {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
  fs.writeFileSync(pidFile, String(child.pid));
}

async function main() {
  const existing = readDatabaseUrl();
  if (usesAtlas(existing)) {
    console.log("Using MongoDB Atlas from .env");
    return;
  }

  upsertEnvDatabaseUrl();

  if (!(await portOpen(PORT))) {
    console.log("Starting local MongoDB…");
    startMongod();
  }

  const ready = await waitForReplicaSet();
  if (!ready) {
    console.error("MongoDB did not become ready in time.");
    process.exit(1);
  }

  console.log(`MongoDB ready at ${DB_URI}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
