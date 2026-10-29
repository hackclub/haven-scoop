import Image from "next/image";

/**
 * Hack Club's flag hanging from the top-left, as on Hack Club's other sites; Haven's cloud in the other
 * corner, with where Scoop is at in the spot the Haven site has its nav links.
 */
export function HeroNav({ label }: { label: string }) {
  return (
    <>
      <a className="hc-flag" href="https://hackclub.com/">
        <Image src="https://assets.hackclub.com/flag-orpheus-top.svg" alt="Hack Club" width={280} height={158} unoptimized preload />
      </a>
      <Image className="nav-banner" src="/haven/nav-banner.webp" alt="" aria-hidden="true" width={646} height={260} preload />
      <nav className="hero-nav" aria-label="Primary">
        <span className="hero-day">{label}</span>
      </nav>
    </>
  );
}
