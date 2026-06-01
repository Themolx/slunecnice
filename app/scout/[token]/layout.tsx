import { assertScoutToken } from "@/lib/auth";

export const metadata = { title: "Slunečnice — zahradníci" };

export default async function ScoutLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  assertScoutToken(token);
  return <>{children}</>;
}
