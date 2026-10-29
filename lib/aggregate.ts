import "server-only";
import tzlookup from "@photostructure/tz-lookup";
import { CHART_DAYS } from "./config";
import { chartIndex, localParts } from "./dates";
import type { Haven, RawData, ScoopData } from "./types";

// Turns a raw pull into exactly what the page shows: each US haven's daily signup counts in its own
// local time, every age. Shared by /api/pull and scripts/pull.ts.

function timezoneFor(lat: number | null, lon: number | null) {
  if (lat === null || lon === null) return "UTC";
  try {
    return tzlookup(lat, lon);
  } catch {
    return "UTC";
  }
}

export function aggregate(raw: RawData): ScoopData {
  const byId = new Map<string, Haven>();
  for (const e of raw.events) {
    // the status check also filters old snapshots
    if (e.status !== "Active" || e.country !== "United States") continue;
    byId.set(e.id, {
      slug: e.slug,
      name: e.name,
      city: e.city,
      venue: e.venue === true, // old snapshots don't have it
      tz: timezoneFor(e.lat, e.lon),
      earlier: 0,
      days: new Array(CHART_DAYS).fill(0),
    });
  }

  for (const s of raw.signups) {
    const h = byId.get(s.eventId);
    if (!h) continue;
    const i = chartIndex(localParts(s.time, h.tz).date);
    if (i < 0) h.earlier++;
    else if (i < CHART_DAYS) h.days[i]++;
  }

  return {
    generatedAt: raw.fetchedAt,
    origin: raw.origin,
    havens: [...byId.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}
