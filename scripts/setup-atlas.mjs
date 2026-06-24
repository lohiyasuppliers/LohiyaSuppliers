/**
 * Provision MongoDB Atlas via Admin API (curl digest auth).
 */
import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

const PUBLIC_KEY = process.env.ATLAS_PUBLIC_KEY;
const PRIVATE_KEY = process.env.ATLAS_PRIVATE_KEY;
const API_VERSION = "2024-10-23";
const BASE = "https://cloud.mongodb.com/api/atlas/v2";

if (!PUBLIC_KEY || !PRIVATE_KEY) {
  console.error("Set ATLAS_PUBLIC_KEY and ATLAS_PRIVATE_KEY");
  process.exit(1);
}

async function atlas(method, urlPath, body) {
  const url = `${BASE}${urlPath}`;
  const args = [
    "-s",
    "-u",
    `${PUBLIC_KEY}:${PRIVATE_KEY}`,
    "--digest",
    "-X",
    method,
    "-H",
    `Accept: application/vnd.atlas.${API_VERSION}+json`,
    url,
  ];
  if (body) {
    args.push("-H", `Content-Type: application/vnd.atlas.${API_VERSION}+json`, "-d", JSON.stringify(body));
  }
  const { stdout } = await execFileAsync("curl.exe", args, { maxBuffer: 10 * 1024 * 1024 });
  const json = stdout ? JSON.parse(stdout) : {};
  if (json.error || json.errorCode) {
    throw new Error(`${method} ${urlPath}: ${JSON.stringify(json)}`);
  }
  return json;
}

function upsertEnvDatabaseUrl(uri) {
  const line = `DATABASE_URL="${uri}"`;
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  content = /^DATABASE_URL=/m.test(content)
    ? content.replace(/^DATABASE_URL=.*$/m, line)
    : `${line}\n${content}`;
  fs.writeFileSync(envPath, content);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const orgs = await atlas("GET", "/orgs");
  const org = orgs.results?.[0];
  if (!org) throw new Error("No organization found");

  let projects = await atlas("GET", "/groups");
  let project = projects.results?.find((p) => p.name === "Lohiya Suppliers") ?? projects.results?.[0];

  if (!project) {
    project = await atlas("POST", "/groups", { orgId: org.id, name: "Lohiya Suppliers" });
    console.log("Created project: Lohiya Suppliers");
  } else {
    console.log("Using project:", project.name);
  }

  const projectId = project.id;
  let clusters = await atlas("GET", `/groups/${projectId}/clusters`);
  let cluster = clusters.results?.find((c) => c.name === "Cluster0") ?? clusters.results?.[0];

  if (!cluster) {
    await atlas("POST", `/groups/${projectId}/clusters`, {
      name: "Cluster0",
      clusterType: "REPLICASET",
      providerSettings: {
        providerName: "TENANT",
        backingProviderName: "AWS",
        regionName: "AP_SOUTH_1",
        instanceSizeName: "M0",
      },
    });
    console.log("Creating cluster Cluster0 (free tier, Mumbai)…");
    clusters = await atlas("GET", `/groups/${projectId}/clusters`);
    cluster = clusters.results?.[0];
  }

  while (true) {
    cluster = await atlas("GET", `/groups/${projectId}/clusters/${cluster.name}`);
    console.log("Cluster state:", cluster.stateName);
    if (cluster.stateName === "IDLE") break;
    await sleep(20000);
  }

  try {
    await atlas("POST", `/groups/${projectId}/accessList`, [
      { cidrBlock: "0.0.0.0/0", comment: "Lohiya Suppliers" },
    ]);
    console.log("Network access enabled (0.0.0.0/0)");
  } catch (error) {
    if (!String(error.message).includes("DUPLICATE")) {
      console.log("Network access:", error.message);
    }
  }

  const dbUser = "lohiya_app";
  const dbPassword = crypto.randomBytes(16).toString("base64url") + "Aa1";

  try {
    await atlas("POST", `/groups/${projectId}/databaseUsers`, {
      databaseName: "admin",
      username: dbUser,
      password: dbPassword,
      roles: [{ roleName: "readWriteAnyDatabase", databaseName: "admin" }],
    });
    console.log("Created DB user:", dbUser);
  } catch (error) {
    if (String(error.message).includes("ALREADY_EXISTS")) {
      await atlas("PATCH", `/groups/${projectId}/databaseUsers/admin/${dbUser}`, {
        password: dbPassword,
      });
      console.log("Updated DB user password:", dbUser);
    } else {
      throw error;
    }
  }

  const cs = await atlas("GET", `/groups/${projectId}/clusters/${cluster.name}/connect?privateLink=false`);
  const template =
    cs.connectionStrings?.standardSrv ??
    cs.connectionStrings?.standard ??
    cs.standardSrv ??
    cluster.connectionStrings?.standardSrv;

  if (!template) throw new Error("No connection string from Atlas");

  const uri = template
    .replace("<username>", encodeURIComponent(dbUser))
    .replace("<password>", encodeURIComponent(dbPassword))
    .replace("/?", "/lohiyasuppliers?");

  upsertEnvDatabaseUrl(uri);
  console.log("\nAtlas connected. DATABASE_URL saved to .env");
  console.log("User:", dbUser);
  console.log("Password:", dbPassword);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
