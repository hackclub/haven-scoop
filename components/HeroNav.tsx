import Image from "next/image";

/** Haven's cloud in the corner, with where Scoop is at in the spot the Haven site has its nav links. */
export function HeroNav({ label }: { label: string }) {
  return (
    <>
      <Image className="nav-banner" src="/haven/nav-banner.webp" alt="" aria-hidden="true" width={646} height={260} preload />
      <nav className="hero-nav" aria-label="Primary">
        <span className="hero-day">{label}</span>
      </nav>
    </>
  );
}
