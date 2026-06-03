"use client";
import { GuideLayout, Section, Tip } from "../GuideLayout";

export default function WhatToPackPage() {
  return (
    <GuideLayout
      active="/what-to-pack"
      eyebrow="The Guide"
      title="What to pack"
      intro="The single biggest packing mistake is bringing too much. You'll walk eight to fourteen miles a day in Florida heat — the last thing you want is a heavy bag stuck to your back by noon. Here's what actually earns its place, and what to leave at home."
    >
      <Section heading="The bag itself">
        <p>
          Go small and light. A crossbody bag or hip pack beats a big backpack for most people —
          the more space you carry, the more you fill it. If you're travelling with kids and need
          more room, choose a compact backpack with a few organised pockets rather than an oversized
          tote that feels like punishment by lunchtime.
        </p>
      </Section>

      <Section heading="The genuine essentials">
        <p>
          These are the things that quietly make or break a park day:
        </p>
        <ul className="list-none space-y-2 pl-0">
          <li>
            <strong>A portable battery pack.</strong> Your phone is your ticket, your ride pass,
            your camera, and — if you've got Lightning Lane Multi Pass — something you'll check
            constantly. Without a charger it's dead by 2pm. This is the number-one item people wish
            they'd brought.
          </li>
          <li>
            <strong>A refillable water bottle.</strong> Every counter-service spot gives free ice
            water, and there are filling stations throughout the parks. Dehydration is the most
            common reason a day falls apart in summer.
          </li>
          <li>
            <strong>Sunscreen — a stick or travel size.</strong> Reapplying is non-negotiable in
            Florida, and in-park prices are eye-watering. A stick is mess-free for faces and kids.
          </li>
          <li>
            <strong>A hat and cheap sunglasses.</strong> Not your good pair — they're easy to lose
            on a ride or at a snack stop.
          </li>
          <li>
            <strong>Ponchos from home.</strong> Summer storms are daily and brief. A pound-shop
            poncho beats the twelve-dollar one at the gate, and folds away to nothing.
          </li>
          <li>
            <strong>A physical ID and a hard copy of any insurance card.</strong> Systems go down;
            always have a backup that doesn't rely on your phone.
          </li>
        </ul>
      </Section>

      <Section heading="The clever extras">
        <p>
          Less obvious, but trip-improving:
        </p>
        <ul className="list-none space-y-2 pl-0">
          <li>
            <strong>A gallon zip-lock bag.</strong> Keeps phones and wallets dry on water rides like
            Tiana's Bayou Adventure, and doubles as storage for wet swimwear.
          </li>
          <li>
            <strong>Blister tape or moleskin.</strong> Apply to any hot spot on your feet the second
            you feel friction — not after the blister forms. With this much walking, this is the
            difference between a good day and a limping one.
          </li>
          <li>
            <strong>A cooling towel or neck fan.</strong> Genuinely worth it from May through
            October.
          </li>
          <li>
            <strong>A few collapsible take-out containers.</strong> Quick-service spots don't always
            have boxes; handy for late-night leftovers.
          </li>
        </ul>
        <Tip label="The frozen-bottle trick">
          Freeze a couple of water bottles overnight before a park day. They act as ice packs in
          your bag through the morning and melt into cold drinks by noon — two jobs, no extra weight.
        </Tip>
      </Section>

      <Section heading="What to leave at home">
        <p>
          Most guests wear the same two pairs of shoes the whole trip, so skip the "just in case"
          extras — one supportive pair of trainers and one pair of comfortable sandals is plenty.
          Disney resorts provide soap, shampoo and conditioner, so don't pack full bottles. And you
          need fewer outfits than you think: between the heat, water rides and on-site laundry, pack
          one outfit per park day plus one spare, and plan a mid-trip wash for longer stays rather
          than doubling your luggage.
        </p>
        <p>
          You're allowed to bring your own food and non-alcoholic drinks into the parks (no glass,
          no loose ice, no alcohol), which is a real money-saver — a few snacks in the bag keeps
          everyone going between meals without the queue or the cost.
        </p>
      </Section>
    </GuideLayout>
  );
}
