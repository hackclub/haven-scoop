// Runs before `next build` (package.json). On a fresh deploy there's no saved pull yet, so this does
// the first one and the site has data immediately; after that the saved copy is usually less than
// an hour old and this does nothing (the cron keeps it fresh). A failed pull never blocks a deploy.
import { describeError, loadFromAirtable } from "../lib/airtable";
import { aggregate } from "../lib/aggregate";
import { PULL_EVERY_MS } from "../lib/config";
import { readScoopData, saveScoopData } from "../lib/storage";

async function main() {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return console.log("[scoop] no AIRTABLE_TOKEN, skipping the pull");

  const saved = await readScoopData();
  // a copy saved before venues were pulled is redone, or every haven would show the no-venue goal
  const current = saved?.havens.every((h) => typeof h.venue === "boolean");
  if (saved && current && Date.now() - saved.generatedAt < PULL_EVERY_MS) {
    return console.log(`[scoop] saved pull is ${Math.round((Date.now() - saved.generatedAt) / 60_000)}m old, skipping`);
  }
  const t0 = Date.now();
  const data = aggregate(await loadFromAirtable(token));
  await saveScoopData(data);
  console.log(`[scoop] pulled ${data.havens.length} havens in ${Math.round((Date.now() - t0) / 1000)}s`);
}

main().catch((err) => console.warn(`[scoop] pull failed, building with the previous data: ${describeError(err)}`));
