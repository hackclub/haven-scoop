import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { describeError, loadFromAirtable } from "@/lib/airtable";
import { aggregate } from "@/lib/aggregate";
import { SCOOP_TAG } from "@/lib/data";
import { readScoopData, saveScoopData } from "@/lib/storage";

// The only code that talks to Airtable. Vercel Cron calls it every hour (vercel.json), sending
// `Authorization: Bearer $CRON_SECRET`. A pull is ~25 requests, at most 1 per second (lib/airtable.ts).
export const maxDuration = 300;

// Even with the secret, a pull within 10 minutes of the last one is skipped.
const MIN_GAP_MS = 10 * 60_000;

const shared = globalThis as typeof globalThis & { __scoopPulling?: Promise<Response> | null };

function authorized(header: string | null) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16 || !header) return false;
  const given = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function pull(token: string): Promise<Response> {
  const last = await readScoopData();
  if (last && Date.now() - last.generatedAt < MIN_GAP_MS) {
    return Response.json({ skipped: "pulled less than 10 minutes ago" });
  }
  try {
    const t0 = Date.now();
    const data = aggregate(await loadFromAirtable(token));
    await saveScoopData(data);
    revalidateTag(SCOOP_TAG, { expire: 0 }); // the next visit renders the new pull
    console.log(`[scoop] pulled ${data.havens.length} havens in ${Math.round((Date.now() - t0) / 1000)}s`);
    return Response.json({ havens: data.havens.length, pulledAt: new Date(data.generatedAt).toISOString() });
  } catch (err) {
    console.error(`[scoop] pull failed: ${describeError(err)}`);
    return new Response("Pull failed; see the function logs.", { status: 502 });
  }
}

export async function GET() {
  if (!authorized((await headers()).get("authorization"))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return new Response("AIRTABLE_TOKEN is not set", { status: 500 });

  // one pull at a time per instance
  shared.__scoopPulling ??= pull(token).finally(() => {
    shared.__scoopPulling = null;
  });
  return (await shared.__scoopPulling).clone();
}
