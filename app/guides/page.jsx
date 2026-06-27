"use client";
import { GuideLayout } from "../GuideLayout";
import Link from "next/link";

const guides = [
  {
    href: "/split-your-day",
    title: "Why we split every park day into three",
    blurb:
      "The rhythm that saves your week — morning, a midday break, then the evening. Especially in the August heat.",
  },
  {
    href: "/quick-service-dining",
    title: "Getting the most out of your quick service dining plan",
    blurb:
      "The park-by-park bench of where to eat, and how to spend your credits so you're not throwing money away.",
  },
  {
    href: "/what-to-pack",
    title: "What to pack",
    blurb:
      "What actually earns its place in your park bag in Florida heat — and what to leave at home.",
  },
  {
    href: "/lightning-lane",
    title: "Lightning Lane, made simple",
    blurb: "When paying to skip the line is worth it, and when it isn't.",
  },
  {
    href: "/fireworks",
    title: "Where to watch the fireworks",
    blurb:
      "The best spots for the nighttime shows — including a few free ones most people never think to use.",
  },
];

export default function GuidesPage() {
  return (
    <GuideLayout
      active="/guides"
      eyebrow="The Guides"
      title="Everything we wish we'd known"
      intro="The hard-won stuff, written down — the decisions, tactics and small habits that quietly make or break a Disney World trip. Read them before you go."
    >
      <div className="space-y-8">
        {guides.map((g) => (
          <Link key={g.href} href={g.href} style={{ textDecoration: "none" }}>
            <div className="group cursor-pointer">
              <h2
                className="text-2xl italic mb-2 leading-tight transition-colors"
                style={{ fontFamily: "Georgia, serif", color: "#1c1917" }}
              >
                {g.title}
              </h2>
              <p className="text-stone-700 leading-relaxed">{g.blurb}</p>
              <span
                className="inline-block mt-2 text-xs tracking-[0.2em] uppercase"
                style={{ fontFamily: "Helvetica, Arial, sans-serif", color: "#9a7b2e" }}
              >
                Read →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </GuideLayout>
  );
}
