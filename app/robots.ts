import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Explicitly welcome AI / answer-engine crawlers (GEO/AEO): they must not be
// blocked to be cited by ChatGPT, Claude, Perplexity, Google AI Overviews, etc.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "Meta-ExternalAgent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/scout/"] },
      ...AI_BOTS.map((bot) => ({ userAgent: bot, allow: "/", disallow: ["/scout/"] })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
