import { SCOOP_DAYS, SCOOP_GOAL, SCOOP_START } from "./config";
import { addDays, chartIndex, localParts } from "./dates";
import type { Haven } from "./types";

// Each haven's daily counts only cover the chart window (CHART_START → CHART_DAYS, Sept 21 → Nov 15),
// so the week has to sit inside it.
export const SCOOP_START_INDEX = chartIndex(SCOOP_START);
export const SCOOP_END_INDEX = SCOOP_START_INDEX + SCOOP_DAYS - 1;
export const SCOOP_END = addDays(SCOOP_START, SCOOP_DAYS - 1);

/** Each haven's even share of SCOOP_GOAL, rounded up so every haven making its share is always enough. */
export const havenGoal = (havens: number) => Math.ceil(SCOOP_GOAL / Math.max(1, havens));

/** One haven's Scoop week so far. */
export type ScoopRun = {
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
    signups: week.reduce((n, d) => n + d, 0),
    today: inWeek ? (h.days[todayIndex] ?? 0) : 0,
    todayIndex,
    lastDay: week.findLastIndex((n) => n > 0),
  };
}
