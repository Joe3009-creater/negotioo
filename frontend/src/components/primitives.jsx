import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, animate } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1];

export const TONES = {
  signal: "#C7F24C",
  mint: "#4CE0A1",
  amber: "#F5C24B",
  coral: "#FF6B5E",
  slate: "#9298A2",
};

// score -> tone
export function scoreTone(v) {
  if (v >= 78) return "mint";
  if (v >= 58) return "signal";
  if (v >= 40) return "amber";
  return "coral";
}

export function Reveal({ children, delay = 0, y = 16, className = "", as = "div" }) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

export function CountUp({ value = 0, duration = 1.1, decimals = 0, className = "", suffix = "", prefix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, {
      duration, ease: EASE,
      onUpdate: (v) => setDisplay(decimals ? Number(v.toFixed(decimals)) : Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration, decimals, mv]);
  return <span ref={ref} className={className}>{prefix}{display}{suffix}</span>;
}

// Layered surface
export function Panel({ children, className = "", hover = false, onClick, testid, glow = false, as = "div" }) {
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      onClick={onClick}
      data-testid={testid}
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ duration: 0.45, ease: EASE }}
      className={`panel ${hover ? "hover-lift hover:border-white/12" : ""} ${glow ? "lum-edge" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Overline({ children, className = "" }) {
  return <p className={`overline ${className}`}>{children}</p>;
}

// Radial gauge with animated arc + count-up
export function Radial({ value = 0, size = 132, stroke = 8, tone = "signal", label, sub, children }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = TONES[tone] || tone;
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, { duration: 1.2, ease: EASE, onUpdate: setV });
    return () => controls.stop();
  }, [inView, value]);
  return (
    <div ref={ref} className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (v / 100) * c}
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children || (
          <div>
            <div className="num text-3xl text-snow leading-none">{Math.round(v)}</div>
            {label && <div className="overline mt-1.5">{label}</div>}
            {sub && <div className="text-[0.6rem] text-snow-mute mt-0.5">{sub}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// Linear precision meter
export function Meter({ label, value = 0, max = 100, tone = "signal", hint, right }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = TONES[tone] || tone;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-snow-dim">{label}</span>
        <span className="num text-xs text-snow tabular-nums">{right ?? `${Math.round(value)}${hint || ""}`}</span>
      </div>
      <div className="h-1.5 w-full bg-white/[0.06] overflow-hidden rounded-full">
        <motion.div className="h-full rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
          initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }} />
      </div>
    </div>
  );
}

// Center-origin momentum meter (-100..100). Green = user, coral = opponent.
export function MomentumMeter({ value = 0, showLabels = true }) {
  const clamped = Math.max(-100, Math.min(100, value));
  const half = clamped / 2;
  const positive = clamped >= 0;
  const color = positive ? TONES.signal : TONES.coral;
  return (
    <div>
      {showLabels && (
        <div className="flex items-center justify-between mb-2">
          <span className="overline">Them</span>
          <span className="num text-xs text-snow">{clamped > 0 ? "+" : ""}{clamped}</span>
          <span className="overline">You</span>
        </div>
      )}
      <div className="relative h-2 w-full bg-white/[0.06] rounded-full">
        <div className="absolute left-1/2 top-1/2 h-3.5 w-px -translate-y-1/2 bg-white/25" />
        <motion.div className="absolute top-0 h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 10px ${color}77`, left: positive ? "50%" : `${50 + half}%` }}
          initial={{ width: 0 }} animate={{ width: `${Math.abs(half)}%` }} transition={{ duration: 0.7, ease: EASE }} />
      </div>
    </div>
  );
}

const STANCE = {
  Aggressive: { c: "#FF6B5E", d: "hostile" },
  Firm: { c: "#F5C24B", d: "holding" },
  Guarded: { c: "#F5C24B", d: "cautious" },
  Neutral: { c: "#9298A2", d: "even" },
  Softening: { c: "#4CE0A1", d: "opening" },
  Conciliatory: { c: "#4CE0A1", d: "yielding" },
};

export function StanceChip({ stance = "Neutral", withDot = true }) {
  const s = STANCE[stance] || STANCE.Neutral;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
      style={{ borderColor: `${s.c}44`, color: s.c, background: `${s.c}12` }}>
      {withDot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.c, boxShadow: `0 0 6px ${s.c}` }} />}
      {stance}
    </span>
  );
}

export function Chip({ children, tone = "slate", className = "" }) {
  const c = TONES[tone] || tone;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] ${className}`}
      style={{ borderColor: `${c}33`, color: c, background: `${c}0F` }}>
      {children}
    </span>
  );
}

// Tiny SVG sparkline / area
export function Sparkline({ data = [], tone = "signal", height = 44, strokeWidth = 2 }) {
  const id = React.useId();
  const color = TONES[tone] || tone;
  if (!data.length) return <div style={{ height }} />;
  const w = 100, h = height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => [(i / (data.length - 1 || 1)) * w, h - ((d - min) / range) * (h - 6) - 3]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height={height}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
        vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
