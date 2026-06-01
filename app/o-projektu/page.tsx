import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "O projektu — guerilla slunečnice v Praze a na Palmovce",
  description:
    "Co je Slunečnice: kolektivní guerilla gardening projekt sázení slunečnic ve veřejném prostoru Prahy, Palmovky a Libně. Jak se zapojit, jak zalévat a proč slunečnice.",
  alternates: { canonical: "/o-projektu" },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Co je projekt Slunečnice?",
    a: "Slunečnice je kolektivní guerilla gardening projekt sázení slunečnic ve veřejném prostoru Prahy, se srdcem na Palmovce a v Libni. Lidé na živé mapě najdou nejbližší slunečnici, zalijí ji, vyfotí a sbírají body v žebříčku zahradníků.",
  },
  {
    q: "Jak se můžu zapojit?",
    a: "Otevři mapu, najdi nejbližší slunečnici, dojdi k ní, zalij ji a vyfoť. Za každou zálivku získáš body. Sázení organizujeme společně, ale starat se může kdokoliv.",
  },
  {
    q: "Kde slunečnice sázíme?",
    a: "Po celé Praze, s důrazem na Palmovku, Libeň a okolní šedá zákoutí veřejného prostoru (Praha 8). Na mapě jsou všechna místa i zdroje vody.",
  },
  {
    q: "Jak často se má slunečnice zalévat?",
    a: "Jednu slunečnici stačí zalít zhruba jednou za den. Barva okraje bodu na mapě ukazuje suchost: zelená je čerstvě zalitá, červená volá po vodě. Zalévej hlavně ty žíznivé.",
  },
  {
    q: "Je to legální guerilla gardening?",
    a: "Slunečnice jsou neinvazivní jednoletá rostlina. Sázíme do zanedbaných míst veřejného prostoru s respektem k okolí. Jde o nekomerční komunitní a uměleckou intervenci.",
  },
  {
    q: "Proč zrovna slunečnice?",
    a: "Slunečnice rostou rychle, otáčejí se za sluncem a krmí včely i ptáky. Jedno semínko v puklině chodníku promění šedé místo v něco živého.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Mapa", item: SITE_URL + "/" },
    { "@type": "ListItem", position: 2, name: "O projektu", item: SITE_URL + "/o-projektu" },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <PublicNav />
      <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", padding: "28px 18px 60px" }}>
        <div className="type-label" style={{ color: "var(--muted)" }}>Manifest · guerilla slunečnice v Praze</div>
        <h1 className="type-xl" style={{ marginTop: 6 }}>Město plné slunečnic</h1>

        <div className="bar bar-sun" style={{ margin: "20px 0", maxWidth: 120 }} />

        <div className="prose-sun">
          <p>
            <strong>Slunečnice</strong> je kolektivní <strong>guerilla gardening</strong>{" "}
            projekt sázení slunečnic ve veřejném prostoru <strong>Prahy</strong>, se
            srdcem na <strong>Palmovce</strong> a v <strong>Libni</strong> (Praha 8).
            Chodíme městem, hledáme zapomenutá šedá místa a sázíme. Každá slunečnice
            se objeví na živé mapě, kde ji kdokoliv najde, zalije a vyfotí.
          </p>

          <h2>Jak se zapojit</h2>
          <p>
            Sázení organizujeme společně, ale starat se může každý. Najdi na mapě
            nejbližší slunečnici, vezmi vodu a zalij ji. Za každou zálivku získáš body
            do žebříčku zahradníků. Na mapě jsou i modré zdroje vody, kde nabereš.
          </p>

          <h2>Suchost a péče</h2>
          <p>
            Barva okraje slunečnice na mapě ukazuje, jak dlouho nebyla zalitá: zelená
            je čerstvá, červená volá po vodě. Jednu slunečnici stačí zalít zhruba
            jednou za den — zalévej hlavně ty žíznivé.
          </p>

          <h2>Proč slunečnice</h2>
          <p>
            Slunečnice rostou rychle, otáčejí se za sluncem a krmí včely i ptáky. Jedno
            semínko v puklině chodníku promění šedé místo v něco živého. Městská zeleň
            patří i rostlinám a je to forma umělecké intervence ve veřejném prostoru.
          </p>

          <h2>Časté otázky</h2>
          {FAQ.map((f) => (
            <div key={f.q} style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 16 }}>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
