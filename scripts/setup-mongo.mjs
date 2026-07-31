/**
 * Start MongoDB replica set, push Prisma schema, and seed data.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "prisma", "mongo-replica-data");
const envPath = path.join(root, ".env");

function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: "inherit",
      shell: false,
      env: { ...process.env, ...env },
    });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))
    );
  });
}

function upsertEnvDatabaseUrl(uri) {
  const line = `DATABASE_URL="${uri}"`;
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  if (/^DATABASE_URL=/m.test(content)) {
    content = content.replace(/^DATABASE_URL=.*$/m, line);
  } else {
    content = `${line}\n${content}`;
  }
  fs.writeFileSync(envPath, content);
}

async function startMongo() {
  process.env.MONGOMS_STARTUP_TIMEOUT = "300000";
  process.env.MONGOMS_DOWNLOAD_TIMEOUT = "600000";

  const { MongoMemoryReplSet } = await import("mongodb-memory-server");
  fs.mkdirSync(dataDir, { recursive: true });

  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
    instanceOpts: [{ dbPath: dataDir, dbName: "lohiyasuppliers" }],
    spawn: { timeout: 300000 },
  });

  await replSet.waitUntilRunning();
  return { replSet, uri: replSet.getUri("lohiyasuppliers") };
}

async function main() {
  const { replSet, uri } = await startMongo();
  upsertEnvDatabaseUrl(uri);

  try {
    await run("npx", ["prisma", "generate"], { DATABASE_URL: uri });
    await run("npx", ["prisma", "db", "push", "--accept-data-loss"], {
      DATABASE_URL: uri,
    });
    await run("npx", ["tsx", "prisma/seed.ts"], { DATABASE_URL: uri });
    console.log("\nMongoDB setup complete.");
  } finally {
    await replSet.stop();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
