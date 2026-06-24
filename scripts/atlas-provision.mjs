/**
 * After `atlas auth login` (UserAccount in your terminal), run:
 *   npm run db:atlas
 *
 * Creates cluster, DB user, network access, updates .env, push + seed.
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

const atlasCmd = process.platform === "win32" ? "atlas.exe" : "atlas";

async function atlas(args) {
  const { stdout } = await execFileAsync(atlasCmd, args, {
    maxBuffer: 10 * 1024 * 1024,
    env: process.env,
  });
  return stdout.trim() ? JSON.parse(stdout) : {};
}

async function atlasRaw(args) {
  const { stdout } = await execFileAsync(atlasCmd, args, {
    maxBuffer: 10 * 1024 * 1024,
    env: process.env,
  });
  return stdout.trim();
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

function buildAtlasUri(template, username, password) {
  const user = encodeURIComponent(username);
  const pass = encodeURIComponent(password);
  const dbName = "lohiyasuppliers";

  let hostPath = template
    .replace(/^mongodb\+srv:\/\//, "")
    .replace(/^<username>:<password>@/, "")
    .replace(/^[^@]+@/, "");

  const slashIdx = hostPath.indexOf("/");
  const queryIdx = hostPath.indexOf("?");
  let host = hostPath;
  let query = "";

  if (slashIdx >= 0) {
    host = hostPath.slice(0, slashIdx);
    query = hostPath.slice(slashIdx + 1);
  } else if (queryIdx >= 0) {
    host = hostPath.slice(0, queryIdx);
    query = hostPath.slice(queryIdx + 1);
  }

  host = host.replace(/\/$/, "");
  if (query.startsWith("?")) query = query.slice(1);
  if (!query) query = "retryWrites=true&w=majority";

  return `mongodb+srv://${user}:${pass}@${host}/${dbName}?${query}`;
}

async function main() {
  const whoami = await atlasRaw(["auth", "whoami"]).catch(() => "");
  if (whoami.includes("session expired") || whoami.includes("not logged in")) {
    console.error(
      "Atlas session expired. Run: npm run atlas:login\nChoose UserAccount, authorize in browser, then provisioning runs automatically."
    );
    process.exit(1);
  }
  console.log(whoami);

  let projects;
  try {
    projects = await atlas(["projects", "list", "-o", "json"]);
  } catch {
    console.error(
      "Atlas API access failed (login may be incomplete). Run: npm run atlas:login\nChoose UserAccount and finish browser authorization in the CMD window."
    );
    process.exit(1);
  }

  let project = projects.results?.find((p) => p.name === "Lohiya Suppliers") ?? projects.results?.[0];

  if (!project) {
    project = await atlas([
      "projects",
      "create",
      "Lohiya Suppliers",
      "--orgId",
      (await atlas(["orgs", "list", "-o", "json"])).results[0].id,
      "-o",
      "json",
    ]);
    console.log("Created project: Lohiya Suppliers");
  } else {
    console.log("Using project:", project.name);
  }

  const projectId = project.id;
  let clusters = await atlas(["clusters", "list", "--projectId", projectId, "-o", "json"]);
  let cluster = clusters.results?.find((c) => c.name === "Cluster0") ?? clusters.results?.[0];

  if (!cluster) {
    await atlasRaw([
      "clusters",
      "create",
      "Cluster0",
      "--projectId",
      projectId,
      "--provider",
      "AWS",
      "--region",
      "AP_SOUTH_1",
      "--tier",
      "M0",
    ]);
    console.log("Creating Cluster0 (free, Mumbai)…");
    clusters = await atlas(["clusters", "list", "--projectId", projectId, "-o", "json"]);
    cluster = clusters.results[0];
  }

  while (true) {
    cluster = await atlas([
      "clusters",
      "describe",
      cluster.name,
      "--projectId",
      projectId,
      "-o",
      "json",
    ]);
    console.log("Cluster state:", cluster.stateName);
    if (cluster.stateName === "IDLE") break;
    await sleep(20000);
  }

  try {
    await atlasRaw([
      "accessLists",
      "create",
      "0.0.0.0/0",
      "--type",
      "cidrBlock",
      "--projectId",
      projectId,
      "--comment",
      "Lohiya Suppliers",
    ]);
    console.log("Network access: 0.0.0.0/0");
  } catch (error) {
    const msg = String(error);
    if (msg.includes("DUPLICATE") || msg.includes("already exists")) {
      console.log("Network access: 0.0.0.0/0 (already set)");
    } else {
      try {
        await atlasRaw(["accessLists", "create", "--currentIp", "--projectId", projectId]);
        console.log("Network access: current IP added");
      } catch (ipError) {
        console.log("Network:", String(ipError).split("\n")[0]);
      }
    }
  }

  const dbUser = "lohiya_app";
  const dbPassword = crypto.randomBytes(16).toString("base64url") + "Aa1";

  try {
    await atlasRaw([
      "dbusers",
      "create",
      "readWriteAnyDatabase",
      "--username",
      dbUser,
      "--password",
      dbPassword,
      "--projectId",
      projectId,
    ]);
    console.log("Created DB user:", dbUser);
  } catch (error) {
    if (String(error).includes("already exists") || String(error).includes("DUPLICATE")) {
      await atlasRaw([
        "dbusers",
        "update",
        dbUser,
        "--password",
        dbPassword,
        "--projectId",
        projectId,
      ]);
      console.log("Updated DB user password:", dbUser);
    } else {
      throw error;
    }
  }

  const cs = await atlas([
    "clusters",
    "connectionStrings",
    "describe",
    cluster.name,
    "--projectId",
      projectId,
    "-o",
    "json",
  ]);

  const template = cs.standardSrv ?? cs.connectionStrings?.standardSrv;
  if (!template) throw new Error("No connection string from Atlas");

  const uri = buildAtlasUri(template, dbUser, dbPassword);

  upsertEnvDatabaseUrl(uri);
  console.log("\nDATABASE_URL saved to .env");
  console.log("User:", dbUser);
  console.log("Password:", dbPassword);

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
