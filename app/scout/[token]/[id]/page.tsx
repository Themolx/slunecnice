import { notFound } from "next/navigation";
import CrewHeader from "@/components/CrewHeader";
import EditSpot from "./EditSpot";
import { fetchSpot } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EditSpotPage({ params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params;
  const spot = await fetchSpot(id);
  if (!spot) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <CrewHeader token={token} title={spot.name || (spot.kind === "water" ? "Zdroj vody" : "Místo")} back />
      <EditSpot token={token} spot={spot} />
    </div>
  );
}
