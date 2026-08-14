import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, ArrowRight, Gauge, Radar as RadarIcon, Crosshair, Quote } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Reveal, EASE, StanceChip, Meter, MomentumMeter, Radial, Sparkline } from "@/components/primitives";

function Nav() {
  return (
    <div className="fixed top-4 left-0 right-0 z-50 px-4">
      <nav className="mx-auto flex max-w-6xl items-center justify-between glass rounded-2xl px-4 py-2.5 pl-5">
        <Logo />
        <div className="hidden sm:flex items-center gap-7 text-sm text-snow-dim">
          <a href="#room" className="hover:text-snow transition-colors duration-300">The Room</a>
          <a href="#intel" className="hover:text-snow transition-colors duration-300">Intelligence</a>
          <a href="#how" className="hover:text-snow transition-colors duration-300">How it works</a>
        </div>
        <Link to="/login" data-testid="landing-cta-nav"
          className="flex items-center gap-1.5 rounded-xl bg-signal px-4 py-2 text-sm font-medium text-ink-900 hover:bg-signal-bright transition-colors duration-300 active:scale-[0.98]">
          Start training <ArrowUpRight size={15} />
        </Link>
      </nav>
    </div>
  );
}

function RoomPreview() {
  const trend = [40, 44, 41, 52, 58, 55, 64, 71];
  return (
    <div className="panel p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-3">
          <img src="https://images.unsplash.com/photo-1758599543125-0a927f1d7a3b?crop=entropy&cs=srgb&fm=jpg&q=85&w=200" alt="" className="h-9 w-9 rounded-xl object-cover" />
          <div>
            <p className="text-sm text-snow leading-tight">Marissa Vail</p>
            <p className="text-[0.7rem] text-snow-mute font-mono">HEAD OF PROCUREMENT</p>
          </div>
        </div>
        <StanceChip stance="Firm" />
      </div>
      <div className="space-y-3 py-4 text-sm">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-4 py-3 text-snow-dim leading-relaxed">
          You're 30% above where we need to be. Tell me why I shouldn't take that to your competitor.
        </div>
        <div className="ml-auto max-w-[82%] rounded-xl bg-signal/10 border border-signal/20 px-4 py-3 text-snow leading-relaxed">
          Because they tried them last year. Let's talk about what a two-year commitment unlocks instead.
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-5 border-t border-white/[0.06] pt-4 items-center">
        <div className="space-y-3">
          <Meter label="Deal health" value={64} tone="mint" hint="%" />
          <MomentumMeter value={38} />
        </div>
        <Radial value={71} size={92} stroke={7} tone="signal" label="Position" />
      </div>
      <div className="mt-3 -mb-1"><Sparkline data={trend} tone="signal" height={30} /></div>
    </div>
  );
}

export default function Landing() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const previewY = useTransform(scrollYProgress, [0, 1], [0, 70]);

  return (
    <div className="relative">
      <Nav />

      <section ref={heroRef} className="relative mx-auto max-w-6xl px-6 pt-40 pb-24 lg:pt-48">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-snow-dim mb-7">
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" style={{ boxShadow: "0 0 8px #C7F24C" }} />
              Negotiation training, instrumented
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-semibold leading-[1.02] tracking-tight text-snow text-balance">
              The cockpit for
              <br />high-stakes <span className="text-signal">negotiation.</span>
            </h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-7 max-w-md text-snow-dim leading-relaxed">
              Rehearse the raise, the term sheet, the renewal — against an AI counterpart that pushes back.
              Watch momentum, leverage and deal health move in real time, then get coached on every decision.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.55 }}
              className="mt-9 flex flex-wrap items-center gap-4">
              <Link to="/login" data-testid="hero-cta"
                className="group flex items-center gap-2 rounded-xl bg-signal px-6 py-3.5 font-medium text-ink-900 hover:bg-signal-bright transition-colors duration-300 active:scale-[0.98]">
                Enter the room <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform duration-300" />
              </Link>
              <a href="#how" className="flex items-center gap-2 px-2 py-3.5 text-snow-dim hover:text-snow transition-colors duration-300 text-sm">See how it works</a>
            </motion.div>
            <div className="mt-12 flex items-center gap-8">
              {[["8", "Scenarios"], ["6", "Skill axes"], ["∞", "Reps"]].map(([n, l]) => (
                <div key={l}><div className="num text-2xl text-snow">{n}</div><div className="overline mt-1">{l}</div></div>
              ))}
            </div>
          </div>
          <motion.div style={{ y: previewY }}>
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.3, ease: EASE }}>
              <RoomPreview />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-5 flex flex-wrap items-center gap-y-3 gap-x-8 text-snow-mute text-xs font-mono">
          {["SALARY & COMP", "ENTERPRISE SALES", "PROCUREMENT", "FUNDRAISING", "VENDOR RENEWALS", "EXECUTIVE EXITS"].map((t) => (
            <span key={t} className="tracking-[0.14em]">{t}</span>
          ))}
        </div>
      </section>

      {/* THE ROOM */}
      <section id="room" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal>
          <p className="overline mb-4">The negotiation room</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-snow max-w-2xl text-balance">
            Not a chatbot. A room that reacts to how you play.
          </h2>
        </Reveal>
        <div className="mt-14 grid md:grid-cols-3 gap-4">
          {[
            { icon: Gauge, t: "Live momentum", d: "Every message shifts the balance of power. Momentum swings visibly toward you — or away — as the exchange unfolds." },
            { icon: RadarIcon, t: "Opponent state", d: "Read your counterpart's stance and sentiment as it hardens or softens. Silence and framing move the needle." },
            { icon: Crosshair, t: "Deal health", d: "A running read on how close you are to an agreement worth taking — anchored to your target and BATNA." },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 0.08}>
              <div className="panel p-7 h-full hover-lift hover:border-white/12">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-signal/10 text-signal"><f.icon size={18} /></div>
                <h3 className="mt-6 text-lg text-snow">{f.t}</h3>
                <p className="mt-2 text-sm text-snow-dim leading-relaxed">{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* INTELLIGENCE / COACHING */}
      <section id="intel" className="border-t border-white/[0.06] bg-white/[0.012]">
        <div className="mx-auto max-w-6xl px-6 py-28 grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div className="panel p-8">
              <div className="flex items-center justify-between">
                <p className="overline">Post-session intelligence</p>
                <span className="text-xs text-mint font-mono">DEAL REACHED</span>
              </div>
              <div className="mt-6 flex items-center gap-8">
                <Radial value={87} size={128} tone="mint" label="Overall" />
                <div className="flex-1 space-y-3">
                  <Meter label="Persuasion" value={91} tone="signal" />
                  <Meter label="Leverage" value={78} tone="amber" />
                  <Meter label="Listening" value={84} tone="mint" />
                </div>
              </div>
              <p className="mt-7 border-t border-white/[0.06] pt-5 text-sm text-snow-dim leading-relaxed">
                <span className="text-snow">Where you lost leverage — </span>you revealed your walk-away too early, letting the opponent anchor to it.
              </p>
            </div>
          </Reveal>
          <div>
            <Reveal><p className="overline mb-4">The coaching report</p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-snow text-balance">A scouting report on how you negotiate.</h2></Reveal>
            <div className="mt-9 space-y-6">
              {[
                ["What worked", "The exact tactics and phrasing that actually moved your counterpart."],
                ["Where you lost leverage", "The moments your bargaining power slipped — and why."],
                ["What to change next", "Concrete adjustments and a recommended scenario to drill them."],
              ].map(([t, d], i) => (
                <Reveal key={t} delay={i * 0.08}>
                  <div className="flex gap-4">
                    <span className="num text-signal">0{i + 1}</span>
                    <div><h3 className="text-snow">{t}</h3><p className="mt-1 text-sm text-snow-dim leading-relaxed">{d}</p></div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal><p className="overline mb-12">How it works</p></Reveal>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: "Choose your room", d: "Pick a scenario. Read the brief: role, objective, target, BATNA, stakes." },
            { n: "Negotiate live", d: "Trade turns with an AI counterpart while intelligence updates in real time." },
            { n: "Get coached", d: "Close out and receive a full performance profile with a plan for the rematch." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="panel p-8 h-full">
                <span className="num text-2xl text-white/15">0{i + 1}</span>
                <h3 className="mt-6 text-lg text-snow">{s.n}</h3>
                <p className="mt-2 text-sm text-snow-dim leading-relaxed">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PROOF */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-24 grid lg:grid-cols-3 gap-4">
          {[
            { q: "Watching momentum swing when I went quiet was the whole lesson.", a: "Series B founder" },
            { q: "Ran the salary room six times before my review. Walked in on autopilot.", a: "Staff engineer" },
            { q: "It caught a concession pattern I'd missed in a decade of real deals.", a: "Head of Sales" },
          ].map((t, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="panel p-7 h-full flex flex-col justify-between">
                <div><Quote size={18} className="text-signal/60" /><p className="mt-5 text-snow leading-relaxed">{t.q}</p></div>
                <p className="mt-8 overline">{t.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-6 py-28 text-center">
          <Reveal>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-snow text-balance leading-[1.05]">
              Your next hard conversation<br />is already on the calendar.
            </h2>
            <p className="mx-auto mt-6 max-w-md text-snow-dim leading-relaxed">Rehearse it tonight. Walk in tomorrow like it's a rerun.</p>
            <Link to="/login" data-testid="final-cta"
              className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-signal px-8 py-4 font-medium text-ink-900 hover:bg-signal-bright transition-colors duration-300 active:scale-[0.98]">
              Start training <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform duration-300" />
            </Link>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-wrap items-center justify-between gap-4">
          <Logo />
          <p className="text-xs text-snow-mute font-mono">© {new Date().getFullYear()} NEGOTIO — THE NEGOTIATION COCKPIT</p>
        </div>
      </footer>
    </div>
  );
}
