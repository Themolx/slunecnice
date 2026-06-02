import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Slunečnice — guerilla slunečnice v Praze a na Palmovce";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT = (w: 700 | 900) =>
  fetch(`https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-ext-${w}-normal.woff`).then((r) =>
    r.arrayBuffer()
  );

export default async function OpengraphImage() {
  const [bold, black] = await Promise.all([FONT(700), FONT(900)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FFFDF5",
          padding: 70,
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ width: 92, height: 92, borderRadius: 22, background: "#F5C518", border: "6px solid #161410" }} />
          <div style={{ fontSize: 32, fontWeight: 700, color: "#161410", letterSpacing: 2 }}>
            KOLEKTIVNÍ SÁZENÍ VE MĚSTĚ
          </div>
        </div>

        <div style={{ fontSize: 150, fontWeight: 900, color: "#161410", lineHeight: 1, letterSpacing: -3 }}>
          SLUNEČNICE
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: "#1E7A3D" }}>
            guerilla · Praha · Palmovka
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#8A8472" }}>slunecnice.vercel.app</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: bold, weight: 700, style: "normal" },
        { name: "Inter", data: black, weight: 900, style: "normal" },
      ],
    }
  );
}
