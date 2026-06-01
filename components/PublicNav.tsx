import Link from "next/link";
import HowToLink from "./HowToLink";

export default function PublicNav() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--bg)",
        borderBottom: "3px solid var(--text)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "12px 18px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", color: "var(--text)" }}>
          <span
            className="type-md"
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <span aria-hidden></span> Slunečnice
          </span>
        </Link>
        <nav style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <Link href="/" className="nav-link">
            Mapa
          </Link>
          <Link href="/zebricek" className="nav-link">
            Žebříček
          </Link>
          <HowToLink />
          <Link href="/o-projektu" className="nav-link">
            O projektu
          </Link>
        </nav>
      </div>
    </header>
  );
}
