import "server-only";

// Everything about the Airtable base lives here, away from lib/config.ts, which browser code imports.
// Table and field names only mean something together with the base id and a token.

// The token is sent to this URL, so only Airtable itself (or a local mock for testing) is accepted.
export const AIRTABLE_API_URL = (() => {
  const url = process.env.AIRTABLE_API_URL ?? "https://api.airtable.com/v0";
  const { protocol, hostname } = new URL(url);
  const ok =
    (protocol === "https:" && hostname === "api.airtable.com") ||
    (protocol === "http:" && (hostname === "localhost" || hostname === "127.0.0.1"));
  if (!ok) throw new Error("AIRTABLE_API_URL must be https://api.airtable.com or a localhost mock");
  return url.replace(/\/$/, "");
})();
// Required with AIRTABLE_TOKEN; kept out of the repo along with the token.
export const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID ?? "";
export const AIRTABLE_TABLES = {
  events: "tbl0BQWphHe0gWEIp",
  attendees: "tblFV1bwpg8vheHHv",
  venues: "tbltjfsyXGbte0oBf",
};

export const EVENT_FIELDS = {
  slug: "Slug",
  name: "Name",
  location: "Location",
  status: "Status",
  lat: "!Latitude",
  lon: "!Longitude",
  venues: "Venue",
  isTest: "_Is Test",
} as const;

export const VENUE_FIELDS = {
  status: "Status",
} as const;

export const ATTENDEE_FIELDS = {
  event: "Event",
  role: "Role",
  softDeleted: "Soft Deleted",
  withdrawn: "!Withdrawn",
  signupTime: "Signup Time",
} as const;

// A signup counts when it's a participant who hasn't been de-duplicated or withdrawn, whatever their age.
export const ATTENDEE_FILTER = `AND({${ATTENDEE_FIELDS.role}}='Participant', NOT({${ATTENDEE_FIELDS.softDeleted}}), NOT({${ATTENDEE_FIELDS.withdrawn}}))`;
// Only what haven.hackclub.com itself publishes: On Hold / Cancelled / Merged events stay private.
export const EVENT_FILTER = `AND({${EVENT_FIELDS.status}}='Active', NOT({${EVENT_FIELDS.isTest}}))`;
// A haven has a venue once one is approved, which is also when haven.hackclub.com shows it. Only the ids
// are used: venue names, addresses and contacts are never requested.
export const VENUE_FILTER = `{${VENUE_FIELDS.status}}='Approved'`;
