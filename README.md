# Scoop

A public dashboard for Scoop, a Hack Club Haven campaign: every US haven together needs 1,000 signups in one week, and then every US haven gets ice cream.

The page shows the US total against 1,000 (with a cone that fills up), signups for each day so far, and every US haven ranked by signups this week against an even share of the goal (1,000 ÷ the number of US havens, rounded up). Each haven links to its page on [50 Days Till Daven](https://daven.haven.hackclub.com).

The look, fonts and artwork come from [haven.hackclub.com](https://haven.hackclub.com) ([hackclub/haven](https://github.com/hackclub/haven)), turned blue.

## How signups are counted

- **Signups**: rows in the Attendees table with `Role = Participant`, excluding `Soft Deleted` (duplicates) and `!Withdrawn`, whatever their age.
- **Havens**: Active events in the United States, minus `_Is Test`.
- **Day**: the `Signup Time` converted to the haven's timezone, looked up from its `!Latitude` / `!Longitude`. The week runs midnight to midnight in each haven's own timezone.

The dates and goal are in [`lib/config.ts`](lib/config.ts). **The dates are a placeholder (Oct 28 to Nov 3) until they're set.** Each haven's counts cover Sept 21 to Nov 15, so moving the week anywhere inside that only takes a deploy. The logic is in [`lib/scoop.ts`](lib/scoop.ts), and it runs in the browser against the live clock.

## Data, caching and privacy

Airtable is pulled every hour by a Vercel Cron job ([`vercel.json`](vercel.json)) that calls [`/api/pull`](app/api/pull/route.ts), the only code that talks to Airtable. A pull is about 25 requests, one at a time and at least 1.05s apart. After a 429 it waits 30s. The route needs `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends it), and it skips a pull within 10 minutes of the last one.

The pull is boiled down to each US haven's daily signup counts and saved to a private Vercel Blob ([`lib/storage.ts`](lib/storage.ts)). The page renders from that saved copy, cached across requests ([`lib/data.ts`](lib/data.ts)), so visitors never reach Airtable. If a pull fails, the last good copy stays up.

Only Active events (the ones haven.hackclub.com lists) and their daily counts are published. Names, emails, ages, answers and record IDs never leave the server. `AIRTABLE_TOKEN` and `AIRTABLE_BASE_ID` are only read by server-only modules, and the token is only ever sent to `https://api.airtable.com`. Use a token with just the `data.records:read` scope on the YSWS - Haven base.

## Running it

```bash
cp .env.example .env.local   # add the token, base id and a CRON_SECRET
pnpm install
pnpm dev
```

Locally, with no Blob token, pulls are saved to `data/scoop.json` (gitignored). `pnpm pull` pulls if that copy is missing or over an hour old, and so does `pnpm build`. Before the first pull the app reads `data/snapshot.json`, which `pnpm snapshot` makes.

## Deploying on Vercel

1. Import the repo into Vercel.
2. In the project's Storage tab, create a **private** Blob store and connect it. That adds `BLOB_READ_WRITE_TOKEN`.
3. Set `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID` and `CRON_SECRET` (e.g. `openssl rand -hex 32`).
4. Deploy. The build does the first pull itself, so the site has data straight away.

The hourly cron needs a Pro team. On Hobby, change the schedule in `vercel.json` to once a day.
