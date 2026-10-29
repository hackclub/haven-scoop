import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="lost">
      <Image src="/haven/hedgehog.webp" alt="" width={422} height={308} className="lost-daven" />
      <h1>No ice cream here</h1>
      <Link href="/" className="back">
        Back to Scoop
      </Link>
    </main>
  );
}
