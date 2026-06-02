// Local "gardener" identity — the player's handle for the leaderboard. Stored
// in localStorage (no accounts). Used to attribute waterings and namings.
const KEY = "slunecnice_gardener";

export function getGardener(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function setGardener(name: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, name.trim());
  } catch {
    /* ignore */
  }
}

// Points model (gamification).
export const POINTS_WATER = 10;
export const POINTS_NAME = 25;

// ── Onboarding flags ──────────────────────────────────────────────────────────
const ONBOARDED = "slunecnice_onboarded_v1";
const CAMERA_OK = "slunecnice_camera_ok";

function get(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function set(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function isOnboarded(): boolean {
  return get(ONBOARDED) === "1";
}
export function markOnboarded(): void {
  set(ONBOARDED, "1");
}
export function cameraPrimed(): boolean {
  return get(CAMERA_OK) === "1";
}
export function markCameraOk(): void {
  set(CAMERA_OK, "1");
}

const GPS_OK = "slunecnice_gps_ok";
export function gpsPrimed(): boolean {
  return get(GPS_OK) === "1";
}
export function markGpsOk(): void {
  set(GPS_OK, "1");
}

// ── Per-plant-per-user watering cooldown ──────────────────────────────────────
// A gardener can water a given flower again every WATER_COOLDOWN_MIN minutes,
// but can immediately water OTHER flowers, and other people can water the same
// flower. Tracked per device in localStorage as { spotId: timestamp }.
export const WATER_COOLDOWN_MIN = 10;
const LAST_WATER = "slunecnice_last_water_v2";

function readWaterMap(): Record<string, number> {
  const v = get(LAST_WATER);
  if (!v) return {};
  try {
    const m = JSON.parse(v);
    return m && typeof m === "object" ? m : {};
  } catch {
    return {};
  }
}

export function markWatered(spotId: string, ts = Date.now()): void {
  const m = readWaterMap();
  m[spotId] = ts;
  set(LAST_WATER, JSON.stringify(m));
}

export function waterCooldownLeftMs(spotId: string): number {
  const last = readWaterMap()[spotId];
  if (!last) return 0;
  return Math.max(0, last + WATER_COOLDOWN_MIN * 60000 - Date.now());
}
