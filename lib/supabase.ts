import { createClient } from "@supabase/supabase-js";

// Při buildu Vercel volá moduly před načtením env vars. Placeholder URL
// umožní createClient() neselhat při importu — skutečné requesty proběhnou
// až za běhu, kdy už proměnné jsou.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY není nastaveno — používám placeholder, requesty selžou."
  );
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
});

export const PHOTO_BUCKET = "slunecnice-photos";

export function photoUrl(path: string): string {
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

// On-the-fly thumbnail (Imgproxy) — drasticky zkrátí stahování ve feedech.
export function photoThumb(path: string, width: number, quality = 70): string {
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path, {
    transform: { width, quality, resize: "contain" },
  }).data.publicUrl;
}

// ─── Domain types ────────────────────────────────────────────────────────────

export type SpotKind = "planting" | "water";

export type SpotStatus =
  | "navrzeno"   // proposed / scouted
  | "vhodne"     // suitable
  | "zasazeno"   // planted
  | "kvete"      // blooming
  | "zaniklo";   // gone

export type WaterType = "tap" | "fountain" | "stream";

export interface Spot {
  id: string;
  kind: SpotKind;
  name: string | null;
  lat: number;
  lon: number;
  status: SpotStatus;
  water_type: WaterType | null;
  sunflower_count: number;
  notes: string | null;
  photo_paths: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sunflower {
  id: string;
  spot_id: string;
  index: number;
  name: string | null;
  message: string | null;
  named_by: string | null;
  web_consent: boolean;
  photo_path: string | null;
  named_at: string | null;
  hidden: boolean;
}

export interface Watering {
  id: string;
  spot_id: string;
  sunflower_id: string | null;
  watered_by: string | null;
  note: string | null;
  photo_path: string | null;
  watered_at: string;
  hidden: boolean;
}

// ─── Display helpers ─────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<SpotStatus, string> = {
  navrzeno: "Navrženo",
  vhodne: "Vhodné",
  zasazeno: "Zasazeno",
  kvete: "Kvete",
  zaniklo: "Zaniklo",
};

export const STATUS_COLORS: Record<SpotStatus, string> = {
  navrzeno: "#8A8472",
  vhodne: "#6B4E2E",
  zasazeno: "#F5C518",
  kvete: "#E0A800",
  zaniklo: "#C0C0C0",
};

export const WATER_LABELS: Record<WaterType, string> = {
  tap: "Kohoutek",
  fountain: "Pítko / kašna",
  stream: "Potok / řeka",
};

export const SUN_COLOR = "#F5C518";
export const LEAF_COLOR = "#1E7A3D";

// How close (metres) you must physically be to water a spot. City GPS is rough,
// so keep this generous.
export const WATERING_RADIUS_M = 80;

// Master switch for the physical-proximity gate. Set to false to let anyone
// water from anywhere (handy for testing / demos). Flip back to true for prod.
export const GPS_VERIFY = false;

// A flower that was watered in the last N hours doesn't need more water — block
// re-watering so points can't be farmed by spamming one spot.
export const WATERING_COOLDOWN_H = 20;

// Haversine distance in metres.
export function distanceMetres(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Days since an ISO timestamp (floored). Returns null if no timestamp.
export function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / 86400000);
}

// Hours since an ISO timestamp. Returns null if no timestamp.
export function hoursSince(iso: string | null): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}

// Czech plural for "N days" (1 den, 2-4 dny, 5+ dní).
export function czDays(days: number): string {
  const unit = days === 1 ? "den" : days >= 2 && days <= 4 ? "dny" : "dní";
  return `${days} ${unit}`;
}

// Czech relative "N days ago" with correct grammar.
export function czDaysAgo(days: number | null): string {
  if (days === null) return "ještě nezaléváno";
  if (days === 0) return "dnes";
  if (days === 1) return "včera";
  return `před ${czDays(days)}`;
}

// "Dryness" color: greener when freshly watered, warmer/redder the longer dry.
export function drynessColor(days: number | null): string {
  if (days === null) return "#C0C0C0";      // never watered
  if (days <= 1) return "#1E7A3D";           // fresh — green
  if (days <= 3) return "#7FB800";           // ok — lime
  if (days <= 6) return "#F5C518";           // getting dry — yellow
  if (days <= 10) return "#E67E22";          // dry — orange
  return "#C0392B";                          // very dry — red
}
