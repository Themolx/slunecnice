import CrewHeader from "@/components/CrewHeader";
import PlantingMode from "./PlantingMode";
import { fetchSpots } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SazeniPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const spots = await fetchSpots("planting");
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <CrewHeader token={token} title="Sázení" back />
      <PlantingMode token={token} spots={spots} />
    </div>
  );
}
