"use client";
import { GuideLayout, Section, Tip } from "../GuideLayout";

export default function FireworksPage() {
  return (
    <GuideLayout
      active="/fireworks"
      eyebrow="The Guide"
      title="Where to watch the fireworks"
      intro="Everyone packs onto Main Street 45 minutes early and ends up craning over phones. There are better spots — some inside the parks, some you don't even need a ticket for. Here's where the people who've been many times actually stand."
    >
      <Section heading="Magic Kingdom — Happily Ever After">
        <p>
          The show now projects down the length of Main Street, U.S.A., so the front-of-castle hub
          gives you the full experience — fireworks plus projections. The catch is that the prime
          hub spots fill up well over an hour before showtime, and on busy nights there isn't enough
          room for everyone who wants in.
        </p>
        <p>
          If it's your first time and you want the complete projection effect, claim a spot on the
          hub grass near Casey's Corner around an hour out. If you've seen it once already, the
          smarter move is behind the castle in Fantasyland, near the Prince Charming Regal Carousel —
          a calmer, genuinely lovely angle on the show that most people never think to use, and steps
          from Seven Dwarfs Mine Train for a near-walk-on straight after.
        </p>
        <Tip label="Skip the crowd entirely">
          Three Magic Kingdom resorts have open viewing of the fireworks with no park ticket needed:
          the marina by Gasparilla Island Grill at the Grand Floridian, the fourth-floor observation
          deck at the Contemporary, and the Polynesian beachfront (usually resort-guests only). You
          miss the projections and soundtrack, but you skip the chaos completely.
        </Tip>
      </Section>

      <Section heading="EPCOT — Luminous: The Symphony of Us">
        <p>
          EPCOT's show is staged low around the World Showcase Lagoon, so unlike Magic Kingdom it's
          hard to catch from neighbouring resorts. The upside: with the entire lagoon to spread out
          around, crowds are far more forgiving than the Magic Kingdom hub. Anywhere on the promenade
          with a clear water view works.
        </p>
        <p>
          The bridge connecting EPCOT's International Gateway entrance to Disney's BoardWalk gives a
          solid free view of the fireworks portion — grab a spot 20-30 minutes ahead. Inside the
          park, the stretch between the United Kingdom and Canada pavilions is a reliable, less-mobbed
          choice.
        </p>
      </Section>

      <Section heading="Hollywood Studios & Animal Kingdom">
        <p>
          Hollywood Studios runs Fantasmic! — a stadium show rather than a fireworks spectacular, so
          arrive 45 minutes early for a seat, or look for the dining packages that include reserved
          seating. Animal Kingdom doesn't do a nighttime fireworks show; the park is built around
          early closes, so plan your evenings elsewhere.
        </p>
      </Section>

      <Section heading="Timing and weather">
        <p>
          The shows run nightly but can be delayed or cancelled in storms — common on summer
          evenings. Don't panic if it's drizzling at 8pm; Florida storms usually pass fast, and a
          delayed show often means a thinner crowd. On party nights (the Halloween and Christmas
          events) the regular show is replaced by a special one and the park closes early to
          non-party guests, so check the calendar if a particular show matters to you.
        </p>
        <Tip label="The repeat-night trick">
          On the night you most want to ride rather than watch, use the show as your window: when the
          fireworks start, standby waits on the big rides collapse because everyone's looking up. See
          the show properly once, then ride during it on another night.
        </Tip>
      </Section>
    </GuideLayout>
  );
}
