"use client";
import { GuideLayout, Section, Tip } from "../GuideLayout";

export default function LightningLanePage() {
  return (
    <GuideLayout
      active="/lightning-lane"
      eyebrow="The Guide"
      title="Getting the most out of Lightning Lane"
      intro="Disney's paid line-skip system is where first-timers waste the most money — and where a little strategy saves the most time. Here's how Multi Pass and Single Pass actually work, and how to use them so they're worth it."
    >
      <Section heading="Multi Pass vs Single Pass — the basics">
        <p>
          There are two things people lump together as "Lightning Lane." <strong>Multi Pass</strong>{" "}
          is the bundle: you pay one price per day and reserve a set of rides, starting with up to
          three and booking more as the day goes on. <strong>Single Pass</strong> is à la carte —
          you buy individual access to the very top headliners that aren't included in Multi Pass
          (think Seven Dwarfs Mine Train, TRON, Guardians of the Galaxy: Cosmic Rewind, Rise of the
          Resistance, Flight of Passage).
        </p>
        <p>
          You don't always need either. But on a busy day at the right park, Multi Pass is the
          difference between riding eight things and riding three.
        </p>
      </Section>

      <Section heading="The one move that matters most">
        <p>
          The system is built around a rolling-booking mechanic that most people never exploit. You
          start with three reservations. The moment you tap into your first ride, you can book a
          fourth — and then another each time you redeem one. Until you tap in, you're stuck on just
          those first three.
        </p>
        <Tip label="Tap in early, then keep modifying">
          Book your first Multi Pass ride for as early as possible and tap in the moment your window
          opens — that starts the rolling clock. From then on, you can keep changing any booked
          slot to a better ride as availability shifts, without resetting anything. Book the easiest
          available ride just to get the clock going, then trade up. Refreshing the app through the
          day is how people snag Seven Dwarfs at 2pm.
        </Tip>
      </Section>

      <Section heading="Booking windows — resort guests get a head start">
        <p>
          Staying on Disney property lets you book your first Multi Pass selections seven days before
          check-in, covering your whole trip in one go. Everyone else books three days before each
          park day. That head start genuinely matters for the rides that sell out fastest, so if
          you're on-site, be ready the morning your window opens.
        </p>
      </Section>

      <Section heading="Is it worth it, park by park">
        <p>
          <strong>Magic Kingdom</strong> — the park where Multi Pass is most worth it, almost any
          day. It's big, ride-dense, and the standby lines are long. Build your day around park flow:
          stay on the Adventureland / Frontierland / Liberty Square / Fantasyland side through the
          morning, then shift to Tomorrowland. A common plan: Tier 1 pick like Peter Pan's Flight or
          Tiana's Bayou Adventure, a Tier 2 like Haunted Mansion or Pirates, and Seven Dwarfs as a
          Single Pass if it's a must-do.
        </p>
        <p>
          <strong>Hollywood Studios</strong> — the highest-pressure park. Miss your windows and the
          day unravels, because nearly everything is a headliner with a brutal standby. This is where
          tapping in early and adjusting in real time matters most. Don't just grab the earliest
          return (usually Star Tours) — hold out for Tower of Terror or Toy Story Mania.
        </p>
        <p>
          <strong>EPCOT</strong> — the one where you can have a wonderful day and barely ride
          anything. Multi Pass is the least necessary here, but Guardians of the Galaxy: Cosmic
          Rewind as a Single Pass is the near-universal must-buy. If you do get Multi Pass, Remy's
          Ratatouille or Test Track is the Tier 1 pick.
        </p>
        <p>
          <strong>Animal Kingdom</strong> — usually the easiest to skip Multi Pass, with one big
          exception: Flight of Passage builds the longest wait in all of Disney World. Rope drop it
          or buy the Single Pass.
        </p>
      </Section>

      <Section heading="The most common mistakes">
        <p>
          Using Lightning Lanes randomly instead of building around park flow. Booking a midday
          sit-down lunch that eats your prime ride hours. Buying Multi Pass for a half-day or
          evening-only visit, where it can't pay for itself. And grabbing the first return time
          offered rather than the one that actually fits where you'll be.
        </p>
        <Tip label="Don't pay for a partial day">
          On an arrival day when you've only got an evening in the park, skip Multi Pass entirely.
          Do a couple of headliners on standby, or buy a single Single Pass for the one ride you
          can't miss. A few hours can't justify the day-rate.
        </Tip>
      </Section>
    </GuideLayout>
  );
}
