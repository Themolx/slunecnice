import PublicNav from "@/components/PublicNav";
import Onboarding from "@/components/Onboarding";
import FindMy, { type HomeSpot } from "./FindMy";
import { fetchSpots, fetchLastWateredMap } from "@/lib/data";

export const revalidate = 60;

export const metadata = {
  title: "Slunečnice — najdi nejbližší",
};

export default async function HomePage() {
  let spots: HomeSpot[] = [];
  try {
    const [all, lastWatered] = await Promise.all([fetchSpots(), fetchLastWateredMap()]);
    spots = all.map((s) => ({ ...s, lastWatered: lastWatered.get(s.id) ?? null }));
  } catch {
    // Supabase not configured yet — render empty.
  }

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <Onboarding />
      <PublicNav />
      <div style={{ flex: 1, minHeight: 0 }}>
        <FindMy spots={spots} />
      </div>
    </div>
  );
}
