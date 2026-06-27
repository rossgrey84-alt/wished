"use client";
import { GuideLayout } from "../GuideLayout";

export default function AboutPage() {
  return (
    <GuideLayout
      active="/about"
      eyebrow="About"
      title="Why I built Wished"
      intro="I lead a busy life — I run the European side of a software company, and most days move fast. Disney World is the thing that pulls me out of all that. It's my own little bubble."
    >
      <figure className="mx-auto max-w-xs sm:max-w-sm">
        <img
          src="/about-castle.jpg"
          alt="Me and my wife under the castle archway at Magic Kingdom"
          loading="lazy"
          className="w-full rounded-lg"
          style={{ border: "1px solid rgba(120,113,108,0.25)" }}
        />
        <figcaption
          className="mt-2 text-center text-xs tracking-[0.18em] uppercase"
          style={{ fontFamily: "Helvetica, Arial, sans-serif", color: "#9a7b2e" }}
        >
          Under the castle, Magic Kingdom
        </figcaption>
      </figure>

      <div className="space-y-5 text-lg text-stone-700 leading-relaxed">
        <p>
          I first went when I was 14, with my Dad, and caught the bug right there and then. My wife
          and I spent our honeymoon there over 15 years ago. And for the last six years we've taken
          our own kids — now 17 and 14 — back again and again. My sister's the real fanatic: three
          trips a year, every year, for the last decade. Between us there's a permanent
          back-and-forth of hints, tips and &ldquo;next time we should&hellip;&rdquo; stories.
        </p>
        <p className="italic text-stone-800">
          Disney World isn't for everyone. But the fact you've made it here suggests it might be for
          you.
        </p>
        <p>
          Here's what I kept coming back to. There are things I wish I'd known before I went —
          especially that first time. The small decisions that quietly make or break a day, the ones
          nobody hands you up front. You learn them trip by trip, usually the hard way. That's where
          Wished came from, and the name is the whole idea: the stuff you'll wish you'd known, given
          to you <em>before</em> you go instead of after.
        </p>
        <p>
          The parks change. Rides come and go, the apps get updated, the queues shift. But one thing
          doesn't — you need to go with a plan. Not so rigid you can't enjoy it; half the magic is in
          the moments you didn't schedule. Just rigid enough to give you the best chance of the best
          time.
        </p>
        <p>That's all Wished is. The plan I wish I'd had.</p>
        <p
          className="text-sm tracking-[0.18em] uppercase pt-2"
          style={{ fontFamily: "Helvetica, Arial, sans-serif", color: "#9a7b2e" }}
        >
          — Ross
        </p>
      </div>
    </GuideLayout>
  );
}
