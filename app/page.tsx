import PublicNav from "@/components/PublicNav";
import Onboarding from "@/components/Onboarding";
import FindMy, { type HomeSpot } from "./FindMy";
import { fetchSpots, fetchLastWateredMap } from "@/lib/data";

export const revalidate = 60;

export const metadata = {
  title: "Živá mapa slunečnic — guerilla sázení v Praze a na Palmovce",
  description:
    "Najdi na živé mapě nejbližší slunečnici v Praze, zalij ji a vyfoť. Kolektivní guerilla gardening na Palmovce, v Libni a po celém městě.",
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
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Crawlable answer block (first ~200 words) for search + AI engines. */}
      <section className="sr-only">
        <h1>Slunečnice — guerilla sázení slunečnic v Praze</h1>
        <p>
          Slunečnice je kolektivní guerilla gardening projekt sázení slunečnic ve
          veřejném prostoru Prahy, se srdcem na Palmovce a v Libni (Praha 8). Na
          této živé mapě najdeš nejbližší slunečnici, fyzicky ji zaliješ, vyfotíš a
          sbíráš body v žebříčku zahradníků. Společně proměňujeme šedá zákoutí města
          v kvetoucí místa pro lidi, včely i ptáky. Na mapě jsou žluté body
          (slunečnice) a zelené body (zdroje vody — pítka, kašny, řeka). Barva okraje
          slunečnice ukazuje, jak dlouho nebyla zalitá: zelená je čerstvá, červená
          volá po vodě. Zapojit se může kdokoliv: stačí najít slunečnici poblíž,
          zalít ji a postarat se. Klíčová slova: slunečnice, sázení slunečnic, Praha,
          Palmovka, Libeň, guerilla gardening, městská zeleň, komunitní zahrada,
          urban gardening, péče o rostliny, kvetoucí město.
        </p>
      </section>
      <Onboarding />
      <PublicNav />
      <div style={{ flex: 1, minHeight: 0 }}>
        <FindMy spots={spots} />
      </div>
    </div>
  );
}
