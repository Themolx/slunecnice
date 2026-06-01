import PublicNav from "@/components/PublicNav";

export const metadata = { title: "O projektu — Slunečnice" };

export default function AboutPage() {
  return (
    <>
      <PublicNav />
      <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", padding: "28px 18px 60px" }}>
        <div className="type-label" style={{ color: "var(--muted)" }}>
          Manifest
        </div>
        <h1 className="type-xl" style={{ marginTop: 6 }}>
          Město plné slunečnic
        </h1>

        <div className="bar bar-sun" style={{ margin: "20px 0", maxWidth: 120 }} />

        <div className="prose-sun">
          <p>
            Slunečnice je kolektivní sázení slunečnic ve veřejném prostoru. Chodíme
            městem, hledáme zapomenutá místa a sázíme. Každé místo se objeví na mapě.
          </p>
          <h2>Jak se zapojit</h2>
          <p>
            Sázíme my, ale starat se může každý. Najdi na mapě nejbližší slunečnici,
            vezmi vodu a zalij ji. Když se postaráš, můžeš si jednu slunečnici
            pojmenovat. Péče odemyká jméno.
          </p>
          <h2>Voda</h2>
          <p>
            Na mapě jsou modré kapky — zdroje vody, kde můžeš nabrat. Barva každé
            slunečnice ukazuje, jak dlouho nebyla zalitá: zelená je čerstvá, červená
            volá po vodě.
          </p>
          <h2>Proč</h2>
          <p>
            Slunečnice rostou rychle, otáčí se za sluncem a krmí včely i ptáky. Jedno
            semínko v puklině chodníku promění šedé místo v něco živého. Město patří
            i rostlinám.
          </p>
        </div>
      </div>
    </>
  );
}
