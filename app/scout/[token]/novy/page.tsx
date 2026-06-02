import ScoutCapture from "./ScoutCapture";

export default async function NewSpotPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ScoutCapture token={token} />;
}
