import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Loading } from "@/components/Loading";
import { ScoopView } from "@/components/ScoopView";
import { getScoopData } from "@/lib/data";

// Rendered from the cached latest pull (lib/data.ts), streamed in behind the boundary.
async function ScoopContent() {
  const data = await getScoopData();
  return (
    <>
      <ScoopView havens={data.havens} generatedAt={data.generatedAt} />
      <Footer generatedAt={data.generatedAt} />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Loading label="Loading Scoop…" />}>
      <ScoopContent />
    </Suspense>
  );
}
