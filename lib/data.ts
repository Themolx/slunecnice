import { supabase, PHOTO_BUCKET } from "./supabase";
import type { Spot, Sunflower, Watering, SpotKind, SpotStatus, WaterType } from "./supabase";

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function fetchSpots(kind?: SpotKind): Promise<Spot[]> {
  let q = supabase.from("spots").select("*").order("created_at", { ascending: false });
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Spot[];
}

export async function fetchSpot(id: string): Promise<Spot | null> {
  const { data, error } = await supabase.from("spots").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Spot) ?? null;
}

export async function fetchSunflowers(spotId: string): Promise<Sunflower[]> {
  const { data, error } = await supabase
    .from("sunflowers")
    .select("*")
    .eq("spot_id", spotId)
    .order("index");
  if (error) throw error;
  return (data ?? []) as Sunflower[];
}

export async function fetchWaterings(spotId: string): Promise<Watering[]> {
  const { data, error } = await supabase
    .from("waterings")
    .select("*")
    .eq("spot_id", spotId)
    .eq("hidden", false)
    .order("watered_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Watering[];
}

// Latest watering timestamp per spot, for the dryness indicator on the map.
export async function fetchLastWateredMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("waterings")
    .select("spot_id, watered_at")
    .eq("hidden", false)
    .order("watered_at", { ascending: false });
  if (error) throw error;
  const m = new Map<string, string>();
  for (const row of data ?? []) {
    if (!m.has(row.spot_id)) m.set(row.spot_id, row.watered_at);
  }
  return m;
}

// Named-count per spot, for the public map / list ("8 z 12 pojmenováno").
export async function fetchNamedCounts(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("sunflowers")
    .select("spot_id, name")
    .eq("hidden", false);
  if (error) throw error;
  const m = new Map<string, number>();
  for (const row of data ?? []) {
    if (row.name && row.name.trim()) m.set(row.spot_id, (m.get(row.spot_id) ?? 0) + 1);
  }
  return m;
}

// ─── Writes (crew) ─────────────────────────────────────────────────────────────

export interface NewSpotInput {
  kind: SpotKind;
  name: string;
  lat: number;
  lon: number;
  status?: SpotStatus;
  water_type?: WaterType | null;
  sunflower_count?: number;
  notes?: string;
  photo_paths?: string[];
  created_by?: string;
}

export async function createSpot(input: NewSpotInput): Promise<Spot> {
  const { data, error } = await supabase
    .from("spots")
    .insert({
      kind: input.kind,
      name: input.name || null,
      lat: input.lat,
      lon: input.lon,
      status: input.status ?? (input.kind === "water" ? "vhodne" : "navrzeno"),
      water_type: input.water_type ?? null,
      sunflower_count: input.sunflower_count ?? 0,
      notes: input.notes || null,
      photo_paths: input.photo_paths ?? [],
      created_by: input.created_by || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Spot;
}

export async function updateSpot(id: string, patch: Partial<Spot>): Promise<void> {
  const { error } = await supabase.from("spots").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteSpot(id: string): Promise<void> {
  const { error } = await supabase.from("spots").delete().eq("id", id);
  if (error) throw error;
}

// Plant: set count, mark zasazeno, generate the sunflower slots.
export async function logPlanting(spotId: string, count: number): Promise<void> {
  const { error: updErr } = await supabase
    .from("spots")
    .update({ sunflower_count: count, status: "zasazeno" })
    .eq("id", spotId);
  if (updErr) throw updErr;
  const { error: rpcErr } = await supabase.rpc("ensure_sunflower_slots", {
    p_spot: spotId,
    p_count: count,
  });
  if (rpcErr) throw rpcErr;
}

// ─── Writes (public) ───────────────────────────────────────────────────────────

export async function logWatering(input: {
  spot_id: string;
  sunflower_id?: string | null;
  watered_by?: string;
  note?: string;
  photo_path?: string | null;
}): Promise<Watering> {
  const { data, error } = await supabase
    .from("waterings")
    .insert({
      spot_id: input.spot_id,
      sunflower_id: input.sunflower_id || null,
      watered_by: input.watered_by || null,
      note: input.note || null,
      photo_path: input.photo_path || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Watering;
}

// The "film" of one sunflower: its watering photos, oldest first.
export interface Frame {
  photo_path: string;
  watered_at: string;
  watered_by: string | null;
}

export async function fetchSunflowerFrames(sunflowerId: string): Promise<Frame[]> {
  const { data, error } = await supabase
    .from("waterings")
    .select("photo_path, watered_at, watered_by")
    .eq("sunflower_id", sunflowerId)
    .eq("hidden", false)
    .not("photo_path", "is", null)
    .order("watered_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Frame[];
}

// One flower per spot: the film is the spot's watering photos, oldest first.
export async function fetchSpotFrames(spotId: string): Promise<Frame[]> {
  const { data, error } = await supabase
    .from("waterings")
    .select("photo_path, watered_at, watered_by")
    .eq("spot_id", spotId)
    .eq("hidden", false)
    .not("photo_path", "is", null)
    .order("watered_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Frame[];
}

// Claim (name) one unnamed sunflower at a spot. Returns the named row, or null
// if none were free.
export async function nameSunflower(input: {
  spot_id: string;
  name: string;
  message?: string;
  named_by?: string;
  web_consent?: boolean;
  photo_path?: string | null;
  watering_id?: string | null;
}): Promise<Sunflower | null> {
  // Find the lowest-index unnamed, non-hidden slot.
  const { data: free, error: findErr } = await supabase
    .from("sunflowers")
    .select("*")
    .eq("spot_id", input.spot_id)
    .is("name", null)
    .eq("hidden", false)
    .order("index")
    .limit(1)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!free) return null;

  const { data, error } = await supabase
    .from("sunflowers")
    .update({
      name: input.name,
      message: input.message || null,
      named_by: input.named_by || null,
      web_consent: input.web_consent ?? false,
      photo_path: input.photo_path || null,
      named_at: new Date().toISOString(),
    })
    .eq("id", (free as Sunflower).id)
    .is("name", null) // guard against a race: only if still unnamed
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) return nameSunflower(input); // someone grabbed it first — retry
  return data as Sunflower;
}

// Name one specific sunflower by id (used by the slot-grid picker). Guarded so
// it only succeeds if the slot is still unnamed.
export async function nameSunflowerById(input: {
  sunflower_id: string;
  name: string;
  message?: string;
  named_by?: string;
  web_consent?: boolean;
  photo_path?: string | null;
}): Promise<Sunflower | null> {
  const { data, error } = await supabase
    .from("sunflowers")
    .update({
      name: input.name,
      message: input.message || null,
      named_by: input.named_by || null,
      web_consent: input.web_consent ?? false,
      photo_path: input.photo_path || null,
      named_at: new Date().toISOString(),
    })
    .eq("id", input.sunflower_id)
    .is("name", null)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data as Sunflower) ?? null;
}

// ─── Photo upload ──────────────────────────────────────────────────────────────

export async function uploadPhoto(file: File, prefix: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  return uploadBlob(file, prefix, ext);
}

// Upload a raw Blob (e.g. a camera capture) to the photo bucket.
export async function uploadBlob(blob: Blob, prefix: string, ext = "jpg"): Promise<string> {
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, {
    cacheControl: "3600",
    upsert: false,
    contentType: blob.type || "image/jpeg",
  });
  if (error) throw error;
  return path;
}

// ─── Stats ──────────────────────────────────────────────────────────────────────

export interface Stats {
  plantingSpots: number;
  waterSpots: number;
  totalSunflowers: number; // one flower per spot => same as plantingSpots
  totalWaterings: number;
  weeklyWaterings: number;
}

export async function fetchStats(): Promise<Stats> {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const [spotsRes, waterCount, weekCount] = await Promise.all([
    supabase.from("spots").select("kind"),
    supabase.from("waterings").select("id", { count: "exact", head: true }).eq("hidden", false),
    supabase.from("waterings").select("id", { count: "exact", head: true }).eq("hidden", false).gte("watered_at", weekAgo),
  ]);
  const spots = (spotsRes.data ?? []) as { kind: SpotKind }[];
  const planting = spots.filter((s) => s.kind === "planting").length;
  return {
    plantingSpots: planting,
    waterSpots: spots.filter((s) => s.kind === "water").length,
    totalSunflowers: planting,
    totalWaterings: waterCount.count ?? 0,
    weeklyWaterings: weekCount.count ?? 0,
  };
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface GardenerScore {
  name: string;
  waterings: number;
  score: number;
}

const PTS_WATER = 10;

export async function fetchLeaderboard(): Promise<GardenerScore[]> {
  const { data, error } = await supabase
    .from("waterings")
    .select("watered_by")
    .eq("hidden", false)
    .not("watered_by", "is", null);
  if (error) throw error;

  const map = new Map<string, number>();
  for (const r of data ?? []) {
    const n = (r.watered_by ?? "").trim();
    if (!n) continue;
    map.set(n, (map.get(n) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, waterings]) => ({ name, waterings, score: waterings * PTS_WATER }))
    .sort((a, b) => b.score - a.score);
}
