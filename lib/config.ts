// Rules for Scoop: every US haven together needs SCOOP_GOAL signups (any age) in SCOOP_DAYS days, and
// then every US haven gets ice cream. Days run midnight to midnight in each haven's own timezone.
export const SCOOP_START = "2026-10-30"; // day 1, a Friday
export const SCOOP_DAYS = 7;
export const SCOOP_GOAL = 1000;

// Each haven's own goal for the week: VENUE_GOAL with an approved venue, NO_VENUE_GOAL without one. A
// haven without a venue that had BIG_HAVEN signups before the week started is held to VENUE_GOAL too.
export const VENUE_GOAL = 20;
export const NO_VENUE_GOAL = 10;
export const BIG_HAVEN = 45;

// Each haven's daily counts cover whole weeks around Scoop and Haven (Mon Sept 21 → Sun Nov 15), so
// moving the dates inside that window only takes a deploy, not a new pull.
export const CHART_START = "2026-09-21";
export const CHART_DAYS = 56;

// Airtable is pulled every hour by Vercel Cron (vercel.json → app/api/pull). Keep the two in sync.
export const PULL_EVERY_MS = 60 * 60_000;
