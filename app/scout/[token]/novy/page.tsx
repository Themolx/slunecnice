import CrewHeader from "@/components/CrewHeader";
import NewSpot from "./NewSpot";

export default async function NewSpotPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <CrewHeader token={token} title="Nové místo" back />
      <NewSpot token={token} />
    </div>
  );
}
