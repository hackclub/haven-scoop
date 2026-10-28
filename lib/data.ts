import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { loadSnapshot } from "./airtable";
import { aggregate } from "./aggregate";
import { PULL_EVERY_MS } from "./config";
import { readScoopData } from "./storage";
import type { ScoopData } from "./types";

export const SCOOP_TAG = "scoop";

/**
 * What the page renders from: the latest pull saved by /api/pull, cached across requests and
 * instances. /api/pull clears the cache after each pull, so reading it never touches Airtable.
 * Before the first pull (or locally with no data/scoop.json) it falls back to data/snapshot.json.
 */
export async function getScoopData(): Promise<ScoopData> {
  "use cache: remote";
  cacheLife({ stale: 300, revalidate: PULL_EVERY_MS / 1000, expire: 30 * 86_400 });
  cacheTag(SCOOP_TAG);
  return (await readScoopData()) ?? aggregate(await loadSnapshot());
}
