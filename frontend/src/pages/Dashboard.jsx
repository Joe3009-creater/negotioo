import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, ArrowRight, ArrowUpRight, Flame, TrendingUp, TrendingDown, ChevronRight, Target } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Reveal, CountUp, Panel, Radial, Meter, Sparkline, MomentumMeter, EASE, TONES } from "@/components/primitives";

const DIM_LABELS = { persuasion: "Persuasion", clarity: "Clarity", empathy: "Emotional IQ", strategy: "Strategy", listening: "Listening", leverage: "Leverage" };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/stats"), api.get("/sessions"), api.get("/scenarios")])
      .then(([s, se, sc]) => { setStats(s.data); setSessions(se.data); setScenarios(sc.data); })
      .finally(() => setLoading(false));
  }, []);

  const active = sessions.find((s) => s.status === "active");
  const recent = sessions.slice(0, 5);
  const played = new Set(sessions.map((s) => s.scenario_id));
  const recommended = scenarios.filter((s) => !played.has(s.id)).slice(0, 1)[0] || scenarios[0];
  const firstName = (user?.name || "there").split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const scnById = Object.fromEntries(scenarios.map((s) => [s.id, s]));

  const startScenario = async (id) => {
    try { const r = await api.post("/sessions", { scenario_id: id }); navigate(`/negotiate/${r.data.session_id}`); }
    catch { toast.error("Couldn't open the room."); }
  };

  if (loading) {
    return <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-10"><div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-7 h-48 shimmer-bg rounded-2xl" />
      <div className="col-span-12 lg:col-span-5 h-48 shimmer-bg rounded-2xl" />
      <div className="col-span-12 lg:col-span-4 h-64 shimmer-bg rounded-2xl" />
      <div className="col-span-6 lg:col-span-4 h-64 shimmer-bg rounded-2xl" />
      <div className="col-span-6 lg:col-span-4 h-64 shimmer-bg rounded-2xl" />
    </div></div>;
  }

  const isNew = (stats?.completed_sessions || 0) === 0;
  const trendScores = (stats.trend || []).map((t) => t.score);
  const activeScn = active ? scnById[active.scenario_id] : null;

  return (
    <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-8 md:py-10">
      {/* Header */}
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
          <div>
            <p className="overline mb-2">{greeting}</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-snow">{firstName}<span className="text-snow-mute">.</span></h1>
          </div>
          <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
            <Flame size={15} className="text-amber" />
            <span className="num text-sm text-snow">{stats.streak}</span>
            <span className="text-xs text-snow-dim">day streak</span>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-12 gap-4">
        {/* Continue / start — dominant */}
        <Reveal className="col-span-12 lg:col-span-7" delay={0.02}>
          <Panel className="relative overflow-hidden p-7 h-full">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(199,242,76,0.10), transparent 65%)" }} />
            <div className="relative flex flex-col h-full">
              <p className="overline">{active ? "Resume negotiation" : "Start a session"}</p>
              <div className="mt-4 flex items-start gap-4">
                {activeScn && <img src={activeScn.opponent.avatar} alt="" className="h-14 w-14 rounded-xl object-cover ring-1 ring-white/10" />}
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-semibold text-snow leading-tight">
                    {active ? active.scenario_title : "Pick an opponent and open the room"}
                  </h2>
                  <p className="mt-1.5 text-sm text-snow-dim">
                    {active ? `vs ${activeScn?.opponent.name} · ${active.turns} exchange${active.turns === 1 ? "" : "s"} in`
                            : "Eight rooms, each with a distinct counterpart and objective."}
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-8">
                {active ? (
                  <button onClick={() => navigate(`/negotiate/${active.session_id}`)} data-testid="continue-session-btn"
                    className="group inline-flex items-center gap-2 rounded-xl bg-signal px-5 py-3 font-medium text-ink-900 hover:bg-signal-bright transition-colors duration-300 active:scale-[0.98]">
                    <Play size={15} /> Resume
                  </button>
                ) : (
                  <Link to="/scenarios" data-testid="dashboard-start-btn"
                    className="group inline-flex items-center gap-2 rounded-xl bg-signal px-5 py-3 font-medium text-ink-900 hover:bg-signal-bright transition-colors duration-300 active:scale-[0.98]">
                    Browse scenarios <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                  </Link>
                )}
              </div>
            </div>
          </Panel>
        </Reveal>

        {/* Momentum / trajectory */}
        <Reveal className="col-span-12 lg:col-span-5" delay={0.05}>
          <Panel className="p-7 h-full">
            <div className="flex items-center justify-between">
              <p className="overline">Performance trajectory</p>
              <span className={`flex items-center gap-1 text-xs font-mono ${stats.momentum >= 0 ? "text-mint" : "text-coral"}`}>
                {stats.momentum >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{stats.momentum > 0 ? "+" : ""}{stats.momentum}
              </span>
            </div>
            {isNew ? <EmptyMini text="Your score trajectory appears after your first assessment." />
            : <>
              <div className="mt-4 flex items-end gap-3">
                <div className="num text-5xl text-snow leading-none"><CountUp value={stats.latest_score} /></div>
                <div className="pb-1"><div className="text-xs text-snow-dim">latest</div><div className="text-xs text-snow-mute">avg {stats.avg_score} · best {stats.best_score}</div></div>
              </div>
              <div className="mt-4"><Sparkline data={trendScores.length > 1 ? trendScores : [stats.latest_score, stats.latest_score]} tone={stats.momentum >= 0 ? "mint" : "coral"} height={56} /></div>
            </>}
          </Panel>
        </Reveal>

        {/* Skill profile radial cluster */}
        <Reveal className="col-span-12 lg:col-span-4" delay={0.02}>
          <Panel className="p-7 h-full">
            <p className="overline mb-5">Skill profile</p>
            {isNew ? <EmptyMini text="Finish a session to build your profile." />
            : <div className="space-y-3.5">
              {Object.keys(DIM_LABELS).map((k) => {
                const v = stats.dimensions?.[k] ?? 0;
                const tone = v >= 78 ? "mint" : v >= 58 ? "signal" : v >= 40 ? "amber" : "coral";
                return <Meter key={k} label={DIM_LABELS[k]} value={v} tone={tone} />;
              })}
            </div>}
          </Panel>
        </Reveal>

        {/* Strongest / Weakness / stat tiles */}
        <Reveal className="col-span-6 lg:col-span-4" delay={0.04}>
          <div className="grid grid-cols-1 gap-4 h-full">
            <Panel className="p-6">
              <div className="flex items-center gap-2"><TrendingUp size={15} className="text-mint" /><p className="overline">Strongest behavior</p></div>
              {stats.strongest ? <>
                <div className="mt-3 text-lg text-snow">{stats.strongest.label}</div>
                <div className="num text-mint text-2xl mt-1">{stats.strongest.value}</div>
              </> : <EmptyMini text="—" />}
            </Panel>
            <Panel className="p-6">
              <div className="flex items-center gap-2"><TrendingDown size={15} className="text-coral" /><p className="overline">Biggest weakness</p></div>
              {stats.weakest ? <>
                <div className="mt-3 text-lg text-snow">{stats.weakest.label}</div>
                <div className="num text-coral text-2xl mt-1">{stats.weakest.value}</div>
              </> : <EmptyMini text="—" />}
            </Panel>
          </div>
        </Reveal>

        {/* Deal outcomes + concessions */}
        <Reveal className="col-span-6 lg:col-span-4" delay={0.06}>
          <div className="grid grid-cols-1 gap-4 h-full">
            <Panel className="p-6 flex items-center gap-5">
              <Radial value={stats.win_rate} size={92} stroke={7} tone={stats.win_rate >= 50 ? "mint" : "amber"} label="Deals" sub={`${stats.deals_closed}/${stats.completed_sessions}`} />
              <div>
                <p className="overline">Deal outcomes</p>
                <p className="mt-2 text-sm text-snow-dim leading-relaxed">You close <span className="text-snow num">{stats.win_rate}%</span> of the negotiations you complete.</p>
              </div>
            </Panel>
            <Panel className="p-6">
              <p className="overline">Concession behavior</p>
              <div className="mt-3 flex items-end gap-6">
                <div><div className="num text-2xl text-snow">{stats.concessions?.given ?? 0}</div><div className="text-xs text-snow-mute mt-0.5">you gave</div></div>
                <div><div className="num text-2xl text-signal">{stats.concessions?.won ?? 0}</div><div className="text-xs text-snow-mute mt-0.5">you won</div></div>
              </div>
            </Panel>
          </div>
        </Reveal>

        {/* Recent negotiations */}
        <Reveal className="col-span-12 lg:col-span-8" delay={0.04}>
          <Panel className="p-7 h-full">
            <div className="flex items-center justify-between mb-5">
              <p className="overline">Recent negotiations</p>
              <Link to="/history" className="flex items-center gap-1 text-xs text-snow-mute hover:text-signal transition-colors duration-300">All <ChevronRight size={13} /></Link>
            </div>
            {recent.length === 0 ? <EmptyMini text="No sessions yet — your history builds here." />
            : <div className="divide-y divide-white/[0.05]">
              {recent.map((s) => {
                const sc = scnById[s.scenario_id];
                return (
                  <button key={s.session_id} onClick={() => navigate(s.status === "completed" ? `/report/${s.session_id}` : `/negotiate/${s.session_id}`)}
                    className="group w-full flex items-center gap-4 py-3.5 text-left first:pt-0 last:pb-0">
                    {sc && <img src={sc.opponent.avatar} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-white/10" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-snow truncate">{s.scenario_title}</p>
                      <p className="text-xs text-snow-mute font-mono">{s.status === "completed" ? "ASSESSED" : "IN PROGRESS"}</p>
                    </div>
                    {s.overall_score != null && <span className="num text-lg" style={{ color: s.overall_score >= 78 ? TONES.mint : s.overall_score >= 58 ? TONES.signal : s.overall_score >= 40 ? TONES.amber : TONES.coral }}>{s.overall_score}</span>}
                    <ArrowUpRight size={15} className="text-snow-mute group-hover:text-signal transition-colors duration-300" />
                  </button>
                );
              })}
            </div>}
          </Panel>
        </Reveal>

        {/* Recommended */}
        <Reveal className="col-span-12 lg:col-span-4" delay={0.06}>
          {recommended && (
            <motion.button whileHover={{ y: -4 }} transition={{ duration: 0.45, ease: EASE }}
              onClick={() => startScenario(recommended.id)} data-testid={`recommended-${recommended.id}`}
              className="panel hover-lift hover:border-white/12 w-full h-full text-left overflow-hidden group">
              <div className="relative h-28 overflow-hidden">
                <img src={recommended.cover} alt="" className="h-full w-full object-cover opacity-40 group-hover:opacity-55 group-hover:scale-105 transition-all duration-700" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent, #101216)" }} />
                <span className="absolute left-5 top-4 overline">Recommended · {recommended.category}</span>
              </div>
              <div className="p-6 -mt-6 relative">
                <div className="flex items-center gap-3">
                  <img src={recommended.opponent.avatar} alt="" className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10" />
                  <div><h3 className="text-lg text-snow leading-tight">{recommended.title}</h3><p className="text-xs text-snow-mute font-mono">{recommended.difficulty.toUpperCase()} · {recommended.duration_min}M</p></div>
                </div>
                <div className="mt-5 flex items-center gap-2 text-sm text-signal">
                  <Target size={14} /> Begin this room <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                </div>
              </div>
            </motion.button>
          )}
        </Reveal>
      </div>
    </div>
  );
}

function EmptyMini({ text }) {
  return <div className="mt-3 rounded-xl border border-dashed border-white/10 p-4 text-sm text-snow-mute">{text}</div>;
}
