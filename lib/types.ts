export type RawEvent = {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  status: string; // server-side only, never sent to the browser
  lat: number | null;
  lon: number | null;
  venue: boolean; // has an approved venue
};

export type RawSignup = {
  eventId: string;
  time: number;
};

export type RawData = {
  fetchedAt: number;
  origin: "airtable" | "snapshot" | "empty";
  events: RawEvent[];
  signups: RawSignup[];
};

/** One US haven: its daily signup counts by local date. */
export type Haven = {
  slug: string;
  name: string;
  city: string;
  venue: boolean; // has an approved venue
  tz: string;
  earlier: number; // signups before CHART_START
  days: number[]; // CHART_DAYS long, index 0 = CHART_START, in the haven's local timezone
};

export type ScoopData = {
  generatedAt: number;
  origin: RawData["origin"];
  havens: Haven[];
};
