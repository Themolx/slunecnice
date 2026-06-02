import type { MetadataRoute } from "next";
import { fetchSpots } from "@/lib/data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://slunecnice.vercel.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/o-projektu`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/zebricek`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
  ];

  try {
    const spots = await fetchSpots();
    const spotPages: MetadataRoute.Sitemap = spots.map((s) => ({
      url: `${SITE_URL}/misto/${s.id}`,
      // Normalize to clean ISO (millisecond precision, Z) — Postgres timestamptz
      // carries microseconds which some sitemap parsers reject.
      lastModified: new Date(s.updated_at),
      changeFrequency: "daily",
      priority: 0.5,
    }));
    return [...staticPages, ...spotPages];
  } catch {
    return staticPages;
  }
}
