import { notFound } from "next/navigation";

// Gate the crew app. The token is a server-only secret in SCOUT_TOKEN (this
// module is only imported by server components, so it never reaches the client
// bundle). NEXT_PUBLIC_SCOUT_TOKEN is kept as a transitional fallback.
// This is a soft gate (URL knowledge), not real auth — fine for a small crew.
export function assertScoutToken(token: string): void {
  const expected = process.env.SCOUT_TOKEN || process.env.NEXT_PUBLIC_SCOUT_TOKEN;
  if (!expected || token !== expected) notFound();
}
