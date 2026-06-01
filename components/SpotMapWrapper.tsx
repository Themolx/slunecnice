"use client";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type SpotMap from "./SpotMap";

const Map = dynamic(() => import("./SpotMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#efece2",
        color: "var(--muted)",
      }}
      className="type-label"
    >
      Načítám mapu…
    </div>
  ),
});

export default function SpotMapWrapper(props: ComponentProps<typeof SpotMap>) {
  return <Map {...props} />;
}
