"use client";

import { useEffect, useRef, useState } from "react";
import { SCOOP_DAYS, SCOOP_GOAL, SCOOP_START } from "@/lib/config";
import { chartDate, chartIndex, formatDay, formatWeekday, localParts } from "@/lib/dates";
import { SCOOP_END_INDEX, SCOOP_START_INDEX, scoopFor, type ScoopRun } from "@/lib/scoop";
import type { Haven } from "@/lib/types";
import { HeroNav } from "./HeroNav";
import { useNow } from "./useNow";

const fmt = (n: number) => n.toLocaleString("en-US");
const matches = (h: Haven, q: string) =>
  !q || `${h.name} ${h.city} ${h.slug}`.toLowerCase().includes(q.toLowerCase());

// a round scoop with a drippy bottom edge, and the cone it sits on
const SCOOP =
  "M14 54A36 36 0 0 1 86 54Q86 64 78 64Q72 64 70 70Q67 76 62 70Q58 64 50 64Q42 64 38 72Q34 78 30 70Q27 64 20 64Q14 64 14 54Z";
const CONE = "M18 64H82L50 134Z";

// SCOOP_GOAL in four scoops, bottom to top; each sits STEP above the one below
const FLAVOURS = ["strawberry", "vanilla", "mint", "chocolate"] as const;
const STEP = 40;

/** The cone, with a scoop for every quarter of SCOOP_GOAL. Each fills from the bottom, and a cherry goes on top once they're all full. */
function Stack({ total }: { total: number }) {
  const per = SCOOP_GOAL / FLAVOURS.length;
  const top = -STEP * (FLAVOURS.length - 1);
  return (
    <svg className="stack" viewBox={`-24 ${top - 6} 148 ${142 - top}`} aria-hidden="true">
      <defs>
        <pattern id="stack-waffle" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0H11M0 0V11" className="cone-waffle" />
        </pattern>
      </defs>
      <path d={CONE} className="cone-body" />
      <path d={CONE} fill="url(#stack-waffle)" />
      {FLAVOURS.map((flavour, i) => {
        const s = Math.min(1, Math.max(0, (total - i * per) / per));
        // the round part spans y 18 → 64; the drips below it fill with the scoop's first signup
        const y = 18 + 46 * (1 - s);
        return (
          <g key={flavour} transform={`translate(0 ${-STEP * i})`}>
            <clipPath id={`stack-fill-${i}`}>
              <rect x="0" y={s > 0 ? y : 80} width="100" height={s > 0 ? 80 - y : 0} />
            </clipPath>
            <path d={SCOOP} className="scoop-empty" />
            <g className={`scoop scoop-${flavour}`} clipPath={`url(#stack-fill-${i})`}>
              <path d={SCOOP} />
              <ellipse cx="33" cy="34" rx="7" ry="4.5" transform="rotate(-30 33 34)" className="cone-shine" />
            </g>
            <text x="92" y="44" className={`stack-label${s > 0 ? " on" : ""}`}>
              {fmt(per * (i + 1))}
            </text>
          </g>
        );
      })}
      {total >= SCOOP_GOAL && (
        <g transform={`translate(0 ${top})`}>
          <path d="M50 12C51 6 55 2 60 1" className="cone-stem" />
          <circle cx="50" cy="15" r="7" className="cone-cherry" />
        </g>
      )}
    </svg>
  );
}

function Cherry() {
  return (
    <svg className="cherry" viewBox="0 0 16 20" aria-hidden="true">
      <path d="M8 9C8.5 5 11 2 14 1" className="cone-stem" />
      <circle cx="8" cy="13" r="6" className="cone-cherry" />
    </svg>
  );
}

// every haven fills its own goal: fullest first (past it counts as full), then most signups, then whoever
// reached that total first, then by city
const fill = (r: ScoopRun) => Math.min(1, r.signups / r.goal);

type Day = { i: number; n: number | null };

/** Each day of the week up to chart index `upTo`; days still to come are null. */
const weekOf = (upTo: number, count: (i: number) => number): Day[] =>
  Array.from({ length: SCOOP_DAYS }, (_, k) => {
    const i = SCOOP_START_INDEX + k;
    return { i, n: i <= upTo ? count(i) : null };
  });

/** A column a day, scaled to the week's busiest day, with `today` picked out. */
function Days({ week, today }: { week: Day[]; today: number }) {
  const busiest = Math.max(1, ...week.map(({ n }) => n ?? 0));
  return (
    <ol className="days">
      {week.map(({ i, n }) => (
        <li
          key={i}
          className={`day${n === null ? " later" : ""}${i === today ? " now" : ""}`}
          aria-label={`${formatDay(chartDate(i))}: ${n === null ? "still to come" : `${n} signups`}`}
        >
          <span className="day-plot" aria-hidden="true">
            <span className="day-bar" style={{ height: `${((n ?? 0) / busiest) * 100}%` }}>
              <span className="day-n num">{n === null ? "–" : fmt(n)}</span>
            </span>
          </span>
          <span className="day-name">{formatWeekday(chartDate(i))}</span>
          <span className="day-date">{formatDay(chartDate(i))}</span>
        </li>
      ))}
    </ol>
  );
}

/** One haven's week in a popup: its tub and each of its days in its own timezone. */
function HavenSheet({ h, r, rank, of, onClose }: { h: Haven; r: ScoopRun; rank: number; of: number; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const done = r.signups >= r.goal;
  const over = r.todayIndex > SCOOP_END_INDEX;
  const left = r.goal - r.signups;

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onClose={onClose}
      // a click on the dialog itself, not its contents, is a click on the backdrop
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
    >
      <div className="sheet-body">
        <div className="sheet-head">
          <div>
            <p className="sheet-rank">
              #{rank} of {of}
            </p>
            <h2 id="sheet-title">{h.city}</h2>
          </div>
          <button type="button" className="sheet-close" onClick={() => ref.current?.close()} aria-label="Close">
            ×
          </button>
        </div>

        <div className="sheet-goal">
          <p className="sheet-tally">
            {fmt(r.signups)}
            <small>of {r.goal}</small>
          </p>
          <span className={`tub sheet-bar${done ? " done" : ""}`} aria-hidden="true">
            <span className="tub-fill" style={{ width: `${fill(r) * 100}%` }} />
          </span>
          <p className="muted">
            {done ? "Filled" : over ? `${fmt(left)} short` : `${fmt(left)} to go`}
            {r.today > 0 && ` · +${fmt(r.today)} today`}
          </p>
        </div>

        <Days week={weekOf(r.todayIndex, (i) => h.days[i] ?? 0)} today={r.todayIndex} />
      </div>
    </dialog>
  );
}

export function ScoopView({ havens, generatedAt }: { havens: Haven[]; generatedAt: number }) {
  const { now, tz } = useNow(generatedAt, 30_000);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);

  const runs = havens.map((h) => ({ h, r: scoopFor(h, now) }));
  const total = runs.reduce((n, { r }) => n + r.signups, 0);
  const today = runs.reduce((n, { r }) => n + r.today, 0);
  const atGoal = runs.filter(({ r }) => r.signups >= r.goal).length;

  // every haven counts its own local day: the week has started once the furthest-ahead haven is in it,
  // and it's over once the furthest-behind one is past it
  const todays = runs.length ? runs.map(({ r }) => r.todayIndex) : [chartIndex(localParts(now, tz).date)];
  const latest = Math.min(Math.max(...todays), SCOOP_END_INDEX);
  const started = latest >= SCOOP_START_INDEX;
  const over = Math.min(...todays) > SCOOP_END_INDEX;
  const made = total >= SCOOP_GOAL;

  const week = weekOf(latest, (i) => havens.reduce((n, h) => n + (h.days[i] ?? 0), 0));

  // before the week the top corner already says when it starts, so the tally has nothing to add
  const left = SCOOP_GOAL - total;
  const status = made
    ? "Ice cream for every US haven"
    : !started
      ? null
      : over
        ? `${fmt(left)} short`
        : `${fmt(left)} to go`;
  const navLabel = !started
    ? `starts ${formatDay(SCOOP_START)}`
    : over
      ? "all done"
      : `day ${latest - SCOOP_START_INDEX + 1} of ${SCOOP_DAYS}`;

  const ranked = runs
    .toSorted(
      (a, b) =>
        fill(b.r) - fill(a.r) ||
        b.r.signups - a.r.signups ||
        a.r.lastDay - b.r.lastDay ||
        a.h.city.localeCompare(b.h.city),
    )
    .map((row, i) => ({ ...row, rank: i + 1 }));
  // ranked before filtering, so searching doesn't renumber them
  const rows = ranked.filter(({ h }) => matches(h, query));
  const sheet = ranked.find(({ h }) => h.slug === picked);

  return (
    <>
      <header className="hero">
        <div className="hero-sky" aria-hidden="true" />
        <HeroNav label={navLabel} />
        <div className="hero-inner shop">
          <div className="shop-head">
            <h1 className="title glow">Scoop</h1>
            <p className="tagline glow">
              World’s Largest
              <br />
              Ice Cream Party
            </p>
            <p className="pitch glow">
              {SCOOP_GOAL} signups in {SCOOP_DAYS} days
            </p>
          </div>
          <Stack total={total} />
          <div className="shop-tally">
            <p className="tally glow">
              <span className="num">{fmt(total)}</span>
              <span className="tally-of">/ {fmt(SCOOP_GOAL)}</span>
            </p>
            {status && <p className="tally-status glow">{status}</p>}
            <ul className="facts">
              {started && !over && (
                <li>
                  <b>{fmt(today)}</b> today
                </li>
              )}
              <li>
                <b>{atGoal}</b> of {havens.length} havens filled theirs
              </li>
            </ul>
          </div>
        </div>
      </header>

      <main className="parlor">
        <div className="parlor-inner">
          <section>
            <div className="section-head">
              <h2>Every day</h2>
            </div>
            <Days week={week} today={started && !over ? latest : -1} />
          </section>

          <section>
            <div className="section-head">
              <h2>
                Every haven<span className="count">{havens.length}</span>
              </h2>
              <input
                className="search"
                type="search"
                placeholder="find your haven"
                value={query}
                onChange={(ev) => setQuery(ev.target.value)}
                aria-label="Filter havens by city"
              />
            </div>
            <ol className="tubs">
              {rows.map(({ h, r, rank }) => (
                <li key={h.slug}>
                  <button
                    type="button"
                    className={`tub${r.signups >= r.goal ? " done" : ""}`}
                    aria-haspopup="dialog"
                    onClick={() => setPicked(h.slug)}
                  >
                    <span className="tub-fill" style={{ width: `${fill(r) * 100}%` }} />
                    <span className="tub-rank num">{rank}</span>
                    <span className="tub-city">{h.city}</span>
                    {r.today > 0 && (
                      <span className="tub-today">
                        +{fmt(r.today)}
                        <span className="tub-today-word"> today</span>
                      </span>
                    )}
                    <span className="tub-n">
                      {fmt(r.signups)}
                      <small>of {r.goal}</small>
                      {r.signups >= r.goal && <Cherry />}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            {rows.length === 0 && <p className="empty">{query ? "No matches." : "Nothing yet."}</p>}
          </section>
        </div>
      </main>

      {sheet && <HavenSheet key={sheet.h.slug} {...sheet} of={havens.length} onClose={() => setPicked(null)} />}
    </>
  );
}
