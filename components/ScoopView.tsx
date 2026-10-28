"use client";

import { useState } from "react";
import { DAVEN_DASH, SCOOP_DAYS, SCOOP_GOAL, SCOOP_START } from "@/lib/config";
import { chartDate, chartIndex, formatDay, localParts } from "@/lib/dates";
import { havenGoal, SCOOP_END, SCOOP_END_INDEX, SCOOP_START_INDEX, scoopFor } from "@/lib/scoop";
import type { Haven } from "@/lib/types";
import { Columns } from "./charts/Columns";
import { HeroNav } from "./HeroNav";
import { useNow } from "./useNow";

const fmt = (n: number) => n.toLocaleString("en-US");
const day = (i: number) => formatDay(chartDate(i));
const matches = (h: Haven, q: string) =>
  !q || `${h.name} ${h.city} ${h.slug}`.toLowerCase().includes(q.toLowerCase());

// a round scoop with a drippy bottom edge
const SCOOP =
  "M14 54A36 36 0 0 1 86 54Q86 64 78 64Q72 64 70 70Q67 76 62 70Q58 64 50 64Q42 64 38 72Q34 78 30 70Q27 64 20 64Q14 64 14 54Z";

/** A cone whose scoop fills from the bottom as `share` goes from 0 to 1, with a cherry once it's full. */
function Cone({ share }: { share: number }) {
  const s = Math.min(1, Math.max(0, share));
  // the scoop's round part spans y 18 → 64; the drips below it fill with the first signup
  const top = 18 + 46 * (1 - s);
  return (
    <svg className="cone" viewBox="0 0 100 140" width={100} height={140} aria-hidden="true">
      <defs>
        <pattern id="cone-waffle" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0H11M0 0V11" className="cone-waffle" />
        </pattern>
        <clipPath id="cone-fill">
          <rect x="0" y={s > 0 ? top : 80} width="100" height={80 - top} />
        </clipPath>
      </defs>
      <path d="M18 64H82L50 134Z" className="cone-body" />
      <path d="M18 64H82L50 134Z" fill="url(#cone-waffle)" />
      <path d={SCOOP} className="cone-scoop-empty" />
      <path d={SCOOP} className="cone-scoop" clipPath="url(#cone-fill)" />
      <ellipse cx="33" cy="34" rx="7" ry="4.5" transform="rotate(-30 33 34)" className="cone-shine" />
      {s >= 1 && (
        <>
          <path d="M50 12C51 6 55 2 60 1" className="cone-stem" />
          <circle cx="50" cy="15" r="7" className="cone-cherry" />
        </>
      )}
    </svg>
  );
}

export function ScoopView({ havens, generatedAt }: { havens: Haven[]; generatedAt: number }) {
  const { now, tz } = useNow(generatedAt, 30_000);
  const [query, setQuery] = useState("");

  const goal = havenGoal(havens.length);
  const runs = havens.map((h) => ({ h, r: scoopFor(h, now) }));
  const total = runs.reduce((n, { r }) => n + r.signups, 0);
  const today = runs.reduce((n, { r }) => n + r.today, 0);
  const atGoal = runs.filter(({ r }) => r.signups >= goal).length;

  // every haven counts its own local day: the week has started once the furthest-ahead haven is in it,
  // and it's over once the furthest-behind one is past it
  const todays = runs.length ? runs.map(({ r }) => r.todayIndex) : [chartIndex(localParts(now, tz).date)];
  const latest = Math.min(Math.max(...todays), SCOOP_END_INDEX);
  const started = latest >= SCOOP_START_INDEX;
  const over = Math.min(...todays) > SCOOP_END_INDEX;
  const made = total >= SCOOP_GOAL;

  const byDay = Array.from({ length: Math.max(0, latest - SCOOP_START_INDEX + 1) }, (_, k) =>
    havens.reduce((n, h) => n + (h.days[SCOOP_START_INDEX + k] ?? 0), 0),
  );

  const left = SCOOP_GOAL - total;
  const daysLeft = SCOOP_END_INDEX - Math.max(latest, SCOOP_START_INDEX) + 1; // today included
  const status = made
    ? "Ice cream for every US haven"
    : !started
      ? `Starts ${formatDay(SCOOP_START)}`
      : over
        ? `${fmt(left)} short`
        : `${fmt(left)} to go · ${fmt(Math.ceil(left / daysLeft))} a day`;
  const navLabel = !started
    ? `starts ${formatDay(SCOOP_START)}`
    : over
      ? "all done"
      : `day ${latest - SCOOP_START_INDEX + 1} of ${SCOOP_DAYS}`;

  // every haven gets its own place: most signups, then whoever reached that total first, then by city
  const ranked = runs
    .toSorted((a, b) => b.r.signups - a.r.signups || a.r.lastDay - b.r.lastDay || a.h.city.localeCompare(b.h.city))
    .map((row, i) => ({ ...row, rank: i + 1 }));
  // ranked before filtering, so searching doesn't renumber them
  const rows = ranked.filter(({ h }) => matches(h, query));

  return (
    <>
      <header className="hero">
        <div className="hero-sky" aria-hidden="true" />
        <HeroNav label={navLabel} />
        <div className="hero-inner">
          <h1 className="title glow">Scoop</h1>
          <p className="sub glow">
            {formatDay(SCOOP_START)} – {formatDay(SCOOP_END)} · {havens.length} US havens
          </p>
        </div>
      </header>

      <main className="page">
        <section className="panel top">
          <div className="big">
            <Cone share={total / SCOOP_GOAL} />
            <div>
              <p className="big-n">{fmt(total)}</p>
              <p className="big-unit">signups</p>
              {started && !over && <p className="muted">{fmt(today)} today</p>}
            </div>
          </div>
          <div className="goal">
            <p className="goal-head">
              <span>{fmt(SCOOP_GOAL)} → ice cream</span>
              <span className="num">{Math.floor((total / SCOOP_GOAL) * 100)}%</span>
            </p>
            <div className={`bar${made ? " done" : ""}`} aria-hidden="true">
              <span style={{ width: `${Math.min(100, (total / SCOOP_GOAL) * 100)}%` }} />
            </div>
            <p className="muted">{status}</p>
          </div>
        </section>

        {started && (
          <section className="panel">
            <div className="panel-head">
              <h2>Every day</h2>
            </div>
            <Columns values={byDay} labels={byDay.map((_, k) => day(SCOOP_START_INDEX + k))} ariaLabel="US signups per Scoop day" />
          </section>
        )}

        <section className="panel">
          <div className="panel-head">
            <h2>
              Havens<span className="count">{havens.length}</span>
            </h2>
            <p className="muted">
              {atGoal} at their goal of {goal}
            </p>
            <input
              className="search"
              type="search"
              placeholder="find your haven"
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              aria-label="Filter havens by city"
            />
          </div>
          <ol className="board">
            {rows.map(({ h, r, rank }) => (
              <li key={h.slug}>
                <a href={`${DAVEN_DASH}/${encodeURIComponent(h.slug)}`} className={`row${r.signups >= goal ? " done" : ""}`}>
                  <span className="rank num">{rank}</span>
                  <span className="who">
                    <span className="city">{h.city}</span>
                    {r.today > 0 && <span className="row-today">+{fmt(r.today)} today</span>}
                  </span>
                  <span className="meter" aria-hidden="true">
                    <span style={{ width: `${Math.min(100, (r.signups / goal) * 100)}%` }} />
                  </span>
                  <span className="row-n">
                    {fmt(r.signups)}
                    <span className="row-unit">of {goal}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
          {rows.length === 0 && <p className="empty">{query ? "No matches." : "Nothing yet."}</p>}
        </section>
      </main>
    </>
  );
}
