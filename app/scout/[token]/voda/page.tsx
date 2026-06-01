import CrewHeader from "@/components/CrewHeader";
import NewSpot from "../novy/NewSpot";

export default async function NewWaterPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <CrewHeader token={token} title="Nový zdroj vody" back />
      <NewSpot token={token} defaultKind="water" />
    </div>
  );
}
