import { notFound } from "next/navigation";

// Gate the crew app. The token is a shared secret in NEXT_PUBLIC_SCOUT_TOKEN.
// This is a soft gate (URL knowledge), not real auth — fine for a small crew.
export function assertScoutToken(token: string): void {
  const expected = process.env.NEXT_PUBLIC_SCOUT_TOKEN;
  if (!expected || token !== expected) notFound();
}
