import "server-only";
import { get, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ScoopData } from "./types";

// Where the latest pull lives, already aggregated into exactly what the page shows (no raw signup rows).
// On Vercel: a private Vercel Blob. A store connected with OIDC sets BLOB_STORE_ID and the SDK signs in
// with the deployment's short-lived OIDC token; an older one sets BLOB_READ_WRITE_TOKEN instead. Locally,
// with no store connected: data/scoop.json (gitignored).
const BLOB_PATH = "scoop-data.json";
const LOCAL_FILE = path.join(process.cwd(), "data", "scoop.json");
const onVercelBlob = () => !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);

export async function saveScoopData(data: ScoopData) {
  const body = JSON.stringify(data);
  if (onVercelBlob()) {
    await put(BLOB_PATH, body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }
  await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await writeFile(LOCAL_FILE, body, { mode: 0o600 });
}

export async function readScoopData(): Promise<ScoopData | null> {
  if (onVercelBlob()) {
    const res = await get(BLOB_PATH, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return (await new Response(res.stream).json()) as ScoopData;
  }
  try {
    return JSON.parse(await readFile(LOCAL_FILE, "utf8")) as ScoopData;
  } catch {
    return null;
  }
}
