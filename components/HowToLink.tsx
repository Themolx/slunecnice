"use client";

export default function HowToLink() {
  return (
    <button
      className="nav-link"
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      onClick={() => window.dispatchEvent(new Event("slunecnice:onboarding"))}
    >
      Jak na to
    </button>
  );
}
