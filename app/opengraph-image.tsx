import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";

// The link preview: Haven's forest turned blue, Haven's logo, and a full cone. next/og can't read webp
// or CSS filters, so assets/og keeps a JPEG of the forest already turned blue and a PNG of the logo.
export const alt = "Hack Club Haven: Scoop, the World’s Largest Ice Cream Party";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// literal URLs, so the bundler ships each file with the route
const art = async (url: URL, type: string) => `data:${type};base64,${(await readFile(url)).toString("base64")}`;

// the page's cone (components/ScoopView.tsx), all four scoops full and with its cherry
const SCOOP =
  "M14 54A36 36 0 0 1 86 54Q86 64 78 64Q72 64 70 70Q67 76 62 70Q58 64 50 64Q42 64 38 72Q34 78 30 70Q27 64 20 64Q14 64 14 54Z";
const SCOOPS = ["#ff8fb7", "#fff0c2", "#94e6c9", "#a8694a"]
  .map(
    (fill, i) =>
      `<g transform="translate(0 ${-40 * i})"><path d="${SCOOP}" fill="${fill}"/><ellipse cx="33" cy="34" rx="7" ry="4.5" transform="rotate(-30 33 34)" fill="#fff" opacity="0.55"/></g>`,
  )
  .join("");
const CONE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -122 100 258">
<defs><pattern id="w" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H11M0 0V11" fill="none" stroke="#c98a45" stroke-width="1.5"/></pattern></defs>
<path d="M18 64H82L50 134Z" fill="#ebb36b"/><path d="M18 64H82L50 134Z" fill="url(#w)"/>
${SCOOPS}
<g transform="translate(0 -120)"><path d="M50 12C51 6 55 2 60 1" fill="none" stroke="#7a4a2a" stroke-width="2" stroke-linecap="round"/><circle cx="50" cy="15" r="7" fill="#e23a5e"/></g>
</svg>`;

export default async function Image() {
  const [bg, logo] = await Promise.all([
    art(new URL("../assets/og/hero-scoop.jpg", import.meta.url), "image/jpeg"),
    art(new URL("../assets/og/logo.png", import.meta.url), "image/png"),
  ]);
  const cone = `data:image/svg+xml;base64,${Buffer.from(CONE).toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#5aa7ea" }}>
        <img src={bg} alt="" width={1200} height={848} style={{ position: "absolute", top: 0, left: 0 }} />
        <img src={logo} alt="" width={640} height={412} style={{ position: "absolute", top: 110, left: 80 }} />
        <img src={cone} alt="" width={217} height={560} style={{ position: "absolute", right: 150, top: 35 }} />
      </div>
    ),
    size,
  );
}
