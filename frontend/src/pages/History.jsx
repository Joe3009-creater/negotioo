import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Play, Inbox } from "lucide-react";
import { api } from "@/lib/api";
import { Reveal, EASE, TONES } from "@/components/primitives";

function fmtDate(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch { return ""; }
}
const scoreColor = (v) => v >= 78 ? TONES.mint : v >= 58 ? TONES.signal : v >= 40 ? TONES.amber : TONES.coral;

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get("/sessions"), api.get("/scenarios")])
      .then(([se, sc]) => { setSessions(se.data); setScenarios(sc.data); }).finally(() => setLoading(false));
  }, []);
  const scnById = Object.fromEntries(scenarios.map((s) => [s.id, s]));

  return (
    <div className="mx-auto max-w-[1000px] px-5 sm:px-8 py-8 md:py-10">
      <Reveal><p className="overline mb-2">Your record</p><h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-snow">History</h1></Reveal>

      {loading ? (
        <div className="mt-10 space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-20 shimmer-bg rounded-xl" />)}</div>
      ) : sessions.length === 0 ? (
        <Reveal delay={0.1}><div className="mt-12 panel p-14 text-center">
          <Inbox className="mx-auto text-white/20" size={28} />
          <h2 className="mt-5 text-xl font-semibold text-snow">Nothing here yet</h2>
          <p className="mt-2 text-sm text-snow-dim">Every negotiation you run will be logged here with its score.</p>
          <Link to="/scenarios" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-signal px-6 py-3 font-medium text-ink-900 hover:bg-signal-bright transition-colors duration-300">
            Start your first <ArrowUpRight size={15} /></Link>
        </div></Reveal>
      ) : (
        <div className="mt-10 space-y-2.5">
          {sessions.map((s, i) => {
            const sc = scnById[s.scenario_id];
            return (
              <motion.button key={s.session_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.04, ease: EASE }}
                onClick={() => navigate(s.status === "completed" ? `/report/${s.session_id}` : `/negotiate/${s.session_id}`)}
                data-testid={`history-row-${s.session_id}`}
                className="group panel hover-lift hover:border-white/12 w-full flex items-center gap-4 p-4 text-left">
                <div className="num text-3xl w-12 text-center" style={{ color: s.overall_score != null ? scoreColor(s.overall_score) : "rgba(255,255,255,0.2)" }}>
                  {s.overall_score != null ? s.overall_score : "–"}
                </div>
                {sc && <img src={sc.opponent.avatar} alt="" className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/10" />}
                <div className="flex-1 min-w-0">
                  <p className="text-snow truncate">{s.scenario_title}</p>
                  <p className="text-xs text-snow-mute font-mono mt-0.5">{fmtDate(s.completed_at || s.created_at)} · {s.turns} EXCHANGE{s.turns === 1 ? "" : "S"}</p>
                </div>
                <span className="text-[0.7rem] font-mono rounded-full px-2.5 py-1 border"
                  style={{ color: s.status === "completed" ? TONES.mint : TONES.amber, borderColor: (s.status === "completed" ? TONES.mint : TONES.amber) + "44" }}>
                  {s.status === "completed" ? "ASSESSED" : "ACTIVE"}
                </span>
                {s.status === "completed" ? <ArrowUpRight size={16} className="text-snow-mute group-hover:text-signal transition-colors duration-300" />
                  : <Play size={15} className="text-snow-mute group-hover:text-signal transition-colors duration-300" />}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
