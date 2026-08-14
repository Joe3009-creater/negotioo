import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Clock, Loader2, Target } from "lucide-react";
import { api } from "@/lib/api";
import { Reveal, EASE, Chip } from "@/components/primitives";

const DIFF_TONE = { Foundational: "mint", Intermediate: "signal", Advanced: "amber", Expert: "coral" };

function DiffBars({ level }) {
  return <div className="flex items-center gap-1">{[1,2,3,4].map((i)=><span key={i} className={`h-1 w-3.5 rounded-full ${i<=level?"bg-signal":"bg-white/10"}`} />)}</div>;
}

function ScenarioCard({ scn, onStart, starting }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 30 });
  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  return (
    <motion.article ref={ref} onMouseMove={onMove} whileHover={{ y: -6 }} transition={{ duration: 0.5, ease: EASE }}
      className="group relative overflow-hidden panel hover-lift hover:border-white/12" data-testid={`scenario-card-${scn.id}`}>
      <div className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(340px circle at ${pos.x}% ${pos.y}%, rgba(199,242,76,0.10), transparent 45%)` }} />
      <div className="relative h-36 overflow-hidden">
        <img src={scn.cover} alt="" className="h-full w-full object-cover opacity-45 group-hover:opacity-60 group-hover:scale-105 transition-all duration-[900ms]" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(16,18,22,0.2), #101216 92%)" }} />
        <div className="absolute left-5 top-4 flex items-center gap-2">
          <Chip tone={DIFF_TONE[scn.difficulty]}>{scn.difficulty}</Chip>
        </div>
        <span className="absolute right-5 top-4 overline">{scn.category}</span>
      </div>
      <div className="relative p-6 -mt-10">
        <div className="flex items-start gap-3">
          <img src={scn.opponent.avatar} alt="" className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/12" />
          <div className="min-w-0 pt-0.5">
            <h3 className="text-lg font-semibold text-snow leading-tight truncate">{scn.title}</h3>
            <p className="text-xs text-snow-mute font-mono truncate">{scn.opponent.name.toUpperCase()} · {scn.opponent.title}</p>
          </div>
        </div>
        <div className="mt-5 flex items-start gap-2 text-sm text-snow-dim leading-relaxed">
          <Target size={14} className="mt-0.5 shrink-0 text-signal/70" /><span className="line-clamp-2">{scn.objective}</span>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <div className="flex items-center gap-4">
            <DiffBars level={scn.difficulty_level} />
            <span className="flex items-center gap-1.5 text-xs text-snow-mute font-mono"><Clock size={12} /> {scn.duration_min}M</span>
          </div>
          <button onClick={() => onStart(scn.id)} disabled={starting} data-testid={`start-scenario-${scn.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] group-hover:bg-signal group-hover:text-ink-900 px-3.5 py-1.5 text-sm text-snow transition-all duration-300 disabled:opacity-50">
            {starting ? <Loader2 size={14} className="animate-spin" /> : <>Begin <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default function Scenarios() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [starting, setStarting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { api.get("/scenarios").then((r) => setScenarios(r.data)).finally(() => setLoading(false)); }, []);

  const start = async (id) => {
    setStarting(id);
    try { const r = await api.post("/sessions", { scenario_id: id }); navigate(`/negotiate/${r.data.session_id}`); }
    catch { toast.error("Couldn't open the room. Try again."); setStarting(null); }
  };

  const categories = ["All", ...Array.from(new Set(scenarios.map((s) => s.category)))];
  const visible = filter === "All" ? scenarios : scenarios.filter((s) => s.category === filter);

  return (
    <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-8 md:py-10">
      <Reveal>
        <p className="overline mb-3">Choose your room</p>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-snow">Negotiation environments</h1>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setFilter(c)} data-testid={`filter-${c.toLowerCase()}`}
                className={`rounded-full px-3.5 py-1.5 text-xs transition-colors duration-300 border ${
                  filter === c ? "border-signal/50 bg-signal/10 text-signal" : "border-white/10 text-snow-mute hover:text-snow"}`}>{c}</button>
            ))}
          </div>
        </div>
      </Reveal>

      {loading ? (
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({length:6}).map((_,i)=><div key={i} className="h-80 shimmer-bg rounded-2xl" />)}</div>
      ) : (
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((scn, i) => (
            <Reveal key={scn.id} delay={i * 0.05}><ScenarioCard scn={scn} onStart={start} starting={starting === scn.id} /></Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
