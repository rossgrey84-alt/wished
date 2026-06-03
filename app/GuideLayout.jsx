"use client";
import SiteHeader from "./SiteHeader";
import Link from "next/link";

export function GuideLayout({ active, eyebrow, title, intro, children }) {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "linear-gradient(180deg, #f4f1ea 0%, #ebe5d8 100%)",
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <SiteHeader active={active} />

        <div className="mb-12">
          <div
            className="text-xs tracking-[0.3em] uppercase mb-4"
            style={{ fontFamily: "Helvetica, Arial, sans-serif", color: "#9a7b2e" }}
          >
            {eyebrow}
          </div>
          <h1 className="text-4xl md:text-5xl text-stone-900 font-normal italic mb-6 leading-tight">
            {title}
          </h1>
          <p className="text-lg text-stone-700 leading-relaxed max-w-2xl">{intro}</p>
        </div>

        <div className="space-y-12">{children}</div>

        <div className="mt-16 pt-10 border-t border-stone-300">
          <Link href="/" style={{ textDecoration: "none" }}>
            <span
              className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase transition-colors"
              style={{ fontFamily: "Helvetica, Arial, sans-serif", color: "#9a7b2e" }}
            >
              ← Build your plan with Wished
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Section({ heading, children }) {
  return (
    <section>
      <h2
        className="text-2xl text-stone-900 italic mb-4 leading-tight"
        style={{ fontFamily: "Georgia, serif" }}
      >
        {heading}
      </h2>
      <div className="space-y-4 text-stone-700 leading-relaxed">{children}</div>
    </section>
  );
}

export function Tip({ label, children }) {
  return (
    <div className="p-4 bg-stone-100/70" style={{ borderLeft: "2px solid #9a7b2e" }}>
      <div
        className="text-xs tracking-[0.2em] uppercase mb-1.5"
        style={{ fontFamily: "Helvetica, Arial, sans-serif", color: "#9a7b2e" }}
      >
        {label || "Insider tip"}
      </div>
      <div className="text-stone-700 leading-relaxed text-sm" style={{ fontStyle: "italic" }}>
        {children}
      </div>
    </div>
  );
}
