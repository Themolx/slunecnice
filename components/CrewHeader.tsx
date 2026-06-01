import Link from "next/link";

export default function CrewHeader({
  token,
  title,
  back,
}: {
  token: string;
  title: string;
  back?: boolean;
}) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--text)",
        color: "var(--bg)",
        padding: "12px 16px",
        borderBottom: "4px solid var(--sun)",
      }}
    >
      <Link
        href={back ? `/scout/${token}` : "/scout/" + token}
        className="type-label"
        style={{ color: "var(--sun)", textDecoration: "none" }}
      >
        {back ? "← Zahradníci" : "Zahradníci"}
      </Link>
      <h1 className="type-md" style={{ marginTop: 4 }}>
        {title}
      </h1>
    </header>
  );
}
