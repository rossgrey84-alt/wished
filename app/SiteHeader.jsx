"use client";
import Link from "next/link";

export default function SiteHeader({ active }) {
  const links = [
    { href: "/", label: "Planner" },
    { href: "/guides", label: "Guides" },
    { href: "/about", label: "About" },
  ];
  return (
    <header className="mb-12">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <Link href="/" style={{ textDecoration: "none" }}>
          <div
            className="text-sm tracking-[0.25em] uppercase"
            style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 500, color: "#9a7b2e" }}
          >
            Wished
          </div>
        </Link>
        <nav className="flex items-center gap-5 flex-wrap">
          {links.map((l) => (
            <Link key={l.href} href={l.href} style={{ textDecoration: "none" }}>
              <span
                className="text-xs tracking-[0.18em] uppercase transition-colors"
                style={{
                  fontFamily: "Helvetica, Arial, sans-serif",
                  color: active === l.href ? "#9a7b2e" : "#78716c",
                  borderBottom: active === l.href ? "1px solid #9a7b2e" : "1px solid transparent",
                  paddingBottom: "2px",
                }}
              >
                {l.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="h-px bg-stone-400/40 w-full"></div>
    </header>
  );
}
