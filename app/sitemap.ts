import type { MetadataRoute } from "next";
import { fetchSpots } from "@/lib/data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://slunecnice.vercel.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/o-projektu`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/zebricek`, changeFrequency: "daily", priority: 0.6 },
  ];

  try {
    const spots = await fetchSpots();
    const spotPages: MetadataRoute.Sitemap = spots.map((s) => ({
      url: `${SITE_URL}/misto/${s.id}`,
      lastModified: s.updated_at,
      changeFrequency: "daily",
      priority: 0.5,
    }));
    return [...staticPages, ...spotPages];
  } catch {
    return staticPages;
  }
}
