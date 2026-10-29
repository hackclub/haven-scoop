import { BIG_HAVEN, NO_VENUE_GOAL, SCOOP_DAYS, SCOOP_START, VENUE_GOAL } from "./config";
import { addDays, chartIndex, localParts } from "./dates";
import type { Haven } from "./types";

// Each haven's daily counts only cover the chart window (CHART_START → CHART_DAYS, Sept 21 → Nov 15),
// so the week has to sit inside it.
export const SCOOP_START_INDEX = chartIndex(SCOOP_START);
export const SCOOP_END_INDEX = SCOOP_START_INDEX + SCOOP_DAYS - 1;
export const SCOOP_END = addDays(SCOOP_START, SCOOP_DAYS - 1);

/** Signups before the week, in the haven's own timezone. */
const beforeWeek = (h: Haven) => h.earlier + h.days.slice(0, SCOOP_START_INDEX).reduce((n, d) => n + d, 0);

/**
 * Each haven's goal for the week (lib/config.ts). Size is judged on signups before the week, so a haven's
 * goal stays put during it: growing never raises the bar.
 */
export const havenGoal = (h: Haven) => (h.venue || beforeWeek(h) >= BIG_HAVEN ? VENUE_GOAL : NO_VENUE_GOAL);

/** One haven's Scoop week so far. */
export type ScoopRun = {
  goal: number;
  signups: number; // during the week, every age
  today: number; // on the haven's own local today, while that's in the week
  todayIndex: number; // chart index of the haven's local today
  lastDay: number; // the week's day of its latest signup, so a tie goes to whoever got there first (-1: none)
};

export function scoopFor(h: Haven, now: number): ScoopRun {
  const todayIndex = chartIndex(localParts(now, h.tz).date);
  const week = h.days.slice(SCOOP_START_INDEX, SCOOP_END_INDEX + 1);
  const inWeek = todayIndex >= SCOOP_START_INDEX && todayIndex <= SCOOP_END_INDEX;
  return {
    goal: havenGoal(h),
    signups: week.reduce((n, d) => n + d, 0),
    today: inWeek ? (h.days[todayIndex] ?? 0) : 0,
    todayIndex,
    lastDay: week.findLastIndex((n) => n > 0),
  };
}
