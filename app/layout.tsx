import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slunečnice — kolektivní sázení ve městě",
  description:
    "Kolektivní guerillové sázení slunečnic ve městě. Živá mapa zasazených slunečnic, zdrojů vody a péče.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
