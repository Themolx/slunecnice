"use client";
import { useEffect, useState } from "react";
import {
  getGardener,
  setGardener,
  markOnboarded,
  markGpsOk,
  isOnboarded,
  POINTS_WATER,
} from "@/lib/gardener";

type Step = "start" | "name" | "gps";

/**
 * First-run onboarding overlay. Self-gates on localStorage: renders nothing if
 * already onboarded. Steps: intro -> gardener handle -> camera permission.
 */
export default function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("start");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOnboarded()) {
      setName(getGardener());
      setOpen(true);
    }
    const reopen = () => {
      setName(getGardener());
      setStep("start");
      setError(null);
      setOpen(true);
    };
    window.addEventListener("slunecnice:onboarding", reopen);
    return () => window.removeEventListener("slunecnice:onboarding", reopen);
  }, []);

  if (!open) return null;

  const finish = () => {
    setGardener(name.trim() || "Zahradník");
    markOnboarded();
    setOpen(false);
  };

  const requestGps = async () => {
    setBusy(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Polohu povolíš později. Můžeš pokračovat.");
      setBusy(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        markGpsOk();
        finish();
      },
      () => {
        setError("Bez polohy ti neukážeme nejbližší slunečnice. Povolit můžeš i později.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "min(460px, 100%)" }} className="anim-slideup">
        {/* progress bars */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {(["start", "name", "gps"] as Step[]).map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 999,
                background: ["start", "name", "gps"].indexOf(step) >= i ? "var(--text)" : "#e2ddc9",
              }}
            />
          ))}
        </div>

        {step === "start" && (
          <div>
            <div className="type-label" style={{ color: "var(--muted)" }}>Kolektivní sázení ve městě</div>
            <h1 className="type-xl" style={{ marginTop: 6 }}>Slunečnice</h1>
            <div className="bar bar-sun" style={{ margin: "18px 0", maxWidth: 100 }} />
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 14 }}>
              {[
                ["1", "Najdi nejbližší slunečnici", "Mapa a seznam ti je seřadí podle vzdálenosti."],
                ["2", "Zalij ji", "Za každou zálivku " + POINTS_WATER + " bodů do žebříčku."],
                ["3", "Vyfoť ji", "Z fotek vzniká její film, jak roste v čase."],
              ].map(([n, t, d]) => (
                <li key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span className="type-md" style={{ minWidth: 34, height: 34, border: "3px solid var(--text)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--sun)" }}>{n}</span>
                  <div>
                    <div className="type-md" style={{ fontSize: 17 }}>{t}</div>
                    <div className="type-body" style={{ color: "var(--muted)" }}>{d}</div>
                  </div>
                </li>
              ))}
            </ol>
            <button className="btn btn-sun" style={{ width: "100%", marginTop: 24 }} onClick={() => setStep("name")}>
              Začít
            </button>
          </div>
        )}

        {step === "name" && (
          <div>
            <div className="type-label" style={{ color: "var(--muted)" }}>Krok 2</div>
            <h1 className="type-lg" style={{ marginTop: 6 }}>Jak ti říkat?</h1>
            <p className="type-body" style={{ marginTop: 8, marginBottom: 16 }}>
              Tvoje přezdívka v žebříčku zahradníků. Připíše se k zálivkám a jménům.
            </p>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="např. Tonda"
              autoFocus
              maxLength={24}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep("gps")}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep("start")}>Zpět</button>
              <button className="btn btn-sun" style={{ flex: 1.4 }} onClick={() => name.trim() ? setStep("gps") : setError("Napiš si přezdívku")}>
                Pokračovat
              </button>
            </div>
            {error && <div className="type-label" style={{ color: "#C0392B", marginTop: 10 }}>{error}</div>}
          </div>
        )}

        {step === "gps" && (
          <div>
            <div className="type-label" style={{ color: "var(--muted)" }}>Krok 3</div>
            <h1 className="type-lg" style={{ marginTop: 6 }}>Povol polohu</h1>
            <p className="type-body" style={{ marginTop: 8, marginBottom: 16 }}>
              Abychom ti na mapě i v seznamu ukázali nejbližší slunečnice. Polohu
              používáme jen ve tvém prohlížeči, nikam ji neukládáme.
            </p>
            {error && (
              <div style={{ border: "3px solid var(--text)", borderRadius: "var(--radius-sm)", padding: 12, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            )}
            <button className="btn btn-sun" style={{ width: "100%" }} onClick={requestGps} disabled={busy}>
              {busy ? "Čekám na povolení…" : "Povolit polohu"}
            </button>
            <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={finish} disabled={busy}>
              {error ? "Pokračovat na mapu" : "Přeskočit"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
