/**
 * Keep local MongoDB replica set running (required by Prisma transactions).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "prisma", "mongo-replica-data");
const envPath = path.join(root, ".env");

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

async function main() {
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
  const uri = replSet.getUri("lohiyasuppliers");
  upsertEnvDatabaseUrl(uri);
  console.log(`MongoDB replica set ready: ${uri}`);
  console.log("Press Ctrl+C to stop.");

  process.on("SIGINT", async () => {
    await replSet.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
