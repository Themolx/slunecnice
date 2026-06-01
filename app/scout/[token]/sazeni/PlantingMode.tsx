"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logPlanting } from "@/lib/data";
import { STATUS_LABELS, type Spot } from "@/lib/supabase";

export default function PlantingMode({ token, spots }: { token: string; spots: Spot[] }) {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plant = async (id: string) => {
    const n = parseInt(counts[id] ?? "");
    if (!n || n < 1) {
      setError("Zadej počet u tohoto místa");
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await logPlanting(id, n);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sázení selhalo");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ padding: 12, maxWidth: 620, margin: "0 auto", paddingBottom: 40 }}>
      <p className="type-body" style={{ margin: "6px 4px 16px", color: "var(--muted)" }}>
        Vyber místo a zadej, kolik slunečnic jste zasadili. Tím se vytvoří sloty,
        které pak veřejnost pojmenuje.
      </p>

      <Link href={`/scout/${token}/novy`} className="btn btn-sun" style={{ width: "100%", marginBottom: 16 }}>
        + Nové místo k sázení
      </Link>

      {error && (
        <div style={{ border: "3px solid #C0392B", color: "#C0392B", borderRadius: 0, padding: 12, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        {spots.length === 0 && (
          <div className="type-body" style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}>
            Žádná místa k sázení. Přidej první.
          </div>
        )}
        {spots.map((s) => (
          <div key={s.id} className="card" style={{ padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/scout/${token}/${s.id}`} className="type-md" style={{ fontSize: 17, textDecoration: "none", color: "var(--text)" }}>
                  {s.name || "Bez názvu"}
                </Link>
                <div className="type-label" style={{ color: "var(--muted)", marginTop: 2 }}>
                  {STATUS_LABELS[s.status]} · zatím {s.sunflower_count} ks
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input
                className="field"
                inputMode="numeric"
                style={{ flex: 1 }}
                placeholder="počet"
                value={counts[s.id] ?? ""}
                onChange={(e) => setCounts((c) => ({ ...c, [s.id]: e.target.value.replace(/[^0-9]/g, "") }))}
              />
              <button className="btn btn-ink" style={{ flex: "0 0 auto" }} onClick={() => plant(s.id)} disabled={busyId === s.id}>
                {busyId === s.id ? "…" : "Zasadit"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
