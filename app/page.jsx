"use client";
import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Calendar, Users, Sparkles, Hotel, Zap, Clock, Gauge, Compass, RotateCcw, Copy, Printer, Check } from 'lucide-react';
import posthog from 'posthog-js';

// ---- Analytics (PostHog) ----
// Only the named MVP funnel events, fired explicitly through track(). Autocapture, automatic
// pageviews and session recording are all OFF — we send exactly the events we choose, nothing
// else. UTM params + a derived source are registered once as super properties, so every event
// carries them. Persistence is localStorage only (no cookies). Invisible to users.
//
// Requires two Vercel env vars: NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN and NEXT_PUBLIC_POSTHOG_HOST.
// With no token set, track() is a silent no-op — safe in dev.
let phReady = false;
function initAnalytics() {
  if (phReady || typeof window === 'undefined') return;
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';
  if (!token) return;
  try {
    posthog.init(token, {
      api_host: host,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
      disable_session_recording: true,
      persistence: 'localStorage',
    });
    const q = new URLSearchParams(window.location.search);
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => {
      const v = q.get(k); if (v) utm[k] = v;
    });
    let source = utm.utm_source || 'direct';
    try { if (!utm.utm_source && document.referrer) source = new URL(document.referrer).hostname; } catch {}
    posthog.register({ ...utm, source });
    phReady = true;
  } catch { /* never throw from analytics */ }
}
// ---- Shareable plan links ----
// The whole plan is generated from the answers, so we never need a database: we pack the
// answers (and any pinned days) into the URL itself. A shared link reopens the exact same
// plan on any device — no login, no backend, no cost.
function encodePlan(answers, pinnedDays) {
  try {
    const json = JSON.stringify({ v: 1, a: answers, p: pinnedDays || {} });
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch { return ''; }
}
function decodePlan(token) {
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const data = JSON.parse(decodeURIComponent(escape(atob(b64))));
    if (!data || data.v !== 1 || !data.a) return null;
    return { answers: data.a, pinnedDays: data.p || {} };
  } catch { return null; }
}

const STEP_NAMES = {
  1: 'dates', 2: 'party', 3: 'days', 4: 'intensity', 5: 'rhythm',
  6: 'property', 7: 'lightning', 8: 'dining', 9: 'rides', 10: 'extras', 11: 'rest_days', 12: 'water_park',
};
function track(event, properties = {}) {
  if (typeof window === 'undefined') return; // browser only
  try { if (phReady) posthog.capture(event, properties); } catch { /* never throw from analytics */ }
}
function identifyUser(email) {
  if (typeof window === 'undefined') return;
  try { if (phReady) posthog.identify(email); } catch { /* never throw from analytics */ }
}

// ---- The Wished star ----
// The four-point gold star is Wished's brand signal — it always means "Wished's hand in the
// plan": collected (progress), recommended (its picks), or granted (success). Never decoration.
function WishStar({ size = 14, color = '#9a7b2e', className = '', style }) {
  return (
    <svg width={size} height={size} viewBox="-8 -8 16 16" className={className} style={style} aria-hidden="true">
      <path d="M0,-7 L1.7,-1.7 L7,0 L1.7,1.7 L0,7 L-1.7,1.7 L-7,0 L-1.7,-1.7 Z" fill={color} />
    </svg>
  );
}

// A single honest beat before the reveal — not a fake "analysing..." sequence. The plan is
// already computed; this is a moment of occasion, not simulated thinking.
function RevealPause() {
  return (
    <div className="min-h-[46vh] flex flex-col items-center justify-center text-center">
      <style>{`
        @keyframes wishReveal {
          0%   { transform: scale(0.5) rotate(-60deg); opacity: 0; }
          60%  { opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes wishGlow { 0%,100% { opacity: 0.85; } 50% { opacity: 1; } }
        .wish-reveal-star { animation: wishReveal 1.2s cubic-bezier(0.16,1,0.3,1) forwards; }
        .wish-reveal-label { animation: wishGlow 2s ease-in-out infinite; }
      `}</style>
      <div className="wish-reveal-star mb-7">
        <WishStar size={54} color="#9a7b2e" />
      </div>
      <div className="wish-reveal-label text-sm tracking-[0.35em] uppercase text-stone-500" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        Building your strategy
      </div>
    </div>
  );
}

// The Wished wordmark lockup (Fix A) — "WISHED" with the gold four-point star on its own W. No
// separate W icon here: our mark IS the letter W, so placing the icon beside the word reads as a
// doubled "W WISHED". The standalone W mark lives in the favicon and avatar instead, where it
// stands alone. The star stays the brand signal, floating off the wordmark's W.
function WishLockup({ height = 22, dark = false, className = '' }) {
  const color = dark ? '#f4f1ea' : '#9a7b2e';
  const starColor = dark ? '#c9a94e' : '#9a7b2e';
  return (
    <svg height={height} viewBox="-6 -66 410 84" role="img" aria-label="Wished" className={className} style={{ display: 'block', overflow: 'visible' }}>
      <text x="0" y="0" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="500" fontSize="64" letterSpacing="8" fill={color}>WISHED</text>
      <path d="M0,-9 L2.2,-2.2 L9,0 L2.2,2.2 L0,9 L-2.2,2.2 L-9,0 L-2.2,-2.2 Z" fill={starColor} transform="translate(49,-54)" />
    </svg>
  );
}

// Email capture — shown after the at-a-glance, framed as delivery not marketing. Captures via
// PostHog (identify + email_submitted) regardless, and POSTs to a Formspree-style endpoint when
// NEXT_PUBLIC_FORMSPREE_ENDPOINT is set, attaching the person's plan link and archetype.
function EmailCapture({ answers, pinnedDays, days }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | dismissed
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = async () => {
    if (!valid || status === 'sending') return;
    setStatus('sending');
    const clean = email.trim();
    const style = holidayStyle(answers, days).name;
    const parkDays = days.filter(d => isParkName(d.park)).length;
    let planUrl = '';
    try { planUrl = `${window.location.origin}/?plan=${encodePlan(answers, pinnedDays)}`; } catch {}
    try {
      identifyUser(clean);
      track('email_submitted', { holiday_style: style, park_days: parkDays, pace: answers.intensity, resort_type: answers.property, lightning_lane_preference: answers.lightning });
    } catch {}
    try {
      const endpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;
      if (endpoint) {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            email: clean,
            holiday_style: style,
            park_days: parkDays,
            dates: `${answers.dates?.start || '?'} to ${answers.dates?.end || '?'}`,
            plan_link: planUrl,
          }),
        });
      }
    } catch { /* analytics already captured it; never block the user */ }
    setStatus('done');
  };

  if (status === 'dismissed') return null;

  if (status === 'done') {
    return (
      <div className="border border-stone-200 bg-stone-50/50 px-6 py-8 mb-12 text-center">
        <div className="flex justify-center mb-3"><WishStar size={18} /></div>
        <div className="text-xl text-stone-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>Your plan is saved.</div>
        <p className="text-stone-600 max-w-md mx-auto leading-relaxed">We've emailed your full strategy. Your detailed day-by-day plan continues below.</p>
        <button
          onClick={() => { if (typeof document !== 'undefined') { const el = document.getElementById('day-by-day'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }}
          className="mt-4 text-sm tracking-wide uppercase hover:opacity-70 transition-opacity"
          style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}
        >
          Continue to day-by-day plan ↓
        </button>
      </div>
    );
  }

  return (
    <div className="border border-stone-200 bg-stone-50/50 px-6 py-8 mb-12">
      <div className="max-w-xl">
        <div className="text-xs tracking-[0.3em] uppercase mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>Keep this plan</div>
        <h3 className="text-2xl md:text-3xl text-stone-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>Save your full Wished strategy</h3>
        <p className="text-stone-600 mb-5 leading-relaxed">We'll send your personalised plan, plus timely reminders for dining, Lightning Lane and final checks before you travel.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="you@example.com"
            aria-label="Email address"
            className="flex-1 border border-stone-300 bg-white px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-500"
            style={{ fontFamily: 'Georgia, serif' }}
          />
          <button
            onClick={submit}
            disabled={!valid || status === 'sending'}
            className="px-6 py-3 text-white tracking-wide uppercase text-sm disabled:opacity-40 transition-opacity whitespace-nowrap"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif', backgroundColor: '#9a7b2e' }}
          >
            {status === 'sending' ? 'Saving…' : 'Save My Wished Plan'}
          </button>
        </div>
        <div className="mt-5">
          <button
            onClick={() => { try { track('email_skipped'); } catch {} setStatus('dismissed'); }}
            className="text-sm text-stone-400 hover:text-stone-600 underline underline-offset-2"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            Continue without saving
          </button>
          <p className="mt-3 text-sm text-stone-500" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>No spam. Just useful reminders for this trip.</p>
        </div>
      </div>
    </div>
  );
}

export default function DisneyPlanner() {
  const [step, setStep] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const [pinnedDays, setPinnedDays] = useState({});
  const [editingDay, setEditingDay] = useState(null);
  const [answers, setAnswers] = useState({
    dates: { start: '', end: '' },
    party: { adults: 2, teens: 0, kids: 0, under3: 0 },
    days: null,
    customDays: 8,
    experience: null,
    intensity: null,
    rhythm: null,
    property: null,
    resort: '',
    offPropertyTransport: null,
    lightning: null,
    dining: null,
    rides: [],
    hopper: null,
    evenings: null,
    arrival: null,
    restDays: null,
    restDayType: null,
    waterParkInterest: null,
    waterParkCount: null,
    waterParkOpen: null,
  });

  const totalSteps = 12;

  // ---- Analytics: landing view + completion ----
  const planFiredRef = useRef(false);
  useEffect(() => { initAnalytics(); track('homepage_viewed'); }, []); // once per session
  // Reopen a shared plan: if the URL carries ?plan=, decode it and jump straight to the plan.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = new URLSearchParams(window.location.search).get('plan');
    if (!token) return;
    const decoded = decodePlan(token);
    if (!decoded) return;
    setAnswers(decoded.answers);
    setPinnedDays(decoded.pinnedDays);
    planFiredRef.current = true; // a reopened link isn't a fresh build — don't double-count it
    setStep(13);
    track('plan_opened_from_link');
  }, []);
  useEffect(() => {
    if (step !== 13 || planFiredRef.current) return;
    planFiredRef.current = true; // count each genuine build once (reset() re-arms it)
    const a = answers;
    let tripDays = null;
    if (a.dates?.start && a.dates?.end) {
      const ms = new Date(a.dates.end) - new Date(a.dates.start);
      if (!Number.isNaN(ms)) tripDays = Math.round(ms / 86400000) + 1;
    } else {
      tripDays = a.days === 'custom' ? a.customDays : a.days;
    }
    const parkDays = a.days === 'custom' ? a.customDays : a.days;
    const props = {
      park_days: tripDays || parkDays || null,
      pace: a.intensity || null,
      resort_type: a.property || null,
      lightning_lane_preference: a.lightning || null,
      trip_days: tripDays,
      party_total: a.party.adults + a.party.teens + a.party.kids + a.party.under3,
      party_adults: a.party.adults, party_teens: a.party.teens, party_kids: a.party.kids, party_under3: a.party.under3,
      intensity: a.intensity, rhythm: a.rhythm,
      property: a.property, lightning: a.lightning, dining: a.dining,
      hopper: a.hopper, evenings: a.evenings, rides_selected: a.rides?.length || 0,
      rest_days: a.restDays, water_park: a.waterParkInterest,
    };
    track('questionnaire_completed', props);
    track('at_a_glance_viewed', props);
  }, [step]);

  // Default the park-days count from the trip dates the user already entered, so they don't
  // re-enter what we know. We assume the final day is for travelling home (the common case),
  // so default to one less than the calendar span — they can add it back. Only fills when
  // they haven't set it themselves.
  useEffect(() => {
    if (step !== 3 || answers.days !== null) return;
    const { start, end } = answers.dates || {};
    if (!start || !end) return;
    const ms = new Date(end) - new Date(start);
    if (Number.isNaN(ms)) return;
    const span = Math.round(ms / 86400000) + 1;           // inclusive calendar days
    const parkDays = Math.max(2, Math.min(21, span - 1)); // last day left for travelling home
    setAnswers(prev => ({ ...prev, days: parkDays }));
  }, [step]);

  const update = (key, value) => setAnswers({ ...answers, [key]: value });
  const updateNested = (key, subkey, value) =>
    setAnswers({ ...answers, [key]: { ...answers[key], [subkey]: value } });
  const setDateRange = (start, end) =>
    setAnswers(prev => ({ ...prev, dates: { start, end } }));

  const next = () => {
    if (step === 0) { track('build_my_plan_clicked'); track('questionnaire_started'); }
    else if (step >= 1 && step <= totalSteps) track('question_answered', { question_step: step, question_id: STEP_NAMES[step] });
    if (step === totalSteps) {
      setRevealing(true);
      setTimeout(() => setRevealing(false), 1600);
    }
    setStep(s => Math.min(s + 1, totalSteps + 1));
  };
  const back = () => {
    if (step > 0) track('step_back', { from_step: step, from_step_name: STEP_NAMES[step] || null });
    setStep(s => Math.max(s - 1, 0));
  };
  const reset = () => { track('plan_reset'); planFiredRef.current = false; setStep(0); setPinnedDays({}); setEditingDay(null); setAnswers({
    dates: { start: '', end: '' },
    party: { adults: 2, teens: 0, kids: 0, under3: 0 },
    days: null, customDays: 8, experience: null, intensity: null, rhythm: null,
    property: null, resort: '', offPropertyTransport: null,
    lightning: null, dining: null,
    rides: [], hopper: null, evenings: null,
    arrival: null, restDays: null, restDayType: null,
    waterParkInterest: null, waterParkCount: null, waterParkOpen: null,
  }); };

  const canAdvance = () => {
    switch(step) {
      case 0: return true;
      case 1: return answers.dates.start && answers.dates.end && answers.arrival !== null;
      case 2: return (answers.party.adults + answers.party.teens + answers.party.kids + answers.party.under3) > 0;
      case 3: return answers.days !== null;
      case 4: return answers.intensity !== null;
      case 5: return answers.rhythm !== null;
      case 6: return answers.property !== null && (
        (answers.property === 'on' && answers.resort) ||
        (answers.property === 'off' && answers.offPropertyTransport !== null)
      );
      case 7: return answers.lightning !== null;
      case 8: return answers.dining !== null;
      case 9: return answers.rides.length > 0;
      case 10: return answers.hopper !== null && answers.evenings !== null;
      case 11: {
        if (answers.restDays === null) return false;
        if (answers.restDays === 'none') return true;
        return answers.restDayType !== null;
      }
      case 12: {
        const numDays = typeof answers.days === 'number' ? answers.days : 4;
        // Water park step only shown for 5+ day trips — auto-pass if shorter
        if (numDays < 5) return true;
        if (answers.waterParkInterest === null) return false;
        if (answers.waterParkInterest === 'no') return true;
        return answers.waterParkCount !== null && answers.waterParkOpen !== null;
      }
      default: return false;
    }
  };

  return (
    <div id="wished-root" className="min-h-screen w-full" style={{
      background: 'linear-gradient(180deg, #f4f1ea 0%, #ebe5d8 100%)',
      fontFamily: 'Georgia, "Times New Roman", serif',
    }}>
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16 no-print">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
            <WishLockup height={22} />
            {step > 0 && step <= totalSteps ? (
              <div className="text-xs tracking-[0.2em] uppercase text-stone-500" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                {step} / {totalSteps}
              </div>
            ) : (
              <nav className="flex items-center gap-5 flex-wrap">
                <a href="/guides" style={{ textDecoration: 'none' }}>
                  <span className="text-xs tracking-[0.18em] uppercase" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#78716c' }}>Guides</span>
                </a>
                <a href="/about" style={{ textDecoration: 'none' }}>
                  <span className="text-xs tracking-[0.18em] uppercase" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#78716c' }}>About</span>
                </a>
              </nav>
            )}
          </div>
          <div className="h-px bg-stone-400/40 w-full"></div>
        </header>

        {step > 0 && step <= totalSteps && (
          <div className="mb-12">
            <div className="text-xs tracking-[0.3em] uppercase mb-4 text-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>
              Building your plan
            </div>
            <div className="flex items-center justify-between px-0.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <WishStar
                  key={i}
                  size={14}
                  color={i < step ? '#9a7b2e' : '#d8d1c2'}
                  className="transition-all duration-500"
                  style={{ transform: i === step - 1 ? 'scale(1.25)' : 'scale(1)' }}
                />
              ))}
            </div>
            {step === 1 && (
              <p className="text-base text-stone-500 text-center mt-5 italic" style={{ fontFamily: 'Georgia, serif' }}>
                A few quick questions, so the plan is genuinely yours. There are no wrong answers.
              </p>
            )}
          </div>
        )}

        <div className="min-h-[400px]">
          {step === 0 && <Intro onStart={next} />}
          {step === 1 && <DatesStep dates={answers.dates} arrival={answers.arrival} onRange={setDateRange} onArrival={v => update('arrival', v)} />}
          {step === 2 && <PartyStep party={answers.party} onChange={(k,v) => updateNested('party', k, v)} />}
          {step === 3 && <DaysStep value={answers.days} onChange={v => update('days', v)} />}
          {step === 4 && <IntensityStep value={answers.intensity} onChange={v => update('intensity', v)} />}
          {step === 5 && <RhythmStep value={answers.rhythm} onChange={v => update('rhythm', v)} />}
          {step === 6 && <PropertyStep property={answers.property} resort={answers.resort} transport={answers.offPropertyTransport} onProperty={v => update('property', v)} onResort={v => update('resort', v)} onTransport={v => update('offPropertyTransport', v)} />}
          {step === 7 && <LightningStep value={answers.lightning} onChange={v => update('lightning', v)} />}
          {step === 8 && <DiningStep value={answers.dining} onChange={v => update('dining', v)} />}
          {step === 9 && <RidesStep value={answers.rides} onChange={v => update('rides', v)} />}
          {step === 10 && <ExtrasStep hopper={answers.hopper} evenings={answers.evenings} onHopper={v => update('hopper', v)} onEvenings={v => update('evenings', v)} />}
          {step === 11 && <RestDaysStep restDays={answers.restDays} restDayType={answers.restDayType} onRestDays={v => update('restDays', v)} onRestDayType={v => update('restDayType', v)} />}
          {step === 12 && <WaterParkStep
            numDays={typeof answers.days === 'number' ? answers.days : 4}
            interest={answers.waterParkInterest}
            count={answers.waterParkCount}
            open={answers.waterParkOpen}
            onInterest={v => update('waterParkInterest', v)}
            onCount={v => update('waterParkCount', v)}
            onOpen={v => update('waterParkOpen', v)}
            onAutoSkip={() => {
              // For short trips, auto-set to 'no' and advance
              if (answers.waterParkInterest === null) update('waterParkInterest', 'no');
            }}
          />}
          {step === 13 && revealing && <RevealPause />}
          {step === 13 && !revealing && <Output answers={answers} onReset={reset} pinnedDays={pinnedDays} setPinnedDays={setPinnedDays} editingDay={editingDay} setEditingDay={setEditingDay} />}
        </div>

        {step > 0 && step <= totalSteps && (
          <div className="mt-16 flex items-center justify-between">
            <button
              onClick={back}
              className="flex items-center gap-2 text-sm tracking-wider uppercase text-stone-600 hover:text-stone-900 transition-colors"
              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={next}
              disabled={!canAdvance()}
              className="flex items-center gap-3 px-8 py-3 text-sm tracking-[0.2em] uppercase transition-all"
              style={{
                fontFamily: 'Helvetica, Arial, sans-serif',
                background: canAdvance() ? '#1c1917' : '#a8a29e',
                color: '#f4f1ea',
                cursor: canAdvance() ? 'pointer' : 'not-allowed',
              }}
            >
              {step === totalSteps ? 'Build my plan' : 'Continue'} <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Intro({ onStart }) {
  return (
    <div>
      <div className="space-y-8 mb-24">
        <div className="text-xs tracking-[0.4em] uppercase" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>
          Walt Disney World, the way you wished
        </div>
        <h1 className="text-5xl md:text-7xl leading-[0.95] text-stone-900 font-normal italic">
          Wish it.<br />We'll plan<br />the rest.
        </h1>
        <p className="text-lg text-stone-700 max-w-xl leading-relaxed">
          Answer twelve quick questions and get a personalised Walt Disney World
          strategy — which parks on which days, where to stay, how to handle Lightning
          Lane, and what to book before you travel. No spreadsheets, no hour-by-hour
          itineraries. Just a plan built around your family.
        </p>
        <p className="text-xl md:text-2xl text-stone-800 italic leading-snug max-w-xl" style={{ fontFamily: 'Georgia, serif' }}>
          Most Disney tools hand every family the same answer. Wished is built around yours.
        </p>
        <button
          onClick={onStart}
          className="mt-8 px-10 py-4 text-sm tracking-[0.25em] uppercase transition-all hover:opacity-90"
          style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            background: '#1c1917',
            color: '#f4f1ea',
          }}
        >
          Build my plan →
        </button>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs tracking-[0.12em] uppercase text-stone-500" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
          <span className="flex items-center gap-1.5"><Check size={13} style={{ color: '#9a7b2e' }} /> Free</span>
          <span className="flex items-center gap-1.5"><Check size={13} style={{ color: '#9a7b2e' }} /> No sign-up</span>
          <span className="flex items-center gap-1.5"><Check size={13} style={{ color: '#9a7b2e' }} /> About four minutes</span>
          <span className="flex items-center gap-1.5"><Check size={13} style={{ color: '#9a7b2e' }} /> Updated for 2026</span>
        </div>
      </div>

      <div className="border-t border-stone-300 pt-16 mb-24">
        <div className="text-xs tracking-[0.3em] uppercase mb-4" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>
          Why this exists
        </div>
        <p className="text-2xl md:text-3xl text-stone-800 italic leading-snug max-w-2xl mb-8" style={{ fontFamily: 'Georgia, serif' }}>
          Every party is different — ages, budget, pace, what you actually want
          from the trip. The existing tools either give you a one-size-fits-all
          schedule, or a forum thread you have to read for six hours.
        </p>
        <p className="text-stone-700 max-w-2xl leading-relaxed">
          We built this because nobody else takes all the variables and gives
          you a plan that lands. Crowd patterns, your party shape, where
          you're staying, the rides you actually want to do, the events
          happening that week — they all change the right answer. This tool
          works through them and tells you what to do.
        </p>
      </div>

      <div className="border-t border-stone-300 pt-16 mb-24">
        <div className="text-xs tracking-[0.3em] uppercase mb-4" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>
          Every recommendation considers
        </div>
        <p className="text-stone-700 max-w-2xl leading-relaxed mb-8">
          This isn't a list of tips you have to assemble yourself. It's a plan that weighs
          everything that actually changes the right answer:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 max-w-2xl">
          {['Your resort', 'Party ages', 'Park Hopper', 'Crowd forecasts', 'Events that week', 'Lightning Lane', 'Budget', 'Rest days', 'Ride priorities'].map(item => (
            <div key={item} className="flex items-center gap-2 text-stone-700">
              <Check size={14} style={{ color: '#9a7b2e' }} />
              <span style={{ fontFamily: 'Georgia, serif' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-stone-300 pt-16 mb-24">
        <div className="text-xs tracking-[0.3em] uppercase mb-6" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>
          Who this is for
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <div className="text-sm tracking-[0.2em] uppercase text-stone-900 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 600 }}>
              The right fit
            </div>
            <p className="text-stone-700 leading-relaxed">
              First-time visitors, or families who've been once or twice and want to do it properly next time. We help you make the calls that aren't obvious — which park on which day, when Lightning Lane earns its keep, what to book and what to skip.
            </p>
          </div>
          <div>
            <div className="text-sm tracking-[0.2em] uppercase text-stone-500 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 600 }}>
              The wrong fit
            </div>
            <p className="text-stone-600 leading-relaxed">
              Annual passholders, frequent visitors, or anyone who already knows their way around. You don't need us — and you probably already disagree with half our recommendations.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-300 pt-16 text-center">
        <p className="text-stone-600 mb-8 max-w-md mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
          Ready to plan?
        </p>
        <button
          onClick={onStart}
          className="px-10 py-4 text-sm tracking-[0.25em] uppercase transition-all hover:opacity-90"
          style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            background: '#1c1917',
            color: '#f4f1ea',
          }}
        >
          Build my plan →
        </button>
      </div>
    </div>
  );
}

function StepHeader({ icon: Icon, eyebrow, title, sub }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <Icon size={18} strokeWidth={1.5} style={{ color: '#9a7b2e' }} />
        <div className="text-xs tracking-[0.3em] uppercase" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>
          {eyebrow}
        </div>
      </div>
      <h2 className="text-3xl md:text-4xl text-stone-900 font-normal italic mb-3 leading-tight">
        {title}
      </h2>
      {sub && <p className="text-stone-600 leading-relaxed max-w-lg">{sub}</p>}
    </div>
  );
}

function DatesStep({ dates, arrival, onRange, onArrival }) {
  const arrivalOpts = [
    { v: 'morning', label: 'Morning · before 11am' },
    { v: 'midday', label: 'Midday · 11am-3pm' },
    { v: 'evening', label: 'Late afternoon · after 3pm' },
    { v: 'night', label: 'Evening · after 7pm' },
  ];

  return (
    <div>
      <StepHeader icon={Calendar} eyebrow="Question 1" title="When are you going?" sub="We'll cross-reference crowd levels, special events, and any park early-closures across these dates." />
      <RangeCalendar start={dates.start} end={dates.end} onRangeChange={onRange} />
      <div className="mt-10">
        <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
          What time do you arrive on Day 1?
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {arrivalOpts.map(o => (
            <button
              key={o.v}
              onClick={() => onArrival(o.v)}
              className="text-left p-3 transition-all border"
              style={{
                background: arrival === o.v ? '#1c1917' : '#fafaf9',
                color: arrival === o.v ? '#f4f1ea' : '#1c1917',
                borderColor: arrival === o.v ? '#1c1917' : '#d6d3d1',
                fontFamily: 'Georgia, serif',
                fontSize: '0.9rem',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RangeCalendar({ start, end, onRangeChange }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const initialMonth = start ? new Date(start) : today;
  const [viewMonth, setViewMonth] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));

  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (startDate) startDate.setHours(0, 0, 0, 0);
  if (endDate) endDate.setHours(0, 0, 0, 0);

  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleDayClick = (day) => {
    // Two-click logic: first click sets start (clears end), second click sets end.
    if (!startDate || (startDate && endDate)) {
      onRangeChange(fmt(day), '');
    } else {
      if (day < startDate) {
        // clicked before start — restart the range from here
        onRangeChange(fmt(day), '');
      } else {
        onRangeChange(fmt(startDate), fmt(day));
      }
    }
  };

  const nights = startDate && endDate ? Math.round((endDate - startDate) / 86400000) : null;

  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  const renderMonth = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

    return (
      <div className="flex-1">
        <div className="text-center text-sm tracking-[0.15em] uppercase text-stone-700 mb-4" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
          {monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </div>
        <div className="grid grid-cols-7 gap-y-1 mb-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => (
            <div key={idx} className="text-center text-xs text-stone-400" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;
            day.setHours(0, 0, 0, 0);
            const isPast = day < today;
            const isStart = startDate && day.getTime() === startDate.getTime();
            const isEnd = endDate && day.getTime() === endDate.getTime();
            const inRange = startDate && endDate && day > startDate && day < endDate;
            const isEdge = isStart || isEnd;
            return (
              <div key={idx} className="flex justify-center">
                <button
                  onClick={() => !isPast && handleDayClick(day)}
                  disabled={isPast}
                  className="w-9 h-9 flex items-center justify-center text-sm transition-all"
                  style={{
                    fontFamily: 'Georgia, serif',
                    cursor: isPast ? 'default' : 'pointer',
                    background: isEdge ? '#9a7b2e' : inRange ? '#e8ddc2' : 'transparent',
                    color: isPast ? '#d6d3d1' : isEdge ? '#f4f1ea' : '#1c1917',
                    borderRadius: isEdge ? '4px' : inRange ? '0' : '4px',
                  }}
                >
                  {day.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const secondMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);

  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4 mb-8 pb-6 border-b border-stone-300">
        <div>
          <div className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-1" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Arrival</div>
          <div className="text-lg text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>
            {startDate ? startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-1" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Departure</div>
          <div className="text-lg text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>
            {endDate ? endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-1" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Nights</div>
          <div className="text-lg text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>
            {nights !== null ? nights : '—'}
          </div>
        </div>
      </div>

      {/* Calendar nav */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center border border-stone-300 text-stone-600 hover:bg-stone-900 hover:text-stone-50 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="text-xs tracking-[0.2em] uppercase text-stone-400" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
          {!startDate ? 'Pick your arrival date' : !endDate ? 'Now pick your departure' : 'Tap a new arrival date to change'}
        </div>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center border border-stone-300 text-stone-600 hover:bg-stone-900 hover:text-stone-50 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Two months side by side on desktop, one on mobile */}
      <div className="flex flex-col md:flex-row gap-8">
        {renderMonth(viewMonth)}
        <div className="hidden md:block">{renderMonth(secondMonth)}</div>
      </div>
    </div>
  );
}

function PartyStep({ party, onChange }) {
  const groups = [
    { key: 'adults', label: 'Adults', sub: '18+' },
    { key: 'teens', label: 'Teens', sub: '13–17' },
    { key: 'kids', label: 'Kids', sub: '3–12' },
    { key: 'under3', label: 'Under 3', sub: 'Free entry' },
  ];
  return (
    <div>
      <StepHeader icon={Users} eyebrow="Question 2" title="Who's travelling with you?" sub="Ages drive ride access, height restrictions, pace, and how we handle Rider Swap if some of you do thrills and others don't." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {groups.map(g => (
          <Counter key={g.key} label={g.label} sub={g.sub} value={party[g.key]} onChange={v => onChange(g.key, v)} />
        ))}
      </div>
    </div>
  );
}

function Counter({ label, sub, value, onChange }) {
  return (
    <div className="border border-stone-300 p-5 bg-stone-50/50">
      <div className="text-sm tracking-wider uppercase text-stone-700 mb-1" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{label}</div>
      <div className="text-xs text-stone-500 mb-4" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{sub}</div>
      <div className="flex items-center justify-between">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="w-8 h-8 flex items-center justify-center border border-stone-400 text-stone-700 hover:bg-stone-900 hover:text-stone-50 transition-colors">−</button>
        <div className="text-3xl text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>{value}</div>
        <button onClick={() => onChange(value + 1)} className="w-8 h-8 flex items-center justify-center border border-stone-400 text-stone-700 hover:bg-stone-900 hover:text-stone-50 transition-colors">+</button>
      </div>
    </div>
  );
}

function DaysStep({ value, onChange }) {
  const days = typeof value === 'number' ? value : 5;
  return (
    <div>
      <StepHeader icon={Clock} eyebrow="Question 3" title="How many days in the parks?" sub="Not your full trip — just the days you'll have park tickets for." />
      <div className="border border-stone-300 p-6 bg-stone-50/50">
        <div className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-4" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Park days</div>
        <div className="flex items-center gap-5">
          <button onClick={() => onChange(Math.max(2, days - 1))} className="w-12 h-12 flex items-center justify-center border border-stone-400 text-stone-700 text-xl hover:bg-stone-900 hover:text-stone-50 transition-colors">−</button>
          <div className="text-4xl text-stone-900 min-w-[3.5rem] text-center" style={{ fontFamily: 'Georgia, serif' }}>{days}</div>
          <button onClick={() => onChange(Math.min(21, days + 1))} className="w-12 h-12 flex items-center justify-center border border-stone-400 text-stone-700 text-xl hover:bg-stone-900 hover:text-stone-50 transition-colors">+</button>
        </div>
        <p className="text-sm text-stone-500 mt-5 leading-relaxed max-w-md">
          We've set this from your dates and left the last day free for travelling home. Add it back if you'll have park tickets then too.
        </p>
      </div>
    </div>
  );
}

function IntensityStep({ value, onChange }) {
  const opts = [
    { v: 'all', label: 'Everything, including the big coasters', sub: 'Tron, Rise, Guardians, Slinky, Tower of Terror — all in.' },
    { v: 'family', label: 'Family rides and gentler thrills', sub: 'Splash-level intensity, no inverted coasters.' },
    { v: 'calm', label: 'Mostly the calm stuff', sub: 'Theming, shows, character meets, dark rides.' },
    { v: 'split', label: "Mixed — some will, some won't", sub: "We'll plan Rider Swap into the day." },
  ];
  return (
    <div>
      <StepHeader icon={Gauge} eyebrow="Question 4" title="How much thrill are you after?" sub="Be honest — this drives which parks get more time and how we sequence the day." />
      <div className="space-y-3">
        {opts.map(o => <SelectCard key={o.v} selected={value === o.v} onClick={() => onChange(o.v)} title={o.label} sub={o.sub} />)}
      </div>
    </div>
  );
}

function RhythmStep({ value, onChange }) {
  const opts = [
    { v: 'rope', label: 'Rope drop to close', sub: 'Long days, maximum park time.' },
    { v: 'split', label: 'Early start, midday break, evening return', sub: 'Pool or nap in the afternoon.' },
    { v: 'late', label: 'Late start, stay till close', sub: 'Sleep in, evening parks.' },
    { v: 'morning', label: 'Mornings only', sub: 'Out by lunch most days.' },
    { v: 'unsure', label: 'Not sure — recommend', sub: "We'll suggest based on your party and dates." },
  ];
  return (
    <div>
      <StepHeader icon={Sparkles} eyebrow="Question 5" title="What does your ideal park day look like?" sub="Long days drain young kids. Late starts waste cool morning hours. There's no right answer — just yours." />
      <div className="space-y-3">
        {opts.map(o => <SelectCard key={o.v} selected={value === o.v} onClick={() => onChange(o.v)} title={o.label} sub={o.sub} />)}
      </div>
    </div>
  );
}

function PropertyStep({ property, resort, transport, onProperty, onResort, onTransport }) {
  const resorts = [
    'Grand Floridian', 'Polynesian', 'Contemporary', 'Wilderness Lodge',
    'BoardWalk', 'Beach/Yacht Club', 'Riviera', 'Caribbean Beach',
    'Coronado Springs', 'Animal Kingdom Lodge', 'Port Orleans',
    'Pop Century', 'All-Star Resorts', 'Art of Animation', 'Other Disney resort',
  ];
  const transportOpts = [
    { v: 'rental', label: 'Rental car', sub: 'Drive to each park. Most flexible, but parking is $30/day.' },
    { v: 'rideshare', label: 'Uber/Lyft', sub: 'No parking hassle, but adds £15-30 per trip.' },
    { v: 'mears', label: 'Mears Connect or shuttle', sub: 'Cheaper but less flexible — fixed schedule.' },
    { v: 'walk', label: 'Walking distance hotel', sub: 'Some parks walkable, others need a quick drive.' },
  ];
  return (
    <div>
      <StepHeader icon={Hotel} eyebrow="Question 6" title="Where are you staying?" sub="On-property gets you Early Theme Park Entry and easier transport. Off-property usually wins on space and cost." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        <SelectCard selected={property === 'on'} onClick={() => onProperty('on')} title="On Disney property" sub="Disney resort, with park transport included." />
        <SelectCard selected={property === 'off'} onClick={() => onProperty('off')} title="Off-property" sub="Hotel, villa, or rental nearby." />
      </div>
      {property === 'on' && (
        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Which resort?</div>
          <select
            value={resort}
            onChange={e => onResort(e.target.value)}
            className="w-full bg-transparent border-b border-stone-400 pb-2 text-lg text-stone-900 focus:outline-none focus:border-stone-900"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <option value="">Select your resort…</option>
            {resorts.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}
      {property === 'off' && (
        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>How are you getting to the parks?</div>
          <div className="space-y-3">
            {transportOpts.map(o => <SelectCard key={o.v} selected={transport === o.v} onClick={() => onTransport(o.v)} title={o.label} sub={o.sub} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function LightningStep({ value, onChange }) {
  const opts = [
    { v: 'always', label: 'Yes, every park day', sub: 'Multi Pass daily, plus Single Pass for the big headliners. Maximum convenience, maximum cost.' },
    { v: 'smart', label: 'Where it earns its keep', sub: "We'll recommend per day — heavy parks and high-crowd days only." },
    { v: 'none', label: 'Avoid it entirely', sub: 'Standby queues only. Rope drop discipline required.' },
    { v: 'unsure', label: 'Recommend', sub: "Based on your dates and party — we'll tell you which days are worth it." },
  ];
  return (
    <div>
      <StepHeader icon={Zap} eyebrow="Question 7" title="How do you feel about skipping the lines?" sub="Disney's paid line-skip system. Multi Pass bundles regular rides; Single Pass buys the top headliners individually (Tron, Rise of the Resistance, Flight of Passage). Most experienced parties pay selectively, not always." />
      <div className="space-y-3">
        {opts.map(o => <SelectCard key={o.v} selected={value === o.v} onClick={() => onChange(o.v)} title={o.label} sub={o.sub} />)}
      </div>
    </div>
  );
}

function DiningStep({ value, onChange }) {
  const opts = [
    { v: 'full', label: 'Sit-down meals most days', sub: "You want the table-service experience." },
    { v: 'mix', label: 'A few standouts, counter-service the rest', sub: 'Two or three really good sit-downs.' },
    { v: 'qs', label: 'Counter-service throughout', sub: 'No reservations, no waiting around.' },
    { v: 'unsure', label: 'Recommend', sub: "We'll suggest based on your party and pace." },
  ];
  return (
    <div>
      <StepHeader icon={Sparkles} eyebrow="Question 8" title="How do you want to eat?" sub="Table-service restaurants need booking 60 days out at 7am ET. Some love that. Plenty don't." />
      <div className="space-y-3">
        {opts.map(o => <SelectCard key={o.v} selected={value === o.v} onClick={() => onChange(o.v)} title={o.label} sub={o.sub} />)}
      </div>
    </div>
  );
}

function RidesStep({ value, onChange }) {
  const ridesByPark = {
    'Magic Kingdom': [
      { id: 'tron', label: 'Tron Lightcycle / Run' },
      { id: 'sevendwarfs', label: 'Seven Dwarfs Mine Train' },
      { id: 'tiana', label: "Tiana's Bayou Adventure" },
      { id: 'spacemountain', label: 'Space Mountain' },
      { id: 'bigthunder', label: 'Big Thunder Mountain' },
      { id: 'haunted', label: 'Haunted Mansion' },
      { id: 'pirates', label: 'Pirates of the Caribbean' },
      { id: 'peterpan', label: "Peter Pan's Flight" },
    ],
    'EPCOT': [
      { id: 'guardians', label: 'Guardians of the Galaxy: Cosmic Rewind' },
      { id: 'testtrack', label: 'Test Track' },
      { id: 'frozen', label: 'Frozen Ever After' },
      { id: 'remy', label: "Remy's Ratatouille Adventure" },
      { id: 'soarin', label: "Soarin' Around the World" },
    ],
    'Hollywood Studios': [
      { id: 'rise', label: 'Rise of the Resistance' },
      { id: 'slinky', label: 'Slinky Dog Dash' },
      { id: 'tot', label: 'Tower of Terror' },
      { id: 'rnr', label: "Rock 'n' Roller Coaster" },
      { id: 'smugglers', label: 'Millennium Falcon: Smugglers Run' },
      { id: 'mmrr', label: "Mickey & Minnie's Runaway Railway" },
    ],
    'Animal Kingdom': [
      { id: 'fop', label: 'Avatar Flight of Passage' },
      { id: 'navi', label: "Na'vi River Journey" },
      { id: 'safari', label: 'Kilimanjaro Safaris' },
      { id: 'everest', label: 'Expedition Everest' },
    ],
  };

  const toggle = (id) => {
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  };

  return (
    <div>
      <StepHeader icon={Sparkles} eyebrow="Question 9" title="Which rides would you hate to miss?" sub="Pick the ones that matter. We'll target these at rope drop and in Lightning Lane recommendations." />
      <div className="space-y-6">
        {Object.entries(ridesByPark).map(([park, rides]) => (
          <div key={park}>
            <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{park}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {rides.map(r => (
                <button
                  key={r.id}
                  onClick={() => toggle(r.id)}
                  className="text-left p-3 transition-all border"
                  style={{
                    background: value.includes(r.id) ? '#1c1917' : '#fafaf9',
                    color: value.includes(r.id) ? '#f4f1ea' : '#1c1917',
                    borderColor: value.includes(r.id) ? '#1c1917' : '#d6d3d1',
                  }}
                >
                  <div className="text-sm" style={{ fontFamily: 'Georgia, serif' }}>{r.label}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-sm text-stone-500" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        {value.length} selected
      </div>
    </div>
  );
}

function ExtrasStep({ hopper, evenings, onHopper, onEvenings }) {
  const hopperOpts = [
    { v: 'yes', label: 'Yes, park hopper', sub: 'Hop between parks any time, once you\u2019ve entered your first. ~$80/person extra.' },
    { v: 'no', label: 'No, single park per day', sub: 'Standard ticket.' },
    { v: 'unsure', label: 'Recommend', sub: "We'll tell you whether it's worth it." },
  ];
  const eveningsOpts = [
    { v: 'late', label: "We'll stay for fireworks", sub: 'Happily Ever After at MK, Fantasmic at HS.' },
    { v: 'flex', label: 'Sometimes', sub: 'Some nights yes, some nights no.' },
    { v: 'early', label: 'Out by 8pm most nights', sub: 'Kids in bed, or just not built for late nights.' },
  ];
  return (
    <div>
      <StepHeader icon={Compass} eyebrow="Question 10" title="A couple more" sub="Park hopper, and how late the party can stay out." />
      <div className="mb-10">
        <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Park hopper?</div>
        <div className="space-y-3">
          {hopperOpts.map(o => <SelectCard key={o.v} selected={hopper === o.v} onClick={() => onHopper(o.v)} title={o.label} sub={o.sub} />)}
        </div>
      </div>
      <div>
        <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Evenings — how late can you stay?</div>
        <div className="space-y-3">
          {eveningsOpts.map(o => <SelectCard key={o.v} selected={evenings === o.v} onClick={() => onEvenings(o.v)} title={o.label} sub={o.sub} />)}
        </div>
      </div>
    </div>
  );
}

function RestDaysStep({ restDays, restDayType, onRestDays, onRestDayType }) {
  const restOpts = [
    { v: 'middle', label: 'Yes, in the middle of the trip', sub: 'Around day 4-5 of a longer trip.' },
    { v: 'spread', label: 'Yes, every 4-5 park days', sub: 'Built-in pauses to keep energy high.' },
    { v: 'flexible', label: 'Yes, recommend timing', sub: "We'll place them based on park sequence." },
    { v: 'none', label: 'No rest days', sub: "Park every day — you'll rest when you get home." },
  ];
  const typeOpts = [
    { v: 'full', label: 'Full rest day', sub: 'Pool, resort, Disney Springs.' },
    { v: 'morning', label: 'Morning rest, evening park', sub: 'Lie in, pool morning, park from 4pm.' },
    { v: 'evening', label: 'Park morning, afternoon off', sub: 'Rope drop, park until 1pm, pool afternoon.' },
    { v: 'waterpark', label: 'Water park day', sub: 'Blizzard Beach or Typhoon Lagoon (separate ticket).' },
  ];
  return (
    <div>
      <StepHeader icon={Sparkles} eyebrow="Question 11" title="How do you like to recharge?" sub="On longer trips, planned breaks make the difference between a good trip and a holiday everyone needs to recover from." />
      <div className={restDays && restDays !== 'none' ? 'mb-10' : ''}>
        <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Do you want rest days built in?</div>
        <div className="space-y-3">
          {restOpts.map(o => <SelectCard key={o.v} selected={restDays === o.v} onClick={() => onRestDays(o.v)} title={o.label} sub={o.sub} />)}
        </div>
      </div>
      {restDays && restDays !== 'none' && (
        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>What kind of rest day?</div>
          <div className="space-y-3">
            {typeOpts.map(o => <SelectCard key={o.v} selected={restDayType === o.v} onClick={() => onRestDayType(o.v)} title={o.label} sub={o.sub} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function WaterParkStep({ numDays, interest, count, open, onInterest, onCount, onOpen }) {
  // For trips under 5 days, water parks aren't realistic — show a skip message
  if (numDays < 5) {
    return (
      <div>
        <StepHeader icon={Sparkles} eyebrow="Question 12" title="Water parks" sub="Your trip's too short to add a water park day — they need a full day, and you'll get more out of the main parks. Skipping this." />
      </div>
    );
  }

  const interestOpts = [
    { v: 'yes', label: 'Yes, a definite yes', sub: "We'll build a water park day into the plan." },
    { v: 'maybe', label: 'Maybe, if it fits', sub: "We'll suggest it but keep it flexible." },
    { v: 'no', label: 'No, skip them', sub: "Stick to the four main parks." },
  ];

  const countOpts = numDays >= 10
    ? [
        { v: 1, label: 'Just one day', sub: 'A single water park visit during the trip.' },
        { v: 2, label: 'Two days', sub: 'Either both parks, or two visits.' },
        { v: 3, label: 'Three days', sub: 'Roughly one water park day per work week — good for a long trip.' },
        { v: 4, label: 'Four days', sub: 'A water park day every few days. You really like them.' },
      ]
    : [
        { v: 1, label: 'Just one day', sub: 'A single water park visit during the trip.' },
        { v: 2, label: 'Two days', sub: 'Either both parks if open, or two visits to the same one.' },
      ];

  const openOpts = [
    { v: 'typhoon', label: 'Typhoon Lagoon', sub: 'The more themed of the two — more relaxed, scenic.' },
    { v: 'blizzard', label: 'Blizzard Beach', sub: 'More slides, more thrill-focused.' },
    { v: 'both', label: 'Both are open', sub: "You've got the full choice." },
    { v: 'unsure', label: "Not sure — we'll flag it for you to check", sub: "Disney's calendar will confirm closer to your trip." },
  ];

  return (
    <div>
      <StepHeader
        icon={Sparkles}
        eyebrow="Question 12"
        title="Water parks?"
        sub="Disney has two — Typhoon Lagoon and Blizzard Beach. Usually only one is open at a time; check Disney's calendar to confirm."
      />
      <div className="mb-10">
        <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
          Are you interested in a water park day?
        </div>
        <div className="space-y-3">
          {interestOpts.map(o => <SelectCard key={o.v} selected={interest === o.v} onClick={() => onInterest(o.v)} title={o.label} sub={o.sub} />)}
        </div>
      </div>

      {(interest === 'yes' || interest === 'maybe') && (
        <>
          <div className="mb-10">
            <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
              How many water park days?
            </div>
            <div className="space-y-3">
              {countOpts.map(o => <SelectCard key={o.v} selected={count === o.v} onClick={() => onCount(o.v)} title={o.label} sub={o.sub} />)}
            </div>
          </div>

          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
              Which is open during your trip?
            </div>
            <div className="space-y-3">
              {openOpts.map(o => <SelectCard key={o.v} selected={open === o.v} onClick={() => onOpen(o.v)} title={o.label} sub={o.sub} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SelectCard({ selected, onClick, title, sub }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-5 transition-all border"
      style={{
        background: selected ? '#1c1917' : '#fafaf9',
        color: selected ? '#f4f1ea' : '#1c1917',
        borderColor: selected ? '#1c1917' : '#d6d3d1',
      }}
    >
      <div className="text-base mb-1" style={{ fontFamily: 'Georgia, serif' }}>{title}</div>
      {sub && <div className="text-sm leading-relaxed" style={{
        fontFamily: 'Helvetica, Arial, sans-serif',
        color: selected ? '#d6d3d1' : '#78716c',
      }}>{sub}</div>}
    </button>
  );
}

function Output({ answers, onReset, pinnedDays, setPinnedDays, editingDay, setEditingDay }) {
  const days = generateStubDays(answers, pinnedDays);
  const [expandedDays, setExpandedDays] = useState({ 0: true });
  const fullPlanFiredRef = useRef(false);
  const markFullPlanViewed = () => {
    if (fullPlanFiredRef.current) return;
    fullPlanFiredRef.current = true;
    track('full_plan_viewed');
  };

  const toggleExpand = (dayIdx) => {
    const opening = !expandedDays[dayIdx];
    markFullPlanViewed();
    if (opening) track('view_full_day_clicked', { day: dayIdx + 1, park: days[dayIdx]?.park });
    setExpandedDays(prev => ({ ...prev, [dayIdx]: !prev[dayIdx] }));
  };
  const expandAll = () => {
    markFullPlanViewed();
    const all = {};
    days.forEach((_, i) => { all[i] = true; });
    setExpandedDays(all);
  };
  const collapseAll = () => setExpandedDays({});

  const pinDay = (dayIdx, value) => {
    setPinnedDays({ ...pinnedDays, [dayIdx]: value });
    setEditingDay(null);
  };

  const clearPin = (dayIdx) => {
    const newPins = { ...pinnedDays };
    delete newPins[dayIdx];
    setPinnedDays(newPins);
    setEditingDay(null);
  };

  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    const token = encodePlan(answers, pinnedDays);
    const url = `${window.location.origin}/?plan=${token}`;
    try { await navigator.clipboard.writeText(url); } catch { /* clipboard blocked — address bar still updates below */ }
    try { window.history.replaceState(null, '', `/?plan=${token}`); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    track('plan_link_copied');
  };
  const printPlan = () => {
    track('plan_printed');
    expandAll();                                  // open every day so the whole plan prints
    setTimeout(() => window.print(), 200);
  };

  return (
    <div>
      <style>{`
        @media print {
          #wished-root { background: #ffffff !important; }
          .no-print { display: none !important; }
          .plan-summary { break-after: page; page-break-after: always; }
          .plan-day { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-300 no-print">
        <WishLockup height={18} />
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 text-xs tracking-[0.18em] uppercase text-stone-600 hover:text-stone-900 transition-colors"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            {copied ? <><Check size={13} /> Link copied</> : <><Copy size={13} /> Copy link</>}
          </button>
          <button
            onClick={printPlan}
            className="flex items-center gap-2 text-xs tracking-[0.18em] uppercase text-stone-600 hover:text-stone-900 transition-colors"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            <Printer size={13} /> Print / Save PDF
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-xs tracking-[0.18em] uppercase text-stone-600 hover:text-stone-900 transition-colors"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            <RotateCcw size={13} /> Start a new plan
          </button>
        </div>
      </div>
      <div className="mb-12">
        <div className="text-xs tracking-[0.4em] uppercase mb-4" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>
          Your Wished strategy
        </div>
        <h1 className="text-4xl md:text-5xl text-stone-900 font-normal italic leading-tight mb-3">
          {holidayStyle(answers, days).name}
        </h1>
        <p className="text-lg text-stone-600 leading-relaxed max-w-2xl italic mb-5" style={{ fontFamily: 'Georgia, serif' }}>
          {holidayStyle(answers, days).blurb}
        </p>
        {generateSummary(answers, days).map((para, i) => (
          <p key={i} className="text-lg text-stone-700 leading-relaxed max-w-2xl mb-4 last:mb-0">
            {para}
          </p>
        ))}
      </div>

      <div className="mb-16">
        <div className="text-xs tracking-[0.3em] uppercase mb-6" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>
          Your trip shape
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tripShape(answers, days).map((c, i) => (
            <div key={i} className="border border-stone-200 bg-stone-50/40 px-4 py-3">
              <div className="text-[10px] tracking-[0.15em] uppercase text-stone-400 mb-1.5" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{c.label}</div>
              <div className="text-stone-900 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>

      {(() => {
        const strategy = generateStrategy(answers, days);
        if (!strategy.length) return null;
        return (
          <div className="mb-16">
            <div className="text-xs tracking-[0.3em] uppercase mb-6" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>
              Wished recommends
            </div>
            <div className="space-y-6">
              {strategy.map((s, i) => (
                <div key={i} className="flex gap-4">
                  <div className="shrink-0 mt-1.5"><WishStar size={16} /></div>
                  <div>
                    <div className="text-xl md:text-2xl text-stone-900 leading-snug" style={{ fontFamily: 'Georgia, serif' }}>{s.decision}</div>
                    <p className="text-stone-600 leading-relaxed mt-1.5 max-w-xl">{s.why}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {(() => {
        const warnings = watchOuts(answers, days);
        if (!warnings.length) return null;
        return (
          <div className="mb-16">
            <div className="text-xs tracking-[0.3em] uppercase mb-6" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>
              Watch out for
            </div>
            <div className="space-y-4">
              {warnings.map((w, i) => (
                <div key={i} className="border-l-2 pl-4" style={{ borderColor: '#d8d1c2' }}>
                  <div className="text-[11px] tracking-[0.15em] uppercase text-stone-500 mb-1" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{w.title}</div>
                  <p className="text-stone-700 leading-relaxed max-w-2xl">{w.body}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* At a glance — the whole trip as a morning / midday / evening grid. Doubles as page one
          of the printed PDF, and as the shareable summary. */}
      <div className="plan-summary mb-12">
        <div className="text-xs tracking-[0.4em] uppercase mb-5" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>
          At a glance
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {days.map((d, i) => {
            const s = daySlots(d, answers, i, days.length);
            const rows = [['AM', s.am], ['MID', s.mid], ['EVE', s.eve]];
            const crowdColour = d.crowd == null ? null : (d.crowd <= 3 ? '#65a30d' : d.crowd <= 5 ? '#a16207' : d.crowd <= 7 ? '#c2410c' : '#9a4034');
            return (
              <button
                key={i}
                onClick={() => {
                  markFullPlanViewed();
                  setExpandedDays(prev => ({ ...prev, [i]: true }));
                  if (typeof document !== 'undefined') {
                    const el = document.getElementById(`day-${i}`);
                    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
                  }
                }}
                className="text-left border border-stone-200 bg-stone-50/40 p-3 hover:bg-stone-100/60 transition-colors flex flex-col"
              >
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="text-base text-stone-900 shrink-0" style={{ fontFamily: 'Georgia, serif' }}>Day {i + 1}</span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] tracking-wide uppercase text-stone-400 truncate" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                      {d.date ? d.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
                    </span>
                    {crowdColour && <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: crowdColour }} />}
                  </span>
                </div>
                {rows.map(([labelText, slot]) => {
                  const tone = slotTone(slot.kind);
                  return (
                    <div key={labelText} className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] tracking-[0.15em] uppercase text-stone-400 w-7 shrink-0" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{labelText}</span>
                      <span className="text-xs px-2 py-1 flex-1" style={{ background: tone.bg, color: tone.fg, fontFamily: 'Georgia, serif' }}>{slot.label}</span>
                    </div>
                  );
                })}
                {(s.ll || s.note) && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                    {s.ll && (
                      <span className="inline-flex items-center gap-1 text-[9px] tracking-wide uppercase px-1.5 py-0.5" style={{ background: '#f3e7cf', color: '#9a7b2e', fontFamily: 'Helvetica, Arial, sans-serif' }}>
                        <WishStar size={9} /> LL
                      </span>
                    )}
                    {s.note && <span className="text-[10px] italic text-stone-500" style={{ fontFamily: 'Georgia, serif' }}>{s.note}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-[10px] tracking-wide uppercase text-stone-400" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
          <span>AM morning · MID midday · EVE evening</span>
          <span className="inline-flex items-center gap-1"><WishStar size={9} color="#9a7b2e" /> LL = Lightning Lane recommended</span>
        </div>
        {answers.lightning !== 'none' && (
          <p className="mt-4 text-sm text-stone-500 leading-relaxed max-w-2xl" style={{ fontFamily: 'Georgia, serif' }}>
            New to Lightning Lane? <span className="text-stone-600">Multi Pass</span> books ride-skips through the day; <span className="text-stone-600">Single Pass</span> is a paid extra for the biggest headliners. <a href="/lightning-lane" className="underline decoration-stone-300 underline-offset-2 hover:text-stone-900" style={{ color: '#9a7b2e' }}>Read the Lightning Lane guide →</a>
          </p>
        )}
      </div>

      <EmailCapture answers={answers} pinnedDays={pinnedDays} days={days} />

      <div id="day-by-day" className="border-t border-stone-300 pt-12 mb-12">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs tracking-[0.3em] uppercase" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>
            Day by day
          </div>
          <button
            onClick={() => {
              const anyCollapsed = days.some((_, i) => !expandedDays[i]);
              anyCollapsed ? expandAll() : collapseAll();
            }}
            className="text-xs tracking-wider uppercase text-stone-500 hover:text-stone-900 transition-colors"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            {days.some((_, i) => !expandedDays[i]) ? 'Expand all' : 'Collapse all'}
          </button>
        </div>
        <p className="text-sm text-stone-500 mb-8" style={{ fontFamily: 'Georgia, serif' }}>
          Open each day for morning, midday and evening guidance.
        </p>
        <div className="space-y-4">
          {days.map((d, i) => {
            const isPinned = pinnedDays[i] !== undefined;
            const warning = isPinned ? checkPinWarning(i, pinnedDays[i], d, answers) : null;
            const isExpanded = !!expandedDays[i];
            const priority = generateDayPriority(d, i, days.length, answers);
            const dailyTip = generateDayTip(d, i, answers);
            return (
              <div key={i} id={`day-${i}`} className="plan-day border border-stone-200 bg-stone-50/40">
                {/* Always-visible summary row — tap to expand */}
                <button
                  onClick={() => toggleExpand(i)}
                  className="w-full text-left p-5 md:p-6 hover:bg-stone-100/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-1.5">
                        <span className="text-xs tracking-[0.2em] uppercase text-stone-500" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                          Day {i + 1}{d.date ? ` · ${d.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}` : ''}
                        </span>
                        {d.crowd !== null && d.crowd !== undefined && <CrowdDot level={d.crowd} />}
                        {d.llmp === true && (
                          <span className="text-xs px-2 py-0.5 tracking-wider uppercase" style={{ fontFamily: 'Helvetica, Arial, sans-serif', background: '#f0e9d6', color: '#9a7b2e', border: '1px solid #d9c89a' }}>
                            ⚡ Lightning Lane Multi Pass
                          </span>
                        )}
                        {d.llmp === false && (
                          <span className="text-xs px-2 py-0.5 tracking-wider uppercase text-stone-500" style={{ fontFamily: 'Helvetica, Arial, sans-serif', border: '1px solid #d6d3d1' }}>
                            Standby OK
                          </span>
                        )}
                        {isPinned && (
                          <span className="text-xs px-2 py-0.5 bg-stone-200 text-stone-700 tracking-wider uppercase" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                            Pinned
                          </span>
                        )}
                        {d.flag && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 tracking-wider uppercase" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                            ⚑ Note
                          </span>
                        )}
                      </div>
                      <div className="text-2xl text-stone-900 italic leading-tight mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                        {dayLabel(d.park, answers)}
                      </div>
                      <div className="text-stone-600 leading-snug" style={{ fontFamily: 'Georgia, serif' }}>
                        <span className="text-xs tracking-[0.15em] uppercase not-italic mr-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>Today</span>
                        {priority}
                      </div>
                    </div>
                  </div>
                  <div
                    className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-center gap-2 text-xs tracking-[0.2em] uppercase select-none"
                    style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}
                  >
                    <span className="text-base leading-none">{isExpanded ? '−' : '+'}</span>
                    {isExpanded ? 'Close day' : 'View full day'}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 md:px-6 pb-6">
                    {warning && (
                      <div className="mb-5 p-4 bg-amber-50 border-l-2 border-amber-400 text-sm text-amber-900 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                        <div className="not-italic mb-1" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>Heads up</div>
                        {warning}
                      </div>
                    )}
                    <p className="text-stone-800 leading-relaxed mb-7 italic text-lg border-t border-stone-200 pt-6" style={{ fontFamily: 'Georgia, serif' }}>{typeof d.rationale === 'object' ? d.rationale.headline : d.rationale}</p>
                    {typeof d.rationale === 'object' && (
                      <div className="space-y-6">
                        {d.rationale.morning && (
                          <div>
                            <div className="text-xs tracking-[0.25em] uppercase text-stone-400 mb-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Morning</div>
                            <div className="text-stone-700 leading-relaxed">{d.rationale.morning}</div>
                          </div>
                        )}
                        {d.rationale.afternoon && (
                          <div>
                            <div className="text-xs tracking-[0.25em] uppercase text-stone-400 mb-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Afternoon</div>
                            <div className="text-stone-700 leading-relaxed">{d.rationale.afternoon}</div>
                          </div>
                        )}
                        {d.rationale.evening && (
                          <div>
                            <div className="text-xs tracking-[0.25em] uppercase text-stone-400 mb-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Evening</div>
                            <div className="text-stone-700 leading-relaxed">{d.rationale.evening}</div>
                          </div>
                        )}
                      </div>
                    )}
                    {d.flag && (
                      <div className="inline-block text-xs tracking-wider uppercase px-3 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 mt-5" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                        ⚑ {d.flag}
                      </div>
                    )}

                    {/* Daily tip */}
                    <div className="mt-7 p-4 bg-stone-100/70" style={{ borderLeft: '2px solid #9a7b2e' }}>
                      <div className="text-xs tracking-[0.2em] uppercase mb-1.5" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>Insider tip{isParkName(d.park) ? ` · ${d.park}` : ''}</div>
                      <div className="text-stone-700 leading-relaxed text-sm" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{dailyTip}</div>
                    </div>

                    {/* Change controls */}
                    <div className="mt-6">
                      <button
                        onClick={() => setEditingDay(editingDay === i ? null : i)}
                        className="text-xs tracking-wider uppercase text-stone-500 hover:text-stone-900 transition-colors"
                        style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                      >
                        {editingDay === i ? '× Close' : 'Change this day →'}
                      </button>
                      {editingDay === i && (
                        <div className="mt-4 p-5 bg-white border border-stone-300">
                          <div className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                            Change Day {i + 1} to:
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                            {['Magic Kingdom', 'EPCOT', 'Hollywood Studios', 'Animal Kingdom', 'Rest day', 'Water park'].map(opt => (
                              <button
                                key={opt}
                                onClick={() => pinDay(i, opt)}
                                className="text-left p-2 text-sm border transition-all"
                                style={{
                                  background: d.park === opt ? '#1c1917' : '#fafaf9',
                                  color: d.park === opt ? '#f4f1ea' : '#1c1917',
                                  borderColor: d.park === opt ? '#1c1917' : '#d6d3d1',
                                  fontFamily: 'Georgia, serif',
                                }}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          {isPinned && (
                            <button
                              onClick={() => clearPin(i)}
                              className="text-xs tracking-wider uppercase text-stone-600 hover:text-stone-900 underline underline-offset-2"
                              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                            >
                              Remove pin · let us decide
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-stone-300 pt-12 mb-12">
        <div className="text-xs tracking-[0.3em] uppercase mb-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e' }}>
          The non-obvious stuff
        </div>
        <p className="text-sm text-stone-600 mb-10 max-w-xl italic" style={{ fontFamily: 'Georgia, serif' }}>
          The small decisions that make a big difference once you're there.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          {generateTips(answers).map((t, i) => (
            <div key={i}>
              <div className="text-stone-900 mb-1.5 text-base leading-snug" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{t.title}</div>
              <div className="text-sm text-stone-600 leading-relaxed" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{t.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-4 pb-8 no-print">
        <button
          onClick={copyLink}
          className="flex items-center gap-2 text-sm tracking-[0.18em] uppercase px-6 py-3 transition-colors"
          style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e', border: '1px solid #d9c89a', background: '#f9f6ef' }}
        >
          {copied ? <><Check size={14} /> Link copied</> : <><Copy size={14} /> Copy link</>}
        </button>
        <button
          onClick={printPlan}
          className="flex items-center gap-2 text-sm tracking-[0.18em] uppercase px-6 py-3 transition-colors"
          style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e', border: '1px solid #d9c89a', background: '#f9f6ef' }}
        >
          <Printer size={14} /> Print / Save PDF
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-sm tracking-[0.18em] uppercase px-6 py-3 transition-colors"
          style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#9a7b2e', border: '1px solid #d9c89a', background: '#f9f6ef' }}
        >
          <RotateCcw size={14} /> Start a new plan
        </button>
      </div>
    </div>
  );
}

// Warning logic — when a user pin overrides a smart default, tell them what we'd have chosen and why
function checkPinWarning(dayIdx, pinnedPark, day, a) {
  const isArrival = dayIdx === 0;
  const isDeparture = day.date && a.dates.end && day.date.toISOString().split('T')[0] === a.dates.end;
  const hasYoungKids = a.party.kids > 0 || a.party.under3 > 0;
  const heavyPark = pinnedPark === 'Magic Kingdom' || pinnedPark === 'Hollywood Studios';
  const dow = day.date ? day.date.getDay() : null;
  const crowd = day.crowd;

  // Arrival day with a heavy park
  if (isArrival && heavyPark && hasYoungKids) {
    return `${pinnedPark} on arrival day with young kids is a tough start — the park demands a full day and energy fades fast on travel days. We'd normally put a lighter park here.`;
  }
  if (isArrival && heavyPark) {
    return `Day 1 at ${pinnedPark} means you're going hard on a travel day. Doable, but you'll get more from it on a non-arrival day.`;
  }

  // High-crowd warning
  if (crowd && crowd >= 8) {
    return `${pinnedPark} on this day looks busy (crowd level ${crowd}/10). Another day in your window would likely be quieter — but if the date is locked for a specific reason like Fantasmic or a dining reservation, this is fine.`;
  }

  // Party-night warning for Magic Kingdom — driven by the real published calendar, not a
  // day-of-week guess. Names the correct event, and falls back to a "not published yet"
  // nudge when the trip is in a party season we don't have dates for.
  if (pinnedPark === 'Magic Kingdom' && day.date) {
    const kind = partyKind(day.date);
    if (kind) {
      const nice = day.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      const name = kind === 'christmas' ? "Mickey's Very Merry Christmas Party" : "Mickey's Not-So-Scary Halloween Party";
      return `${nice} is a ${name} night — Magic Kingdom closes to day-ticket guests at 6pm and the regular fireworks don't run. Move Magic Kingdom to another evening in your window, or treat this as a half-day and be out by 6.`;
    }
    const pending = pendingPartySeason(day.date);
    if (pending) {
      const season = pending === 'christmas' ? 'Christmas' : 'Halloween';
      return `Your trip falls in ${season} party season, but Disney hasn't published the ${season} Party dates for this year yet (they usually drop a few months out). Some Magic Kingdom evenings may close early to day guests — plan the rest now and check back closer to your trip so we can pin the exact nights.`;
    }
  }

  // Rest day in a weird position
  if (pinnedPark === 'Rest day' && (isArrival || isDeparture)) {
    return `A rest day on ${isArrival ? 'arrival' : 'departure'} day is unusual — these are usually short days anyway, so a planned park day uses them better.`;
  }

  return null;
}

function CrowdDot({ level }) {
  const label = level <= 3 ? 'Quieter' : level <= 5 ? 'Moderate' : level <= 7 ? 'Busy' : 'Peak crowds';
  const colour = level <= 3 ? '#65a30d' : level <= 5 ? '#a16207' : level <= 7 ? '#c2410c' : '#9a4034';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs not-italic" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <span className="inline-block w-2 h-2 rounded-full" style={{ background: colour }} />
      <span style={{ color: colour }}>{label}</span>
    </span>
  );
}

const RESORTS = {
  'Grand Floridian': { tier: 'deluxe', transport: { mk: 'monorail-walk', epcot: 'bus-monorail', hs: 'bus', ak: 'bus' }, walkable: ['Magic Kingdom'] },
  'Polynesian': { tier: 'deluxe', transport: { mk: 'monorail-walk', epcot: 'monorail-bus', hs: 'bus', ak: 'bus' }, walkable: ['Magic Kingdom'] },
  'Contemporary': { tier: 'deluxe', transport: { mk: 'walk', epcot: 'bus-monorail', hs: 'bus', ak: 'bus' }, walkable: ['Magic Kingdom'] },
  'Wilderness Lodge': { tier: 'deluxe', transport: { mk: 'boat', epcot: 'bus', hs: 'bus', ak: 'bus' } },
  'BoardWalk': { tier: 'deluxe', transport: { mk: 'bus', epcot: 'walk-skyliner', hs: 'walk-boat-skyliner', ak: 'bus' }, walkable: ['EPCOT', 'Hollywood Studios'] },
  'Beach/Yacht Club': { tier: 'deluxe', transport: { mk: 'bus', epcot: 'walk', hs: 'walk-boat-skyliner', ak: 'bus' }, walkable: ['EPCOT', 'Hollywood Studios'] },
  'Riviera': { tier: 'deluxe-villa', transport: { mk: 'bus', epcot: 'skyliner', hs: 'skyliner', ak: 'bus' }, skyliner: true },
  'Caribbean Beach': { tier: 'moderate', transport: { mk: 'bus', epcot: 'skyliner', hs: 'skyliner', ak: 'bus' }, skyliner: true },
  'Coronado Springs': { tier: 'moderate', transport: { mk: 'bus', epcot: 'bus', hs: 'bus', ak: 'bus' } },
  'Animal Kingdom Lodge': { tier: 'deluxe', transport: { mk: 'bus', epcot: 'bus', hs: 'bus', ak: 'bus' } },
  'Port Orleans': { tier: 'moderate', transport: { mk: 'bus', epcot: 'bus', hs: 'bus', ak: 'bus' } },
  'Pop Century': { tier: 'value', transport: { mk: 'bus', epcot: 'skyliner', hs: 'skyliner', ak: 'bus' }, skyliner: true },
  'All-Star Resorts': { tier: 'value', transport: { mk: 'bus', epcot: 'bus', hs: 'bus', ak: 'bus' } },
  'Art of Animation': { tier: 'value', transport: { mk: 'bus', epcot: 'skyliner', hs: 'skyliner', ak: 'bus' }, skyliner: true },
  'Other Disney resort': { tier: 'unknown', transport: { mk: 'bus', epcot: 'bus', hs: 'bus', ak: 'bus' } },
};

function getResortTransport(resortName, park) {
  const resort = RESORTS[resortName];
  if (!resort) return 'bus';
  const key = park === 'Magic Kingdom' ? 'mk' : park === 'EPCOT' ? 'epcot' : park === 'Hollywood Studios' ? 'hs' : 'ak';
  return resort.transport[key];
}

function isResortWalkable(resortName, park) {
  const resort = RESORTS[resortName];
  return resort?.walkable?.includes(park);
}

function isResortSkyliner(resortName) {
  return RESORTS[resortName]?.skyliner === true;
}

// On a partial arrival (anything after late morning), the arrival day is only a half/evening
// at the park. Magic Kingdom shouldn't be that park for a first-timer — it's the centrepiece
// and deserves a full day, ideally first. If MK has landed on the arrival day, swap it with a
// later full park day (preferring EPCOT, which is ideal for an arrival-evening around World
// Showcase). Respects a user who has deliberately pinned MK to day 0.
function keepMKOffArrivalDay(sequence, a, pinnedDays = {}) {
  const arrival = a.arrival || 'morning';
  if (arrival === 'morning' || arrival === 'night') return; // full-day, or no park at all on arrival
  if (a.experience === 'returning') return;                 // first-timers only
  if (pinnedDays && pinnedDays[0] !== undefined) return;    // user explicitly chose day 0
  if (sequence[0] !== 'Magic Kingdom') return;
  // Prefer EPCOT for an arrival evening (World Showcase is ideal after dark), then Hollywood
  // Studios; Animal Kingdom last since it closes early and makes a weak evening.
  let swapIdx = sequence.findIndex((p, i) => i > 0 && p === 'EPCOT');
  if (swapIdx === -1) swapIdx = sequence.findIndex((p, i) => i > 0 && p === 'Hollywood Studios');
  if (swapIdx === -1) swapIdx = sequence.findIndex((p, i) => i > 0 && p === 'Animal Kingdom');
  if (swapIdx > 0) {
    [sequence[0], sequence[swapIdx]] = [sequence[swapIdx], sequence[0]];
  }
}

function generateStubDays(a, pinnedDays = {}) {
  const allocation = allocateParks(a, pinnedDays);
  const sequence = sequenceParks(allocation, a, pinnedDays);
  keepMKOffArrivalDay(sequence, a, pinnedDays); // first-timers: MK earns a full day, not a half-day arrival
  const mkBump = allocation._mkBump || { bumped: false };
  const hasTravelDay = allocation.includes('Travel day');
  const visitCounts = {};
  return sequence.map((park, i) => {
    const count = (visitCounts[park] || 0) + 1;
    visitCounts[park] = count;
    const isRepeatVisit = count > 1;
    const date = getDateForDay(a.dates.start, i);
    const crowd = date ? estimateCrowd(date, park) : null;
    const isParkDay = ['Magic Kingdom', 'EPCOT', 'Hollywood Studios', 'Animal Kingdom'].includes(park);
    // Arrival day = day 0. No Lightning Lane Multi Pass recommendation on arrival day —
    // a partial day (especially an evening-only visit) doesn't justify the cost.
    const isArrivalDay = i === 0;
    let llmp = null;
    if (isParkDay && !isArrivalDay) {
      if (a.lightning === 'always') llmp = true;
      else if (a.lightning === 'none') llmp = false;
      else llmp = shouldBuyLL({ park, crowd: crowd || 5 }, a);
    }
    let flag = detectFlag(park, i, sequence.length, a, date);
    // Surface the MK-bump explanation on the day MK was moved to
    if (mkBump.bumped && mkBump.day === i) {
      flag = mkBump.reason;
    }
    return {
      park,
      date,
      crowd,
      llmp,
      rationale: generateRationale(park, i, sequence.length, a, date, isRepeatVisit, sequence),
      flag,
    };
  });
}

function getDateForDay(startStr, dayIndex) {
  if (!startStr) return null;
  const d = new Date(startStr);
  d.setDate(d.getDate() + dayIndex);
  return d;
}

// ---- Magic Kingdom special-event calendar (HARD-CODED) ----
// On party nights MK closes early to day-ticket guests (~6pm) and the regular fireworks
// don't run. So: a first-timer's MK day must never anchor on one, and we never recommend
// MK fireworks on one.
//   MNSSHP = Mickey's Not-So-Scary Halloween Party (Aug–Oct)
//   MVMCP  = Mickey's Very Merry Christmas Party (Nov–Dec)
//
// ⚠️ ANNUAL REFRESH: these are real published dates for the years in KNOWN_PARTY_YEARS
// only. When Disney publishes a new year's calendar, add the dates AND add the year to
// KNOWN_PARTY_YEARS — otherwise that year falls through to the "not published yet" nudge.
const MNSSHP_2026 = new Set([
  '2026-08-07', '2026-08-11', '2026-08-14', '2026-08-18', '2026-08-21', '2026-08-23', '2026-08-25', '2026-08-28', '2026-08-30',
  '2026-09-01', '2026-09-04', '2026-09-08', '2026-09-11', '2026-09-15', '2026-09-18', '2026-09-20', '2026-09-22', '2026-09-24', '2026-09-25', '2026-09-27', '2026-09-29',
  '2026-10-01', '2026-10-02', '2026-10-04', '2026-10-06', '2026-10-08', '2026-10-09', '2026-10-13', '2026-10-15', '2026-10-16', '2026-10-18', '2026-10-22', '2026-10-23', '2026-10-25', '2026-10-27', '2026-10-29',
]);
const MVMCP_2026 = new Set([
  '2026-11-08', '2026-11-09', '2026-11-12', '2026-11-13', '2026-11-15', '2026-11-17', '2026-11-19', '2026-11-20', '2026-11-24', '2026-11-25', '2026-11-27', '2026-11-29',
  '2026-12-01', '2026-12-03', '2026-12-04', '2026-12-06', '2026-12-08', '2026-12-10', '2026-12-11', '2026-12-13', '2026-12-15', '2026-12-17', '2026-12-18', '2026-12-20', '2026-12-22',
]);

// Years for which we have a real, published party calendar. A trip that lands in a party
// SEASON in a year NOT listed here means we don't know the dates yet — show the soft
// "not published" nudge instead of silently implying there's no party.
const KNOWN_PARTY_YEARS = new Set([2026]);

// Local-time YYYY-MM-DD key — matches how estimateCrowd/detectFlag read dates with
// getMonth()/getDate(), and avoids the toISOString() UTC off-by-one.
function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Confirmed party night → 'halloween' | 'christmas' | null.
function partyKind(date) {
  if (!date) return null;
  const key = dateKey(date);
  if (MNSSHP_2026.has(key)) return 'halloween';
  if (MVMCP_2026.has(key)) return 'christmas';
  return null;
}

function isPartyNight(date) {
  return partyKind(date) !== null;
}

// Date falls in a party SEASON but in a year we have no data for → 'halloween' | 'christmas'
// | null. Drives the "dates not published yet, check back" nudge so we never imply a party
// season is party-free just because the calendar isn't out.
function pendingPartySeason(date) {
  if (!date) return null;
  if (KNOWN_PARTY_YEARS.has(date.getFullYear())) return null; // we have real data
  const m = date.getMonth();
  const d = date.getDate();
  if (m === 7 || m === 8 || m === 9) return 'halloween';      // Aug–Oct
  if (m === 10 || (m === 11 && d <= 23)) return 'christmas';  // Nov–22 Dec
  return null;
}

function estimateCrowd(date, park) {
  if (park === 'Rest day' || park === 'Travel day' || park === 'Water park') return null;
  const month = date.getMonth();
  const dom = date.getDate();
  const dow = date.getDay();
  let base = 5;
  if (month === 11 && dom >= 20) base = 10;
  else if (month === 0 && dom <= 3) base = 9;
  else if (month === 2 && dom >= 10 && dom <= 31) base = 8;
  else if (month === 3 && dom <= 15) base = 8;
  else if (month === 5 && dom >= 15) base = 8;
  else if (month === 6) base = 8;
  else if (month === 7 && dom <= 15) base = 7;
  else if (month === 10 && dom >= 18 && dom <= 30) base = 8;
  else if (month === 0 && dom >= 7 && dom <= 31) base = 3;
  else if (month === 1 && dom <= 14) base = 3;
  else if (month === 4 && dom <= 20) base = 4;
  else if (month === 8) base = 4;
  else if (month === 10 && dom <= 14) base = 4;
  const dowAdjust = { 0: 1, 1: 0, 2: -1, 3: -1, 4: -1, 5: 0, 6: 2 }[dow];
  let crowd = base + dowAdjust;
  if (park === 'Magic Kingdom') {
    if (dow === 6 || dow === 0) crowd += 1;
  } else if (park === 'Hollywood Studios') {
    if (dow >= 2 && dow <= 4) crowd += 1;
  } else if (park === 'EPCOT') {
    if ((month === 7 || month === 8 || month === 9 || month === 10) && (dow === 5 || dow === 6)) {
      crowd += 2;
    }
  }
  return Math.max(1, Math.min(10, crowd));
}

function allocateParks(a) {
  const numDays = typeof a.days === 'number' ? a.days : 4;
  const hasYoungKids = a.party.kids > 0 || a.party.under3 > 0;
  const allCoasters = a.intensity === 'all';
  const calmOnly = a.intensity === 'calm';
  const restPref = a.restDays || 'none';
  const arrival = a.arrival || 'morning';
  const waterParkDays = (a.waterParkInterest === 'yes' || a.waterParkInterest === 'maybe')
    ? (a.waterParkCount || 0)
    : 0;
  const priority = ['Magic Kingdom', 'Hollywood Studios', 'EPCOT', 'Animal Kingdom'];
  if (hasYoungKids) {
    priority.splice(1, 0, priority.splice(priority.indexOf('Animal Kingdom'), 1)[0]);
  }
  if (calmOnly) {
    priority.sort((x, y) => {
      const order = { 'EPCOT': 0, 'Animal Kingdom': 1, 'Magic Kingdom': 2, 'Hollywood Studios': 3 };
      return order[x] - order[y];
    });
  }
  const day1NonPark = arrival === 'night';
  let restDayCount = 0;
  if (restPref === 'middle' && numDays >= 6) restDayCount = 1;
  else if (restPref === 'spread' && numDays >= 5) restDayCount = Math.floor((numDays - 4) / 4) + 1;
  else if (restPref === 'flexible' && numDays >= 7) restDayCount = Math.floor(numDays / 5);
  const parkDayCount = numDays - restDayCount - waterParkDays - (day1NonPark ? 1 : 0);
  let parkSequence = [];
  if (parkDayCount <= 4) {
    parkSequence = priority.slice(0, parkDayCount);
  } else {
    parkSequence = [...priority];
    const remaining = parkDayCount - 4;
    const repeatOrder = hasYoungKids
      ? ['Magic Kingdom', 'EPCOT', 'Magic Kingdom', 'Hollywood Studios', 'Animal Kingdom', 'EPCOT']
      : allCoasters
        ? ['Hollywood Studios', 'Magic Kingdom', 'EPCOT', 'Hollywood Studios', 'Magic Kingdom', 'Animal Kingdom']
        : ['Magic Kingdom', 'EPCOT', 'Hollywood Studios', 'Magic Kingdom', 'Animal Kingdom', 'EPCOT'];
    for (let i = 0; i < remaining; i++) {
      parkSequence.push(repeatOrder[i % repeatOrder.length]);
    }
  }
  const allocation = [];
  if (day1NonPark) allocation.push('Travel day');
  let restDayPositions = [];
  if (restPref === 'middle' && restDayCount === 1) {
    // Land at ~60% through the trip — after fatigue builds, before final push
    restDayPositions = [Math.floor(numDays * 0.6)];
  } else if (restPref === 'spread') {
    // First rest day at ~50%, then every 4-5 days
    let pos = Math.floor(numDays * 0.5);
    while (pos < numDays - 1) {
      restDayPositions.push(pos);
      pos += 5;
    }
  } else if (restPref === 'flexible') {
    // Spread weighted toward the second half of the trip
    if (restDayCount === 1) {
      restDayPositions = [Math.floor(numDays * 0.6)];
    } else if (restDayCount === 2) {
      restDayPositions = [Math.floor(numDays * 0.45), Math.floor(numDays * 0.8)];
    } else {
      // 3+ rest days — even spacing but offset from start
      const interval = Math.floor((numDays - 2) / restDayCount);
      for (let i = 1; i <= restDayCount; i++) {
        restDayPositions.push(1 + i * interval);
      }
    }
  }
  // Water park positioning — absolute day indices (0-indexed)
  // First one around day 4, rest spaced through the trip. Never days 1-2, never departure day.
  let waterParkPositions = [];
  if (waterParkDays > 0) {
    const lastDay = numDays - 1; // departure day — avoid
    const minDay = 3; // index 3 = day 4 earliest (day 3 only as fallback on short trips)

    // Find the free slot nearest a target, preferring to keep at least `gap` from existing picks
    const placeNear = (target, gap) => {
      const isValid = (idx) =>
        idx >= minDay && idx < lastDay &&
        !restDayPositions.includes(idx) &&
        !waterParkPositions.includes(idx) &&
        waterParkPositions.every(p => Math.abs(p - idx) >= gap);
      if (isValid(target)) { waterParkPositions.push(target); return true; }
      // search outward from target
      for (let d = 1; d < numDays; d++) {
        if (isValid(target + d)) { waterParkPositions.push(target + d); return true; }
        if (isValid(target - d)) { waterParkPositions.push(target - d); return true; }
      }
      return false;
    };

    // Relaxed fallback: ignore gap, still respect floor and departure
    const placeAnywhere = (target) => {
      const isValid = (idx) =>
        idx >= minDay && idx < lastDay &&
        !restDayPositions.includes(idx) &&
        !waterParkPositions.includes(idx);
      for (let d = 0; d < numDays; d++) {
        if (isValid(target + d)) { waterParkPositions.push(target + d); return true; }
        if (isValid(target - d)) { waterParkPositions.push(target - d); return true; }
      }
      // last resort: allow day 3 (index 2) if truly nothing else, still never days 1-2 or departure
      for (let idx = 2; idx < lastDay; idx++) {
        if (!restDayPositions.includes(idx) && !waterParkPositions.includes(idx)) {
          waterParkPositions.push(idx); return true;
        }
      }
      return false;
    };

    // Ideal targets by count and trip length
    let targets;
    if (waterParkDays === 1) targets = [Math.min(4, numDays <= 7 ? 3 : 4)];
    else if (waterParkDays === 2) targets = [3, numDays <= 10 ? 6 : 7];
    else if (waterParkDays === 3) targets = [3, 6, Math.min(11, lastDay - 2)];
    else targets = [3, 6, 10, 12];

    // For 4+ beyond the base list, spread remaining through the back half
    if (waterParkDays > 4) {
      for (let i = 4; i < waterParkDays; i++) {
        targets.push(Math.min(lastDay - 1, 13 + (i - 4) * 2));
      }
    }

    const minGap = numDays >= 12 ? 3 : 2;
    targets.slice(0, waterParkDays).forEach(t => {
      if (!placeNear(t, minGap)) placeAnywhere(t);
    });
    waterParkPositions.sort((a, b) => a - b);
  }

  let parkIdx = 0;
  const lockedPositions = {}; // dayIdx -> 'Water park' | 'Rest day' (must not be moved by sequencer)
  for (let dayIdx = allocation.length; dayIdx < numDays; dayIdx++) {
    if (restDayPositions.includes(dayIdx)) {
      const type = a.restDayType === 'waterpark' ? 'Water park' : 'Rest day';
      allocation.push(type);
      lockedPositions[dayIdx] = type;
    } else if (waterParkPositions.includes(dayIdx)) {
      allocation.push('Water park');
      lockedPositions[dayIdx] = 'Water park';
    } else {
      allocation.push(parkSequence[parkIdx] || parkSequence[parkSequence.length - 1] || 'Magic Kingdom');
      parkIdx++;
    }
  }
  allocation._locked = lockedPositions;
  return allocation;
}

function sequenceParks(allocation, a, pinnedDays = {}) {
  const numDays = allocation.length;
  const hasYoungKids = a.party.kids > 0 || a.party.under3 > 0;
  const startDate = a.dates.start ? new Date(a.dates.start) : null;
  if (startDate && numDays > 1) {
    return crowdOptimisedSequence(allocation, startDate, a, hasYoungKids, pinnedDays);
  }
  return ruleBasedSequence(allocation, a, hasYoungKids);
}

function crowdOptimisedSequence(allocation, startDate, a, hasYoungKids, pinnedDays = {}) {
  const numDays = allocation.length;
  const dates = Array.from({ length: numDays }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });
  const sensitivity = {
    'Magic Kingdom': 2, 'Hollywood Studios': 2, 'EPCOT': 1.2, 'Animal Kingdom': 1.5,
    'Rest day': 0, 'Travel day': 0, 'Water park': 0,
  };
  const used = new Set();
  const sequence = new Array(numDays).fill(null);

  // Lock special days (water parks, rest days) at the positions allocateParks chose.
  // These are treated like pins — placed first, never moved by scoring or the de-dupe shuffle.
  const locked = allocation._locked || {};
  Object.entries(locked).forEach(([idx, type]) => {
    const i = parseInt(idx);
    if (i < numDays && sequence[i] === null) {
      sequence[i] = type;
      used.add(i);
    }
  });

  // FIRST: lock in all user-pinned days (these override even special days)
  Object.entries(pinnedDays).forEach(([idx, park]) => {
    const i = parseInt(idx);
    if (i < numDays) {
      sequence[i] = park;
      used.add(i);
    }
  });

  // Travel day is always day 0 if it's in allocation and not overridden
  if (allocation.includes('Travel day') && !sequence[0]) {
    sequence[0] = 'Travel day';
    used.add(0);
  }

  // FIRST-TIMER RULE: Magic Kingdom should anchor the first FULL day (never the arrival day).
  // It's the emotional centrepiece — first-timers want the castle first. Strong default,
  // but if MK's crowd on that day is extreme (a holiday spike), bump it and record why.
  const mkBumpInfo = { bumped: false, reason: null, day: null };
  const isFirstTimer = a.experience !== 'returning';
  if (isFirstTimer && allocation.filter(p => p === 'Magic Kingdom').length > 0) {
    // Determine the first FULL day. Day 0 is only a "full day" if they arrive in the morning
    // with no travel day. An evening/midday arrival, or a night-arrival travel day, means
    // the first full day is day 1 (0-indexed) at the earliest.
    const arrival = a.arrival || 'morning';
    const morningArrival = arrival === 'morning';
    const earliestFullDay = morningArrival ? 0 : 1;

    let firstFullDay = -1;
    let firstPartyFallback = -1;
    for (let i = earliestFullDay; i < numDays; i++) {
      if (sequence[i] === 'Travel day') continue;
      if (sequence[i] !== null) continue;
      // Never anchor a first-timer's MK full day on an MNSSHP party night — the park
      // closes early to day guests and the fireworks don't run. Remember it as a last-
      // resort fallback only if every open day turns out to be a party night.
      if (isPartyNight(dates[i])) { if (firstPartyFallback === -1) firstPartyFallback = i; continue; }
      firstFullDay = i;
      break;
    }
    if (firstFullDay === -1) firstFullDay = firstPartyFallback;
    if (firstFullDay >= 0) {
      // First-timer rule: Magic Kingdom ALWAYS anchors the first full day. The castle-first
      // moment is the point of a first trip — it beats crowd optimisation. Party nights are
      // already excluded by the loop above (MK closes to day guests at 6pm on those, so a full
      // first MK day isn't possible); that exclusion is a hard constraint and stays.
      sequence[firstFullDay] = 'Magic Kingdom';
      used.add(firstFullDay);
    }
  }
  allocation._mkBump = mkBumpInfo;

  // Now figure out what still needs to be placed
  // Take original allocation, remove what's already been pinned/locked (matching by count)
  const pinnedCounts = {};
  Object.values(pinnedDays).forEach(p => { pinnedCounts[p] = (pinnedCounts[p] || 0) + 1; });
  if (allocation.includes('Travel day') && sequence[0] === 'Travel day' && !pinnedDays[0]) {
    pinnedCounts['Travel day'] = (pinnedCounts['Travel day'] || 0) + 1;
  }
  // Locked special days are already placed — count them so they aren't re-placed
  Object.values(locked).forEach(type => {
    // only count if that exact slot wasn't overridden by a user pin
    pinnedCounts[type] = (pinnedCounts[type] || 0) + 1;
  });
  // First-timer MK we pre-placed above also needs counting so it isn't placed twice
  if (isFirstTimer) {
    // Count MK slots we set that aren't pins or locks
    let prePlacedMK = 0;
    for (let i = 0; i < numDays; i++) {
      if (sequence[i] === 'Magic Kingdom' && pinnedDays[i] === undefined && locked[i] === undefined) prePlacedMK++;
    }
    if (prePlacedMK > 0) pinnedCounts['Magic Kingdom'] = (pinnedCounts['Magic Kingdom'] || 0) + prePlacedMK;
  }
  // Correct for any locked slot that a user pin overrode
  Object.keys(locked).forEach(idx => {
    const i = parseInt(idx);
    if (pinnedDays[i] !== undefined) {
      const type = locked[idx];
      pinnedCounts[type] = Math.max(0, (pinnedCounts[type] || 0) - 1);
    }
  });

  const remainingAllocation = [];
  const allocCounts = {};
  allocation.forEach(p => { allocCounts[p] = (allocCounts[p] || 0) + 1; });
  Object.entries(allocCounts).forEach(([park, count]) => {
    const alreadyPlaced = pinnedCounts[park] || 0;
    const toPlace = Math.max(0, count - alreadyPlaced);
    for (let i = 0; i < toPlace; i++) remainingAllocation.push(park);
  });

  // Also handle case: user pinned a park that wasn't in original allocation (e.g. extra Magic Kingdom day)
  Object.entries(pinnedCounts).forEach(([park, count]) => {
    const inAlloc = allocCounts[park] || 0;
    if (count > inAlloc) {
      // User added park days beyond what we'd planned — need to drop something else
      // Drop the least-sensitive park from remaining
      const dropCandidates = remainingAllocation
        .map((p, idx) => ({ p, idx, s: sensitivity[p] || 0 }))
        .sort((x, y) => x.s - y.s);
      const excess = count - inAlloc;
      for (let i = 0; i < excess && dropCandidates.length > 0; i++) {
        remainingAllocation.splice(dropCandidates[i].idx, 1);
      }
    }
  });

  const uniqueParks = [...new Set(remainingAllocation)];
  uniqueParks.sort((x, y) => sensitivity[y] - sensitivity[x]);
  for (const park of uniqueParks) {
    const occurrences = remainingAllocation.filter(p => p === park).length;
    const candidates = dates.map((d, i) => ({
      idx: i,
      score: (estimateCrowd(d, park) || 0) * sensitivity[park] + softPenalty(park, i, numDays, a, hasYoungKids) + eventPenalty(park, d),
    }))
    .filter(c => !used.has(c.idx))
    .sort((x, y) => x.score - y.score);
    for (let n = 0; n < occurrences && n < candidates.length; n++) {
      sequence[candidates[n].idx] = park;
      used.add(candidates[n].idx);
    }
  }
  for (let i = 0; i < numDays; i++) {
    if (!sequence[i]) sequence[i] = allocation[i] || 'Magic Kingdom';
  }
  // Break up consecutive same-park days — but ONLY swap real park days, and never
  // move a Water park / Rest day / Travel day, or swap anything into the first two full days.
  const SPECIAL = new Set(['Water park', 'Rest day', 'Travel day']);
  for (let i = 1; i < sequence.length; i++) {
    if (pinnedDays[i] !== undefined || pinnedDays[i - 1] !== undefined) continue;
    if (SPECIAL.has(sequence[i])) continue; // never relocate a special day
    if (sequence[i] === sequence[i - 1]) {
      for (let j = i + 1; j < sequence.length; j++) {
        if (pinnedDays[j] !== undefined) continue;
        if (SPECIAL.has(sequence[j])) continue; // don't pull a special day forward
        if (j <= 1) continue; // never swap into day 1 or 2
        if (sequence[j] !== sequence[i] && (j === sequence.length - 1 || sequence[j + 1] !== sequence[i])) {
          [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
          break;
        }
      }
    }
  }
  return sequence;
}

function eventPenalty(park, date) {
  if (park !== 'Magic Kingdom') return 0;
  const month = date.getMonth();
  const dow = date.getDay();
  if ((month >= 7 && month <= 9) && [0, 1, 3, 4, 5].includes(dow)) return 4;
  if (month === 10 && [0, 1, 2, 4, 5].includes(dow)) return 4;
  return 0;
}

function softPenalty(park, dayIdx, numDays, a, hasYoungKids) {
  let penalty = 0;
  const isArrival = dayIdx === 0;
  const isDeparture = dayIdx === numDays - 1 && numDays > 1;
  if (park === 'Travel day') {
    if (!isArrival) penalty += 100;
    return penalty;
  }
  if (park === 'Rest day' || park === 'Water park') {
    // Never on arrival or departure
    if (isArrival || isDeparture) penalty += 1000;
    // Water parks specifically should not land in the first two full days — you need to settle in
    // and get oriented at a real park first. Steep, escalating penalty for early placement.
    if (park === 'Water park') {
      if (dayIdx <= 1) penalty += 1000;      // day 1-2: effectively banned
      else if (dayIdx === 2) penalty += 40;  // day 3: strongly discouraged but possible on short trips
      else if (dayIdx === 3) penalty += 8;   // day 4: mild — this is the sweet spot, light touch
    } else {
      // Rest day — also shouldn't be too early, but less strict than water parks
      if (dayIdx === 1) penalty += 60;
      else if (dayIdx === 2) penalty += 15;
    }
    return penalty;
  }
  if (isArrival && (park === 'Magic Kingdom' || park === 'Hollywood Studios')) {
    if (a.experience !== 'returning' || hasYoungKids) penalty += 3;
  }
  // Animal Kingdom closes earliest of the four (often 6-7pm), so it's wasted on a partial arrival
  // day (evening/midday) — you'd reach it as it shuts. Push it strongly to a full day instead.
  if (isArrival && park === 'Animal Kingdom') {
    const arrival = a.arrival || 'morning';
    penalty += (arrival === 'evening' || arrival === 'midday') ? 50 : 4;
  }
  if (isDeparture && (park === 'Magic Kingdom' || park === 'Hollywood Studios')) penalty += 2;
  if (park === 'Magic Kingdom' && dayIdx === 1) penalty -= 1.5;
  if (hasYoungKids && park === 'Magic Kingdom' && dayIdx === 1) penalty -= 0.5;
  return penalty;
}

function ruleBasedSequence(allocation, a, hasYoungKids) {
  let sequence = [...allocation];
  if (a.experience !== 'returning' || hasYoungKids) {
    if (sequence[0] === 'Magic Kingdom' || sequence[0] === 'Hollywood Studios') {
      const swapIdx = sequence.findIndex(p => p === 'Animal Kingdom' || p === 'EPCOT');
      if (swapIdx > 0) [sequence[0], sequence[swapIdx]] = [sequence[swapIdx], sequence[0]];
    }
  }
  if (sequence.length > 2) {
    const last = sequence.length - 1;
    if (sequence[last] === 'Hollywood Studios' || sequence[last] === 'Magic Kingdom') {
      const swapIdx = sequence.findIndex((p, i) => i < last && (p === 'Animal Kingdom' || p === 'EPCOT'));
      if (swapIdx >= 0) [sequence[last], sequence[swapIdx]] = [sequence[swapIdx], sequence[last]];
    }
  }
  if (hasYoungKids && sequence.length >= 3) {
    const mkIdx = sequence.indexOf('Magic Kingdom');
    if (mkIdx > 1) {
      const mk = sequence.splice(mkIdx, 1)[0];
      sequence.splice(1, 0, mk);
    }
  }
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i] === sequence[i - 1]) {
      for (let j = i + 1; j < sequence.length; j++) {
        if (sequence[j] !== sequence[i] && sequence[j] !== sequence[i - 1]) {
          [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
          break;
        }
      }
    }
  }
  return sequence;
}

function generateRationale(park, dayIndex, totalDays, a, date, isRepeatVisit, sequence = []) {
  const isArrival = dayIndex === 0;
  const isDeparture = dayIndex === totalDays - 1 && totalDays > 1;
  const hasYoungKids = a.party.kids > 0 || a.party.under3 > 0;
  const allCoasters = a.intensity === 'all';
  const splitIntensity = a.intensity === 'split';
  const calmOnly = a.intensity === 'calm';
  const onProperty = a.property === 'on';
  const rhythm = resolveRhythm(a);
  const ropeDrop = rhythm === 'rope';
  const splitRhythm = rhythm === 'split';
  const lateStart = rhythm === 'late';
  const earlyEvenings = a.evenings === 'early';
  const lateEvenings = a.evenings === 'late';
  const arrival = a.arrival || 'morning';
  const restDayType = a.restDayType || 'full';
  const crowd = date ? estimateCrowd(date, park) : null;
  const dayName = date ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getDay()] : null;
  const wantedRides = a.rides || [];
  const resort = onProperty ? a.resort : null;

  if (park === 'Travel day') {
    return {
      headline: "Arrival day. You're getting in late — no parks tonight.",
      morning: "Travel.",
      afternoon: "Land, get to the resort, check in. If you're early enough, drop bags and explore the resort grounds.",
      evening: onProperty ? "Resort dinner — somewhere relaxed near where you're staying. Early to bed; the real trip starts tomorrow." : "Dinner near your hotel. Early night.",
    };
  }
  if (park === 'Water park') {
    const openPref = a.waterParkOpen;
    let headline;
    if (openPref === 'typhoon') headline = "Typhoon Lagoon day — the one you told us was open. Different rhythm, different rules.";
    else if (openPref === 'blizzard') headline = "Blizzard Beach day — the one you told us was open. Different rhythm, different rules.";
    else if (openPref === 'both') headline = "Water park day. Because you said both are open, take your pick on the day — Typhoon Lagoon for theming, Blizzard Beach for slides.";
    else headline = "Water park day. You weren't sure which is open for your dates, so check Disney's calendar to confirm Typhoon Lagoon or Blizzard Beach before you go.";
    return {
      headline,
      morning: "Arrive around opening — slides queue up faster than rides do, so the early-morning advantage is real. Wear swimwear under your clothes.",
      afternoon: "Stay through the heat — the water keeps everyone cool and queues are shortest mid-afternoon. If you want a park evening as well, leave the water park by around 4pm. Cabana hire (~$300+) is the splurge that makes this a different experience.",
      evening: "Most families are done after a water park — out by 4-5pm for a quieter night. But if energy's holding up, you've left in time to hop to a park for the evening: dinner and a nighttime show is very doable.",
    };
  }
  if (park === 'Rest day') {
    if (restDayType === 'morning') {
      return {
        headline: "Rest day — morning off, evening park visit.",
        morning: "Sleep in. Pool morning.",
        afternoon: "Late lunch at the resort. Get ready for an evening park trip.",
        evening: "Evening at MK or HS — fireworks viewing, a few rides on the way out.",
      };
    }
    if (restDayType === 'evening') {
      return {
        headline: "Half-day park — morning only, then rest.",
        morning: "Rope drop a park near your resort. Out by 1pm.",
        afternoon: "Pool afternoon.",
        evening: hasYoungKids ? "Early dinner at the resort." : "Resort dinner or a quiet off-property meal.",
      };
    }
    return {
      headline: "Rest day. The smartest day of the trip.",
      morning: "Sleep in. Pool morning. The kids will thank you and the next park day will go better.",
      afternoon: "Disney Springs if you want to be out — free entry, decent food. Otherwise stay at the resort.",
      evening: hasYoungKids ? "Early dinner, early night. Reset for the next park day." : "Resort restaurant or off-property for something different.",
    };
  }

  const useLLToday = a.lightning === 'always' ? true : a.lightning === 'none' ? false : shouldBuyLL({ park, crowd: crowd || 5 }, a);
  const isDay1ShortVisit = isArrival && (arrival === 'midday' || arrival === 'evening');

  // For split-day rhythm: pick a different park for the evening return (everyone doing splits has a hopper).
  // Prefer a park that pairs well for an evening — fireworks/showcase parks, and not the same as the morning.
  let splitEveningPark = null;
  if (splitRhythm && !isArrival && !isDeparture && ['Magic Kingdom', 'EPCOT', 'Hollywood Studios', 'Animal Kingdom'].includes(park)) {
    const eveningCandidates = ['EPCOT', 'Magic Kingdom', 'Hollywood Studios']; // good evening parks, AK closes early
    splitEveningPark = eveningCandidates.find(c => c !== park) || null;
  }

  const headline = buildHeadline({ park, dayName, crowd, isArrival, isDeparture, hasYoungKids, allCoasters, calmOnly, splitIntensity, isRepeatVisit, isDay1ShortVisit, arrival });
  const morning = buildMorning({ park, useLLToday, isArrival, ropeDrop, lateStart, onProperty, wantedRides, arrival, isDay1ShortVisit, resort, offPropertyTransport: a.offPropertyTransport, isRepeatVisit });
  const afternoon = buildAfternoon({ park, splitRhythm, splitEveningPark, isDeparture, useLLToday, wantedRides, arrival, isDay1ShortVisit, isRepeatVisit });
  const partyNight = park === 'Magic Kingdom' ? partyKind(date) : null; // 'halloween' | 'christmas' | null
  const evening = buildEvening({ park, splitEveningPark, isArrival, isDeparture, lateEvenings, earlyEvenings, hasYoungKids, ropeDrop, isDay1ShortVisit, isRepeatVisit, arrival, hopper: a.hopper, resort, partyNight });

  return { headline, morning, afternoon, evening, eveningPark: splitEveningPark };
}

function buildHeadline({ park, dayName, crowd, isArrival, isDeparture, hasYoungKids, allCoasters, calmOnly, splitIntensity, isRepeatVisit, isDay1ShortVisit, arrival }) {
  if (isDay1ShortVisit) {
    if (arrival === 'evening') return `Arrival day. You're getting in late afternoon — ${park} is the right shout for a relaxed evening visit.`;
    return `Arrival day. You're getting in midday — half-day at ${park}, taking it easy.`;
  }
  if (isArrival) {
    if (park === 'Animal Kingdom') return "An easy first day. Animal Kingdom closes earlier than the others, and a half-day here is the gentlest landing.";
    if (park === 'EPCOT') return "EPCOT works as an arrival day in a way the others don't — World Showcase doesn't demand the early start, you can leave whenever you've had enough.";
    return "Arrival day. We've kept it light — get your bearings, plan the real day tomorrow.";
  }
  if (isDeparture) return "Last day. Out by mid-afternoon to make the flight, so we've put a park here that doesn't punish a half-day.";

  const crowdLead = crowd !== null && dayName ? (
    crowd <= 3 ? `${dayName} is the quietest day in your window for ${park} — that's why it lands here. ` :
    crowd <= 5 ? `${dayName} is the best ${park} day we have. ` :
    crowd >= 8 ? `${dayName} won't be quiet, but it's the best slot for ${park} given the rest of your week. ` : ''
  ) : '';

  if (isRepeatVisit) {
    if (park === 'Magic Kingdom') return crowdLead + "Second Magic Kingdom day — and there's still plenty to do. We've routed this one differently to the first.";
    if (park === 'EPCOT') return crowdLead + "Second EPCOT day. The first wasn't enough — this one's for everything you didn't get to.";
    if (park === 'Hollywood Studios') return crowdLead + "Second Hollywood Studios day — usually because the first was too short to do Galaxy's Edge properly.";
    return crowdLead + `Second ${park} day. Whatever you missed last time, this is your shot.`;
  }
  if (park === 'Magic Kingdom') {
    if (hasYoungKids) return crowdLead + "Magic Kingdom is the deepest park you'll visit. Front-load it while everyone's fresh.";
    if (allCoasters) return crowdLead + "The headliner day. Tron, Space Mountain, Big Thunder, Seven Dwarfs — all worth queueing for.";
    return crowdLead + "The iconic day. The castle, the parade, the fireworks.";
  }
  if (park === 'EPCOT') return crowdLead + "EPCOT rewards a longer, slower day. Future World rides in the morning, then drift into World Showcase.";
  if (park === 'Hollywood Studios') {
    if (splitIntensity) return crowdLead + "The most ride-dense park in the resort, and the one Rider Swap was made for.";
    if (calmOnly) return crowdLead + "Galaxy's Edge, Toy Story Land, and Mickey & Minnie's Runaway Railway carry it for a calmer party.";
    return crowdLead + "Hollywood Studios is the most ride-dense park in the resort and the most punishing if you don't plan.";
  }
  if (park === 'Animal Kingdom') return crowdLead + "Animal Kingdom closes earlier and feels different — it's a park designed to be wandered.";
  return crowdLead;
}

function buildMorning({ park, useLLToday, isArrival, ropeDrop, lateStart, onProperty, wantedRides, arrival, isDay1ShortVisit, resort, offPropertyTransport, isRepeatVisit }) {
  if (isDay1ShortVisit) {
    if (arrival === 'evening') return "Travel and check in. Get to the resort, drop bags, eat early.";
    if (arrival === 'midday') return "Travel. Land, get to the resort, drop bags as fast as you can.";
  }
  if (isArrival) return "Get to the park around lunch. Don't try to do too much.";
  if (isRepeatVisit) {
    const llTargets = getLLTargets(park, wantedRides);
    const llLine = useLLToday && llTargets.length ? ` Save Multi Pass for ${llTargets.slice(0, 2).join(' and ')}.` : '';
    if (park === 'Magic Kingdom') return `You cleared the mountains last time, so ease into this one — a relaxed start for anything worth repeating, or Tron if it beat you on day one.${llLine}`;
    if (park === 'EPCOT') return `Future World's headliners are behind you, so this morning is for the pavilions and rides you skipped — and the festival booths before they get busy.${llLine}`;
    if (park === 'Hollywood Studios') return `You've done Galaxy's Edge once, so go straight back for Rise of the Resistance at rope drop if it got away, then re-ride your favourites.${llLine}`;
    return `Second time here — you know the layout now, so head for whatever you ran out of time for. A calmer start than the first visit.${llLine}`;
  }
  const ropeDropTargets = getRopeDropTargets(park, wantedRides);
  const llTargets = getLLTargets(park, wantedRides);
  if (lateStart) return `Late start today — arrive around 11am. Skip rope drop and use Multi Pass for ${llTargets.slice(0,2).join(' and ') || 'the headliners'}.`;
  let transportLine = '';
  if (resort && onProperty) {
    const transport = getResortTransport(resort, park);
    const walkable = isResortWalkable(resort, park);
    if (walkable) transportLine = `You can walk to ${park} from ${resort} — leave by 7:45am to beat the bus crowd.`;
    else if (transport === 'monorail-walk' || transport === 'monorail-bus') transportLine = `Monorail to ${park} from ${resort} — first monorail runs around 7am.`;
    else if (transport === 'skyliner') transportLine = `Skyliner from ${resort} starts running at 7:30am — be in line at 7:15am.`;
    else if (transport === 'boat') transportLine = `Boat from ${resort} to ${park} — first boat runs around 7:15am.`;
    else transportLine = `Bus to ${park} from ${resort} — be at the bus stop by 7am.`;
  } else if (!onProperty && offPropertyTransport) {
    if (offPropertyTransport === 'rental') transportLine = `Drive to ${park} — leave 75 minutes before park opening.`;
    else if (offPropertyTransport === 'rideshare') transportLine = `Book the Uber 45 minutes before park opening.`;
    else if (offPropertyTransport === 'mears') transportLine = `Mears Connect drops at the parks 30-45 minutes before opening.`;
    else if (offPropertyTransport === 'walk') transportLine = `Walk or hotel shuttle to ${park} — leave 60 minutes before opening.`;
  }
  let prose = transportLine ? `${transportLine} ` : `Be at the gate ${onProperty ? '30' : '45'} minutes before opening. `;
  prose += `${onProperty ? 'Use Early Theme Park Entry — ' : ''}rope drop targets: ${ropeDropTargets.join(', then ')}.`;
  if (useLLToday && llTargets.length) prose += ` Multi Pass priority: ${llTargets.slice(0,2).join(' and ')}.`;
  else if (!useLLToday) prose += ` Without Multi Pass the first 90 minutes are everything.`;
  return prose;
}

function buildAfternoon({ park, splitRhythm, splitEveningPark, isDeparture, useLLToday, wantedRides, arrival, isDay1ShortVisit, isRepeatVisit }) {
  if (isDay1ShortVisit) {
    if (arrival === 'evening') return "Resort check-in. Maybe pool for an hour if there's time.";
    if (arrival === 'midday') return `Get to ${park} by 3pm. Head straight for one or two headliners on standby — don't bother with Multi Pass for a half-day.`;
  }
  if (isDeparture) return "Hit the things you missed, then go.";
  if (splitRhythm) {
    return splitEveningPark
      ? `Back to the resort from about 1pm — pool, lunch, a proper break through the hottest hours. You'll head out again this evening, but to ${splitEveningPark} rather than back here.`
      : "Pool break from 1 to 4pm. Park is at its hottest and busiest now.";
  }
  if (isRepeatVisit) {
    if (park === 'Magic Kingdom') return "Afternoon is for the corners you skipped — Tom Sawyer Island, the People Mover, a slower wander through the lands you rushed first time.";
    if (park === 'EPCOT') return "Work the World Showcase pavilions you didn't reach last time — and on this visit, actually sit down to eat in one.";
    if (park === 'Hollywood Studios') return "Re-ride your favourites as the afternoon lines settle, and catch a show you missed — Indiana Jones or the Frozen sing-along.";
    if (park === 'Animal Kingdom') return "A slower afternoon — the trails and the river boat you didn't reach, at the park's own unhurried pace.";
  }
  if (park === 'Magic Kingdom') return useLLToday ? "Use the rest of your Multi Pass slots mid-afternoon. Sit-down lunch around 2pm." : "Hit the lower-demand rides — Mansion, Pirates, the People Mover. Sit-down lunch around 2pm.";
  if (park === 'EPCOT') return "Afternoon is World Showcase time. Walk it counter-clockwise from Mexico.";
  if (park === 'Hollywood Studios') return useLLToday ? "Galaxy's Edge in the afternoon. Use remaining Multi Pass slots on Tower of Terror or Rock 'n' Roller Coaster." : "Galaxy's Edge in the afternoon. Tower of Terror queues actually drop after lunch.";
  if (park === 'Animal Kingdom') return "Animal trails in the afternoon — Maharajah Jungle Trek and Gorilla Falls.";
  return "";
}

function buildEvening({ park, splitEveningPark, isArrival, isDeparture, lateEvenings, earlyEvenings, hasYoungKids, ropeDrop, isDay1ShortVisit, isRepeatVisit, arrival, hopper, resort, partyNight }) {
  if (isDay1ShortVisit) {
    if (arrival === 'evening') return `Evening at ${park}. Pick one or two headliners on standby — or a single Lightning Lane Single Pass if there's one ride you can't miss. Not worth Multi Pass for a few hours.`;
    if (arrival === 'midday') return "Stay through to closing if you can.";
  }
  if (isArrival) return "Dinner at the resort or somewhere off-park. Early to bed.";
  if (isDeparture) return "";
  // Split-day rhythm: head out to a different park for the evening
  if (splitEveningPark) {
    const reason = {
      'EPCOT': "Ride Test Track or Frozen Ever After on the way in, then dinner around World Showcase and the nighttime show to finish.",
      'Magic Kingdom': "Cooler and lit up at night — ride Seven Dwarfs, Space Mountain and Big Thunder as queues drop, then the Happily Ever After fireworks to close.",
      'Hollywood Studios': "Galaxy's Edge lit up after dark — ride Rise of the Resistance or Tower of Terror in the final hour, and Fantasmic if it's running.",
    }[splitEveningPark] || "A fresh park for the evening.";
    return `Hop to ${splitEveningPark} from around 5pm. ${reason} Evening queues fall fast in the last two hours, so this is prime ride time — the Park Hopper add-on on your tickets lets you hop over once you've tapped into your first park.`;
  }
  if (isRepeatVisit && (hopper === 'yes' || hopper === 'unsure')) {
    const hopTarget = pickEveningHopTarget(park, resort);
    if (hopTarget) return `Park hopper move: from 5pm, hop to ${hopTarget} for the evening — ${getEveningHopReason(hopTarget)}.`;
  }
  if (earlyEvenings) {
    if (park === 'Animal Kingdom') return "Park closes earlier here anyway — you're out by 7 or 8.";
    return "You're heading out before the closing show. Focus on rides you want to repeat — queues drop in the final 30 minutes.";
  }
  if (park === 'Magic Kingdom') {
    if (partyNight) {
      const name = partyNight === 'christmas' ? 'Christmas Party' : 'Halloween Party';
      return `Tonight is a ${name} night — the park closes to day-ticket guests at 6pm and the regular fireworks don't run. Be out by 6, or you'll need a separate party ticket. Save the fireworks for another evening.`;
    }
    return lateEvenings || ropeDrop ? "Stay for Happily Ever After fireworks — book a viewing spot 60-90 minutes early on the hub grass." : "Watch fireworks if you can.";
  }
  if (park === 'Hollywood Studios') return lateEvenings ? "Fantasmic at 8pm or 9pm — get there 45 minutes early." : "Ride Rise of the Resistance or Tower of Terror in the last hour.";
  if (park === 'EPCOT') return lateEvenings ? "Eat your way around World Showcase. Stay for the lagoon show." : "World Showcase is the dinner.";
  if (park === 'Animal Kingdom') return "Park closes early — by the time you'd think about evenings here, you're done.";
  return "";
}

function pickEveningHopTarget(currentPark, resort) {
  if (resort && isResortSkyliner(resort)) {
    if (currentPark !== 'EPCOT') return 'EPCOT';
    return 'Hollywood Studios';
  }
  if (resort && (resort === 'BoardWalk' || resort === 'Beach/Yacht Club')) {
    if (currentPark !== 'EPCOT') return 'EPCOT';
    return 'Hollywood Studios';
  }
  if (resort && (resort === 'Contemporary' || resort === 'Polynesian' || resort === 'Grand Floridian')) {
    if (currentPark !== 'Magic Kingdom') return 'Magic Kingdom';
  }
  if (currentPark !== 'EPCOT') return 'EPCOT';
  return 'Magic Kingdom';
}

function getEveningHopReason(park) {
  const reasons = {
    'EPCOT': 'World Showcase, food, lagoon show at 9pm',
    'Magic Kingdom': 'fireworks and the iconic evening atmosphere',
    'Hollywood Studios': "Fantasmic and Galaxy's Edge after dark",
  };
  return reasons[park] || '';
}

function getRopeDropTargets(park, wantedRides) {
  const allTargets = {
    'Magic Kingdom': [
      { id: 'sevendwarfs', name: 'Seven Dwarfs Mine Train' },
      { id: 'tron', name: 'Tron Lightcycle' },
      { id: 'tiana', name: "Tiana's Bayou Adventure" },
      { id: 'peterpan', name: "Peter Pan's Flight" },
      { id: 'spacemountain', name: 'Space Mountain' },
    ],
    'EPCOT': [
      { id: 'guardians', name: 'Guardians of the Galaxy' },
      { id: 'remy', name: "Remy's Ratatouille" },
      { id: 'frozen', name: 'Frozen Ever After' },
      { id: 'testtrack', name: 'Test Track' },
    ],
    'Hollywood Studios': [
      { id: 'slinky', name: 'Slinky Dog Dash' },
      { id: 'rise', name: 'Rise of the Resistance' },
      { id: 'mmrr', name: "Mickey & Minnie's Runaway Railway" },
    ],
    'Animal Kingdom': [
      { id: 'fop', name: 'Flight of Passage' },
      { id: 'navi', name: "Na'vi River Journey" },
      { id: 'everest', name: 'Expedition Everest' },
    ],
  };
  const targets = allTargets[park] || [];
  const wanted = targets.filter(t => wantedRides.includes(t.id));
  if (wanted.length > 0) return wanted.slice(0, 3).map(t => t.name);
  return targets.slice(0, 2).map(t => t.name);
}

function getLLTargets(park, wantedRides) {
  const priorities = {
    'Magic Kingdom': [
      { id: 'sevendwarfs', name: 'Seven Dwarfs (Single Pass)' },
      { id: 'tron', name: 'Tron (Single Pass)' },
      { id: 'tiana', name: "Tiana's Bayou Adventure" },
      { id: 'peterpan', name: "Peter Pan's Flight" },
      { id: 'bigthunder', name: 'Big Thunder Mountain' },
      { id: 'spacemountain', name: 'Space Mountain' },
    ],
    'EPCOT': [
      { id: 'guardians', name: 'Guardians (Single Pass)' },
      { id: 'testtrack', name: 'Test Track' },
      { id: 'frozen', name: 'Frozen Ever After' },
      { id: 'remy', name: "Remy's Ratatouille" },
    ],
    'Hollywood Studios': [
      { id: 'rise', name: 'Rise of the Resistance (Single Pass)' },
      { id: 'slinky', name: 'Slinky Dog Dash' },
      { id: 'tot', name: 'Tower of Terror' },
      { id: 'mmrr', name: "Mickey & Minnie's Runaway Railway" },
    ],
    'Animal Kingdom': [
      { id: 'fop', name: 'Flight of Passage (Single Pass)' },
      { id: 'navi', name: "Na'vi River Journey" },
      { id: 'safari', name: 'Kilimanjaro Safaris' },
      { id: 'everest', name: 'Expedition Everest' },
    ],
  };
  const all = priorities[park] || [];
  const wanted = all.filter(p => wantedRides.includes(p.id));
  if (wanted.length > 0) return wanted.map(p => p.name);
  return all.slice(0, 3).map(p => p.name);
}

function detectFlag(park, dayIndex, totalDays, a, date) {
  if (!date) return null;
  const month = date.getMonth();
  const dow = date.getDay();
  if (park === 'Magic Kingdom') {
    const kind = partyKind(date);
    if (kind === 'christmas') return "Christmas Party night — MK closes early to day guests, no regular fireworks";
    if (kind === 'halloween') return "Halloween Party night — MK closes early to day guests, no regular fireworks";
    const pending = pendingPartySeason(date);
    if (pending === 'christmas') return "Christmas Party season — exact dates not published yet, check back";
    if (pending === 'halloween') return "Halloween Party season — exact dates not published yet, check back";
  }
  if (park === 'EPCOT') {
    if (month >= 0 && month <= 1) return 'Festival of the Arts is on';
    if (month >= 2 && month <= 4) return 'Flower & Garden Festival is on';
    if (month >= 7 && month <= 10) return 'Food & Wine Festival is on';
  }
  return null;
}

function generateHeadline(a) {
  const adults = a.party.adults;
  const teens = a.party.teens;
  const kids = a.party.kids;
  const under3 = a.party.under3;
  const total = adults + teens + kids + under3;
  const numDays = typeof a.days === 'number' ? a.days : 4;
  let party;
  if (total === 1) party = 'a solo trip';
  else if (total === 2 && adults === 2) party = 'two adults';
  else if (kids > 0 && adults > 0) {
    if (kids === 1 && adults === 2) party = 'a family of three';
    else if (kids === 2 && adults === 2) party = 'a family of four';
    else if (kids === 3 && adults === 2) party = 'a family of five';
    else party = `a family of ${total}`;
  } else if (teens > 0 && adults > 0) party = `a party of ${total} with teenagers`;
  else party = `a party of ${total}`;
  return `A ${numDays}-day plan for ${party}.`;
}

// The reveal. Surfaces the decisions the engine actually made as plain strategy statements,
// each with a real why. Every line here is derived from the generated plan or the answers —
// never invented. If a reason isn't genuinely the engine's reason, it doesn't get said.
// Property-driven rhythm. Research is clear: one park per day is the right default; the two-park
// morning/evening split only works on-property with a Park Hopper (fast transit makes the midday
// return cheap). So "unsure" resolves from property + hopper, and a split without a hopper — which
// is impossible — falls back to one park.
function resolveRhythm(a) {
  let r = a.rhythm;
  if (r === 'unsure' || !r) {
    r = (a.property === 'on' && a.hopper === 'yes') ? 'split' : 'rope';
  }
  if (r === 'split' && a.hopper === 'no') r = 'rope';
  return r;
}

function isParkName(p) {
  return p === 'Magic Kingdom' || p === 'EPCOT' || p === 'Hollywood Studios' || p === 'Animal Kingdom';
}

// Muted, functional colour-coding for the at-a-glance grid — enough to scan, restrained enough
// to stay on-brand.
function slotTone(kind) {
  switch (kind) {
    case 'Magic Kingdom':     return { bg: '#ece9f5', fg: '#4b4b7a' };
    case 'EPCOT':             return { bg: '#e6eef4', fg: '#3a5670' };
    case 'Hollywood Studios': return { bg: '#f4e9ec', fg: '#7a4a57' };
    case 'Animal Kingdom':    return { bg: '#e9f0e6', fg: '#4a6342' };
    case 'water':             return { bg: '#e6f0ef', fg: '#3a6660' };
    case 'springs':           return { bg: '#f3ede2', fg: '#7a5e2e' };
    default:                  return { bg: '#f0ede6', fg: '#78716c' };
  }
}

// Turns a generated day into three short slots (morning / midday / evening) for the grid. Derived
// from the same data the day cards use — the evening hop park comes straight from the rationale, so
// the grid and the detailed cards never disagree.
function daySlots(day, a, idx, total) {
  const p = day.park;
  const onProperty = a.property === 'on';
  const rhythm = resolveRhythm(a);
  const isArrival = idx === 0;
  const isDeparture = idx === total - 1 && total > 1;
  const evePark = (day.rationale && day.rationale.eveningPark) || null;
  const ll = day.llmp === true;

  if (p === 'Travel day') {
    return { am: { label: 'Travel', kind: 'travel' }, mid: { label: 'Arrive & check in', kind: 'travel' }, eve: { label: onProperty ? 'Resort dinner' : 'Settle in', kind: 'free' }, ll: false, note: null };
  }
  if (p === 'Rest day') {
    const t = a.restDayType;
    if (t === 'morning') return { am: { label: 'Slow morning', kind: 'rest' }, mid: { label: 'Pool / resort', kind: 'rest' }, eve: { label: 'Evening park', kind: 'free' }, ll: false, note: null };
    if (t === 'evening') return { am: { label: 'Morning park', kind: 'free' }, mid: { label: 'Out by 1pm', kind: 'free' }, eve: { label: 'Pool / resort', kind: 'rest' }, ll: false, note: null };
    return { am: { label: 'Rest', kind: 'rest' }, mid: { label: 'Disney Springs', kind: 'springs' }, eve: { label: 'Easy evening', kind: 'free' }, ll: false, note: null };
  }
  if (p === 'Water park') {
    return { am: { label: 'Water park', kind: 'water' }, mid: { label: 'Water park', kind: 'water' }, eve: { label: 'Free evening', kind: 'free' }, ll: false, note: null };
  }

  const party = (p === 'Magic Kingdom') ? partyKind(day.date) : null;
  const note = party === 'halloween' ? 'Halloween party — out by 6pm'
            : party === 'christmas' ? 'Christmas party — out by 6pm'
            : null;

  let am, mid, eve;
  if (isArrival && (a.arrival === 'evening' || a.arrival === 'midday')) {
    am = { label: 'Arrive & check in', kind: 'travel' };
    mid = { label: onProperty ? 'Settle / pool' : 'Settle in', kind: 'free' };
    eve = { label: p, kind: p };
  } else if (rhythm === 'split' && evePark && !isDeparture) {
    am = { label: p, kind: p };
    mid = { label: onProperty ? 'Resort break' : 'Lunch & slow hours', kind: 'rest' };
    eve = { label: evePark, kind: evePark };
  } else if (rhythm === 'late') {
    am = { label: 'Slow start', kind: 'free' };
    mid = { label: p, kind: p };
    eve = { label: p, kind: p };
  } else if (rhythm === 'morning') {
    am = { label: p, kind: p };
    mid = { label: 'Out by early afternoon', kind: p };
    eve = { label: 'Free evening', kind: 'free' };
  } else {
    am = { label: p, kind: p };
    mid = { label: onProperty ? 'Resort break' : 'Lunch in park', kind: onProperty ? 'rest' : p };
    eve = { label: p, kind: p };
  }
  return { am, mid, eve, ll, note };
}

// Holiday Style archetype — a memorable identity for the plan, derived from the real answer mix
// (thrill, pace, downtime, party). Never a random label; every branch keys off actual inputs.
// Display label for a day's title. The internal park value stays 'Rest day' so the engine and
// sequencing are untouched — we only change what the user sees, so a morning-rest-plus-evening-park
// day is never mislabelled as a full rest day.
// Scannable reference for a Lightning Lane day — "Day 2 (Magic Kingdom, 17 Jul)". On long trips,
// repeated weekday names ("Monday… Monday…") are ambiguous; day number + park + date isn't.
function llDayRef(d, days) {
  const idx = days ? days.indexOf(d) : -1;
  const num = idx >= 0 ? `Day ${idx + 1}` : '';
  const date = d.date ? d.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
  const detail = [d.park, date].filter(Boolean).join(', ');
  return num ? `${num} (${detail})` : detail;
}

function dayLabel(park, a) {
  if (park === 'Rest day') {
    const t = (a && a.restDayType) || 'full';
    if (t === 'morning') return 'Recovery Day';                // rest morning, optional evening park
    if (t === 'evening') return 'Morning Park, Afternoon Off'; // park morning, rest afternoon
    return 'Rest Day';                                         // full rest
  }
  return park;
}

function holidayStyle(a, days) {
  const p = a.party || {};
  const under3 = (p.under3 || 0) > 0;
  const youngKids = under3 || (p.kids || 0) > 0;
  const thrill = a.intensity;
  const rhythm = resolveRhythm(a);
  const noRest = a.restDays === 'none';
  const numRides = (a.rides || []).length;
  const parkDays = days.filter(d => isParkName(d.park)).length;

  if (thrill === 'all' && rhythm === 'rope' && noRest && (a.lightning === 'always' || a.lightning === 'smart')) {
    return { name: 'Big Day Strategist', blurb: 'You came to do it all, and you have the stamina for it. This plan keeps the days long and the headliners front-loaded.' };
  }
  if (thrill === 'all' && numRides >= 4) {
    return { name: 'Ride-Focused Planner', blurb: 'The headliners come first; everything else is built around protecting your shot at them.' };
  }
  if (thrill === 'calm' && (rhythm === 'morning' || rhythm === 'late' || !noRest)) {
    return { name: 'Slow Magic Seeker', blurb: "You're here for the atmosphere, not the queue times. This plan protects the calm and skips the scramble." };
  }
  if (youngKids && (thrill === 'family' || thrill === 'calm' || thrill === 'split') && !noRest) {
    return { name: 'Easygoing Family', blurb: 'Built around little legs and slower mornings, with proper downtime so no one melts down by day three.' };
  }
  if ((thrill === 'all' || thrill === 'family') && noRest && parkDays >= 5) {
    return { name: 'Full-Throttle Explorer', blurb: 'No rest days and plenty of park time — this plan keeps the pace up while landing the big days in the right order.' };
  }
  return { name: 'Balanced Explorer', blurb: 'A bit of everything — thrills, downtime, and room to breathe. This plan balances the must-dos with the energy to enjoy them.' };
}

// Watch Outs — short, titled advisory blocks. Each fires only when the user's real inputs and the
// generated plan warrant it. The Lightning Lane note only appears for "every day", so it never
// contradicts the trip-shape card or the recommendation.
function watchOuts(a, days) {
  const out = [];
  const p = a.party || {};
  const under3 = (p.under3 || 0) > 0;
  const youngKids = under3 || (p.kids || 0) > 0;
  const rhythm = resolveRhythm(a);
  const parkDays = days.filter(d => isParkName(d.park)).length;

  if (a.lightning === 'always') {
    out.push({ title: 'Lightning Lane', body: "You've opted for it every park day. It's the right call on your busiest days; on the quieter ones, standby lines may be short enough to skip." });
  }
  if (a.dining === 'full') {
    out.push({ title: 'Table-service timing', body: "Sit-down meals most days is lovely — just keep them off your busiest park days, so a long lunch doesn't eat into your ride time." });
  }
  if (a.arrival === 'evening' || a.arrival === 'midday') {
    out.push({ title: 'Arrival day', body: "Keep it light. The plan saves the full days for once you've landed and settled — don't force a big park day on top of travel." });
  }
  if (under3 && a.intensity === 'all') {
    out.push({ title: 'Rider Swap', body: "Big coasters with an under-3 means leaning on Rider Swap. Plan for it on those days so no one's left waiting." });
  }
  if (a.property === 'off' && rhythm === 'split') {
    out.push({ title: 'Park hopping', body: "Mid-day returns are tough off-property — the transit eats the day. Staying in one park usually beats hopping." });
  }
  if (parkDays >= 7 && a.restDays === 'none') {
    out.push({ title: 'Pacing', body: "Plenty of park time here — the real risk is overpacking it. With no rest day, the back half can drag; even a half pool morning resets everyone." });
  } else if (a.restDays === 'none' && youngKids && parkDays >= 5) {
    out.push({ title: 'Energy', body: "Young kids and no rest day on a longer trip — the second half is where energy unravels. A half-day off usually saves it." });
  }
  return out.slice(0, 3);
}

// Trip Shape — the plan's profile at a glance, straight from the answers and the built plan.
function tripShape(a, days) {
  const parkDays = days.filter(d => isParkName(d.park)).length;
  const cards = [];
  cards.push({ label: 'Park days', value: String(parkDays) });
  cards.push({ label: 'Pace', value: a.intensity === 'all' ? 'High energy' : a.intensity === 'calm' ? 'Relaxed' : 'Balanced' });
  cards.push({ label: 'Lightning Lane', value: a.lightning === 'always' ? 'Every park day' : a.lightning === 'none' ? 'Not buying' : a.lightning === 'smart' ? 'Where it counts' : "We'll advise" });
  cards.push({ label: 'Dining', value: a.dining === 'full' ? 'Sit-down most days' : a.dining === 'qs' ? 'Quick-service' : a.dining === 'mix' ? 'A few standouts' : "We'll advise" });
  cards.push({ label: 'Downtime', value: a.restDays === 'none' ? 'No rest days' : a.restDays === 'middle' ? 'A mid-trip rest' : a.restDays === 'spread' ? 'Built-in breaks' : "We'll place them" });
  cards.push({ label: 'Where you stay', value: a.property === 'on' ? (a.resort || 'On-property') : 'Off-property' });
  cards.push({ label: 'Ride focus', value: a.intensity === 'all' ? 'All the headliners' : a.intensity === 'family' ? 'Family rides' : a.intensity === 'calm' ? 'Calm rides & shows' : 'A mix' });
  return cards;
}

function generateStrategy(a, days) {
  const PARKS = ['Magic Kingdom', 'EPCOT', 'Hollywood Studios', 'Animal Kingdom'];
  const isPark = (p) => PARKS.includes(p);
  const wd = (d) => (d && d.date) ? d.date.toLocaleDateString('en-GB', { weekday: 'long' }) : null;
  const numDays = days.length;
  const parkDays = days.filter(d => isPark(d.park));
  if (!parkDays.length) return [];
  const firstPark = days.find(d => isPark(d.park));
  const firstParkIdx = days.findIndex(d => isPark(d.park));
  const mkDay = days.find(d => d.park === 'Magic Kingdom');
  const llDays = days.filter(d => d.llmp === true);
  const restDay = days.find(d => d.park === 'Rest day');
  const peakDay = parkDays.reduce((m, d) => (d.crowd || 0) > (m.crowd || 0) ? d : m, parkDays[0]);
  const out = [];

  // 1. Opening move
  if (firstPark) {
    let why;
    if (firstPark.park === 'EPCOT' && mkDay && mkDay !== firstPark) {
      why = "World Showcase is at its best in the evening, so it's a calm, scenic opener — and it lets Magic Kingdom wait for a full day.";
    } else if (firstParkIdx === 0 && (a.arrival === 'evening' || a.arrival === 'midday')) {
      why = "It eases you in on a partial arrival day, without spending your highest-energy hours on the biggest park.";
    } else {
      why = "It's matched to the quietest start in your window, so you begin on a calmer day rather than a busy one.";
    }
    out.push({ decision: `Start at ${firstPark.park}.`, why });
  }

  // 2. Magic Kingdom placement (only when MK isn't already the opener)
  if (mkDay && mkDay !== firstPark && wd(mkDay)) {
    out.push({
      decision: `Save Magic Kingdom for ${wd(mkDay)}.`,
      why: "It's the most ground you'll cover in a day, so it sits on a lower-crowd day — you don't want the park and the queues working against you at once.",
    });
  }

  // 3. Lightning Lane — phrased by what the engine actually recommends
  if (a.lightning === 'none') {
    out.push({
      decision: "Skip Lightning Lane — lean on rope drop instead.",
      why: "You'd rather not pay for it, so the plan front-loads the headliners into the first hour, when the queues are shortest anyway.",
    });
  } else if (llDays.length === 0) {
    out.push({
      decision: "Don't buy Lightning Lane this trip.",
      why: "Your week is quiet enough that an early start covers the big rides — keep the money.",
    });
  } else if (a.lightning === 'always') {
    const heavy = llDays.filter(d => (d.crowd || 0) >= 6);
    const focus = heavy.length ? heavy : llDays;
    const parks = [...new Set(focus.map(d => d.park))].join(' and ');
    out.push({
      decision: "You're buying Lightning Lane daily — spend it where it counts.",
      why: `It earns its keep most on ${parks}; on the quieter days you'd be fine without it.`,
    });
  } else {
    const dayList = llDays.map(d => llDayRef(d, days)).filter(Boolean);
    const parks = [...new Set(llDays.map(d => d.park))];
    const dayPhrase = dayList.length === 1
      ? dayList[0]
      : dayList.slice(0, -1).join(', ') + ' and ' + dayList[dayList.length - 1];
    out.push({
      decision: `Buy Lightning Lane on ${dayPhrase} — skip it the rest.`,
      why: `On ${parks.join(' and ')} the crowds and ride layout earn it back; elsewhere rope drop gets you the same rides for free.`,
    });
  }

  // 4. Rest day
  if (restDay && wd(restDay)) {
    out.push({
      decision: `Take ${wd(restDay)} as a resort day.`,
      why: `On a ${numDays}-day trip, one planned breather is the difference between finishing strong and limping to the end.`,
    });
  }

  // 5. Toughest day
  if (peakDay && (peakDay.crowd || 0) >= 7 && peakDay !== firstPark && wd(peakDay)) {
    out.push({
      decision: `Be at the gate before opening on ${wd(peakDay)}.`,
      why: `${peakDay.park} is your busiest forecast — the first hour there is worth three in the afternoon.`,
    });
  }

  return out.slice(0, 5);
}

function generateSummary(a, days) {
  const hasYoungKids = a.party.kids > 0 || a.party.under3 > 0;
  const numDays = typeof a.days === 'number' ? a.days : 4;
  const noLightning = a.lightning === 'none';
  const onProperty = a.property === 'on';
  const allCoasters = a.intensity === 'all';
  const splitIntensity = a.intensity === 'split';
  const crowdLevels = (days || []).map(d => d.crowd).filter(c => c !== null && c !== undefined);
  const avgCrowd = crowdLevels.length ? crowdLevels.reduce((a,b) => a+b, 0) / crowdLevels.length : null;
  const peakDay = days && days.length ? days.reduce((max, d) => (d.crowd || 0) > (max.crowd || 0) ? d : max, days[0]) : null;
  let lead;
  if (avgCrowd === null) lead = `A ${numDays}-day plan built around your party.`;
  else if (avgCrowd <= 4) lead = `Your dates fall in a quieter week — that changes the maths. Lightning Lane matters less, rope drop matters less, and you can afford to be lazy in the afternoons.`;
  else if (avgCrowd >= 7) lead = `Your dates fall in a busier week, so strategy matters more than usual. Every recommendation below assumes you're committed to early starts.`;
  else lead = `Your week is a moderate-crowd window — the kind where good planning genuinely separates a great trip from a mediocre one.`;
  let structure;
  if (hasYoungKids && numDays >= 4) structure = `We've front-loaded Magic Kingdom while energy is highest, paired the bigger parks with quieter days, and kept the early and late days light.`;
  else if (allCoasters) structure = `Hollywood Studios and Magic Kingdom carry the trip — sequenced onto the lowest-crowd days, with EPCOT and Animal Kingdom absorbing weekend hits.`;
  else if (splitIntensity) structure = `The plan assumes Rider Swap will be a regular feature on the thrill-heavy days.`;
  else structure = `Each park is matched to its quietest day in your window.`;
  let brace = '';
  if (peakDay && peakDay.crowd >= 8) {
    const peakDate = peakDay.date ? peakDay.date.toLocaleDateString('en-GB', { weekday: 'long' }) : null;
    brace = `Your toughest day is ${peakDate ? peakDate + ' at ' : ''}${peakDay.park} — be at the gate before opening.`;
  } else if (noLightning && (allCoasters || splitIntensity)) brace = `You're skipping the Lightning Lane upcharge — but it makes rope drop non-negotiable on the headliner days.`;
  else if (onProperty) brace = `Your on-property stay gives you Early Theme Park Entry — use it every day you're not deliberately taking it slow.`;

  // Honest burnout reassurance — only for ambitious plans that genuinely keep downtime. If they
  // chose all-out with no rest at all, we don't claim to protect them; the watch-out flags it instead.
  let reassurance = '';
  if (allCoasters && a.restDays !== 'none') {
    reassurance = `It's an ambitious plan, but it still protects a proper rest day, so no one burns out halfway through.`;
  } else if (allCoasters && onProperty) {
    reassurance = `It's an ambitious plan, but the midday resort breaks are built in, so it doesn't run everyone into the ground by mid-week.`;
  }

  return [lead, [structure, brace].filter(Boolean).join(' '), reassurance].filter(Boolean);
}

function generateActions(a, days) {
  const hasYoungKids = a.party.kids > 0 || a.party.under3 > 0;
  const onProperty = a.property === 'on';
  const numDays = typeof a.days === 'number' ? a.days : 4;
  const actions = [];
  actions.push({ category: 'Tickets', what: 'Buy park tickets via Undercover Tourist', when: 'Anytime — saves 3-5% versus Disney direct' });
  if (a.hopper === 'yes') actions.push({ category: 'Tickets', what: 'Add Park Hopper to your tickets', when: 'Adds ~$80/person — hop between parks any time once you\u2019ve entered your first' });
  else if (a.hopper === 'unsure') {
    const recommendHopper = numDays <= 4 || a.evenings === 'late' || onProperty;
    actions.push({
      category: 'Tickets',
      what: recommendHopper ? 'Recommend Park Hopper — worth ~$80/person' : 'Skip Park Hopper',
      when: recommendHopper ? 'Worth it for evening flexibility' : 'Stick with single-park tickets',
    });
  }
  if (a.dining === 'full' || a.dining === 'mix' || a.dining === 'unsure') {
    actions.push({ category: 'Dining', what: 'Book sit-down restaurants 60 days out at 7am ET', when: 'The most popular tables go in the first minute' });
    if (hasYoungKids) actions.push({ category: 'Dining', what: "Skip Chef Mickey's — overpriced, mediocre, kids see Mickey for 90 seconds", when: 'Better character meals exist' });
    actions.push({ category: 'Dining', what: "Skip the full Disney Dining Plan unless you're doing 2+ character meals — it rarely saves money otherwise", when: 'Do the maths on your actual meals before committing' });
  }
  if (a.dining === 'qs') {
    actions.push({ category: 'Dining', what: 'If your package includes the Quick Service Dining Plan, these counter-service spots are where to spend the credits', when: 'Mobile Order from the app works with the plan — order while you walk' });
  }
  if (a.lightning === 'always') {
    actions.push({ category: 'Lightning Lane', what: 'Multi Pass selections every park day', when: onProperty ? '7 days before arrival, 7am ET' : '3 days before each park day' });
  } else if (a.lightning === 'smart' || a.lightning === 'unsure') {
    const llDays = days ? days.filter(d => shouldBuyLL(d, a)) : [];
    const parkDays = days ? days.filter(d => ['Magic Kingdom','EPCOT','Hollywood Studios','Animal Kingdom'].includes(d.park)) : [];
    if (llDays.length > 0) {
      const dayLabels = llDays.map(d => llDayRef(d, days));
      actions.push({ category: 'Lightning Lane', what: `Multi Pass on these days: ${dayLabels.join(', ')}`, when: onProperty ? '7 days before arrival, 7am ET' : '3 days before each, 7am ET' });
      if (llDays.length < parkDays.length) {
        actions.push({ category: 'Lightning Lane', what: 'Skip Multi Pass on the other park days — standby is fine there', when: 'Save the money for Single Pass on a headliner or for dining' });
      }
      actions.push({ category: 'Lightning Lane', what: 'Buy Single Pass à la carte for the top headliners (Tron, Rise of the Resistance, Flight of Passage, Seven Dwarfs) on the days you visit those parks', when: 'Morning of — 7am for resort guests, park open for off-property' });
    } else {
      actions.push({ category: 'Lightning Lane', what: parkDays.length > 0 ? "You're in a quiet enough window that standby works — skip Multi Pass and save the money" : 'Add your dates to get a per-day Multi Pass recommendation', when: parkDays.length > 0 ? 'Rope drop discipline does the job at these crowd levels' : 'Crowd levels drive this call' });
    }
  }
  const waterParkDays = days ? days.filter(d => d.park === 'Water park').length : 0;
  if (waterParkDays > 0) {
    if (a.waterParkOpen === 'unsure') {
      actions.push({
        category: 'Water Park',
        what: "Check Disney's calendar — confirm whether Typhoon Lagoon or Blizzard Beach is open during your dates",
        when: 'Usually only one is open at a time — refurbishment schedules rotate',
      });
    }
    actions.push({
      category: 'Water Park',
      what: waterParkDays > 1
        ? 'Add Water Park & Sports option to your ticket — cheaper than separate tickets for two water park days'
        : 'Buy a single water park ticket separately (~$70/person) — or bundle if buying a multi-day Disney pass',
      when: 'Buy with main park tickets via Undercover Tourist for the discount',
    });
  }
  if (onProperty) actions.push({ category: 'Resort', what: 'Confirm Early Theme Park Entry is enabled', when: 'Should be automatic — worth a 30-second check' });
  actions.push({ category: 'App', what: 'Set up My Disney Experience and link tickets', when: "As soon as everything's booked" });
  return actions;
}

function generateDayPriority(d, dayIndex, totalDays, a) {
  const park = d.park;
  const crowd = d.crowd;
  const isArrival = dayIndex === 0;
  const isDeparture = dayIndex === totalDays - 1 && totalDays > 1;
  const hasYoungKids = a.party.kids > 0 || a.party.under3 > 0;
  const hasTeens = a.party.teens > 0;
  const ropeDrop = resolveRhythm(a) === 'rope';

  if (park === 'Travel day') return "Settle in. The trip starts properly tomorrow — rest tonight.";
  if (park === 'Rest day') return "Protect energy. This day is what stops the trip falling apart later — don't be tempted to sneak in a park.";
  if (park === 'Water park') return "Switch off. Different pace, no rush — this is the day that recharges everyone for the back half.";

  if (isArrival) return "Ease in. Don't try to win the trip on day one — get your bearings and save the energy.";
  if (isDeparture) return "Loose ends. Hit the one or two things you missed, then go out on a high.";

  // Energy-management priorities mid-trip
  if (hasTeens && dayIndex >= 4 && dayIndex <= 6 && ropeDrop) {
    return "Watch the energy. This is where teens crash if every day's been rope-to-close. Consider a slower start.";
  }
  if ((park === 'Hollywood Studios' || park === 'Magic Kingdom') && crowd && crowd >= 7) {
    return "Get the first 90 minutes right. On a day this busy, what you do before 10am decides the whole day.";
  }
  if (park === 'Hollywood Studios') {
    return "Win the morning. This is the hardest park to do well — rope drop discipline matters most here.";
  }
  if (park === 'Magic Kingdom' && hasYoungKids) {
    return "Front-load the magic. Hit the headliners while everyone's fresh; the afternoon is for slowing down.";
  }
  if (park === 'EPCOT') {
    return "Pace it. EPCOT is a marathon, not a sprint — rides in the morning, eat and wander the afternoon.";
  }
  if (park === 'Animal Kingdom') {
    return "Go early, leave early. The animals and the headliners are both best in the morning here.";
  }
  return "Rope drop the rides you care about, then let the day breathe.";
}

function generateDayTip(d, dayIndex, a) {
  const park = d.park;
  if (park === 'Travel day') return "Set up My Disney Experience tonight and link your tickets — don't do it in the queue tomorrow.";
  if (park === 'Rest day') return "Disney Springs is free to enter and a good low-effort outing if the resort feels too quiet.";
  if (park === 'Water park') return "Get there at opening — slides back up faster than rides, so the early advantage is bigger than you'd think.";

  const tips = {
    'Magic Kingdom': "Peter Pan's Flight builds the longest queue for the least ride — do it at rope drop or via Multi Pass, never standby midday.",
    'EPCOT': "Walk World Showcase counter-clockwise from Mexico — you'll stay ahead of the crowd flowing the obvious way.",
    'Hollywood Studios': "Slinky Dog Dash is the hardest Multi Pass to get here — book it the moment your window opens, before anything else.",
    'Animal Kingdom': "Flight of Passage builds the longest wait in all of Disney World — rope drop it or buy the Single Pass, full stop.",
  };
  return tips[park] || "Refresh the app for Lightning Lane drops — cancellations appear constantly through the day.";
}

function generateTips(a) {
  const tips = [];

  // The genuine insider tier — specific, researched, the stuff that changes a trip.
  tips.push({ title: 'Watch the Magic Kingdom fireworks from Gaston\'s Tavern', body: "Everyone packs onto Main Street an hour early. Head behind the castle to the outdoor seating by Gaston's Tavern in New Fantasyland instead — you get a calm, unique view of the show without camping out for a spot, and you're near Seven Dwarfs for a near-walk-on right after." });
  tips.push({ title: 'Off-site? Rope drop Frontierland, not Fantasyland', body: "Early Entry resort guests flood Fantasyland and Tomorrowland first. If you don't have Early Entry, head the opposite way to Frontierland or Adventureland at opening — Big Thunder and Tiana's Bayou Adventure will be near walk-ons while everyone else queues for Seven Dwarfs." });
  tips.push({ title: 'Bundle your rope drop rides by location', body: "The first 60-90 minutes are worth more than any other part of the day — headliner waits run 50-70% shorter than midday. Don't crisscross the park: do Seven Dwarfs then Winnie the Pooh (both Fantasyland), or Space Mountain then Buzz (both Tomorrowland). You can clear 4-6 major rides before most people finish their first." });
  tips.push({ title: 'Use the Tangled bathrooms shortcut', body: "There's a hidden walkway by the Tangled-themed restrooms between Fantasyland and Liberty Square that locals use to cut across the park fast at rope drop. It's the quickest pivot if your first-choice ride is down when you arrive — and something always is." });
  tips.push({ title: 'Keep modifying your Lightning Lane to a better ride', body: "Once you've booked a Multi Pass slot you can keep changing it. Book the easiest available ride just to start the clock, then modify it upward as better times appear. Refresh obsessively — that's how people snag Seven Dwarfs at 2pm." });
  tips.push({ title: 'Arrive 45-60 minutes before posted opening', body: "If you show up at the official opening time, you're already late — the rope-drop advantage is gone. Magic Kingdom is worst for this because you park at the TTC and still have a monorail or ferry to go. Build in the extra hop." });
  tips.push({ title: "Never book a sit-down lunch between 12 and 2", body: "A midday table eats the exact 90 minutes when rope-drop momentum and Lightning Lane matter most. Book meals for 11am or after 4pm — prime ride hours stay free and the restaurants are quieter anyway." });
  tips.push({ title: 'Your on-ride photos are already in the app', body: "On-ride and character photos sync to My Disney Experience automatically. They're only free to download if you've added Memory Maker (or it's included in your package) — otherwise you can view them in the app but pay to download. Always check there before buying prints at a kiosk." });
  tips.push({ title: 'Rain is your friend, not your enemy', body: "Summer storms are daily and brief — they pass in 30 minutes and the crowds flee. A £1 poncho from home turns a downpour into the quietest, fastest hour of your day." });

  return tips;
}

function shouldBuyLL(day, a) {
  const crowd = day.crowd || 5;
  const allCoasters = a.intensity === 'all';
  const splitIntensity = a.intensity === 'split';
  // Hollywood Studios — hardest park to do without it; worth it from moderate crowds up
  if (day.park === 'Hollywood Studios' && crowd >= 5) return true;
  // Magic Kingdom — worth it once busy, or earlier for thrill-focused parties
  if (day.park === 'Magic Kingdom' && crowd >= 5) return true;
  // EPCOT and Animal Kingdom — less ride-dependent, but still worth it on genuinely busy days
  if ((day.park === 'EPCOT' || day.park === 'Animal Kingdom') && crowd >= 7) return true;
  return false;
}
