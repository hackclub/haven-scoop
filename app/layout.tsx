import type { Metadata, Viewport } from "next";
import { Darumadrop_One, Jua } from "next/font/google";
import "./globals.css";

// Haven's type: Darumadrop One for display, Jua for everything else.
const display = Darumadrop_One({ variable: "--font-darumadrop", weight: "400", subsets: ["latin", "latin-ext"] });
const body = Jua({ variable: "--font-jua", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scoop · World’s Largest Ice Cream Party",
  description: "1,000 signups across every US Hack Club Haven in one week, and ice cream for all of them.",
  // the image itself is app/opengraph-image.tsx; on Vercel its URL is based on the production domain
  openGraph: { siteName: "Scoop", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#1f5fbf",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        {/* the page is already themed; stop the Dark Reader extension from recolouring it */}
        <meta name="darkreader-lock" />
      </head>
      <body>{children}</body>
    </html>
  );
}
