import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Loader2, TrendingUp, TrendingDown, ArrowRight, CheckCircle2, XCircle, ArrowLeft, Zap, Ear } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Radial, Meter, Reveal, CountUp, Panel, EASE, TONES } from "@/components/primitives";

const DIM_LABELS = { persuasion: "Persuasion", clarity: "Clarity", empathy: "Emotional IQ", strategy: "Strategy", listening: "Listening", leverage: "Leverage" };
const DIM_SHORT = { persuasion: "Persuade", clarity: "Clarity", empathy: "EQ", strategy: "Strategy", listening: "Listen", leverage: "Leverage" };
const toneFor = (v) => v >= 78 ? "mint" : v >= 58 ? "signal" : v >= 40 ? "amber" : "coral";

export default function Report() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [session, setSession] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s = await api.get(`/sessions/${sessionId}`); setSession(s.data);
        let rep = s.data.report;
        if (!rep) { const r = await api.post(`/sessions/${sessionId}/report`); rep = r.data; }
        setReport(rep);
        const sc = await api.get("/scenarios"); setScenarios(sc.data);
      } catch { toast.error("Couldn't load the assessment."); navigate("/history"); }
      finally { setLoading(false); }
    })();
  }, [sessionId, navigate]);

  if (loading || !report) {
    return <div className="min-h-screen grid place-items-center"><div className="flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-signal" /><p className="overline">Compiling your assessment</p></div></div>;
  }

  const dims = report.dimensions || {};
  const radarData = Object.keys(DIM_LABELS).map((k) => ({ dim: DIM_SHORT[k], value: dims[k] ?? 0 }));
  const rec = scenarios.find((s) => s.id === report.recommended_scenario_id);
  const deal = report.outcome?.deal_reached;

  const startRec = async () => {
    if (!rec) return;
    try { const r = await api.post("/sessions", { scenario_id: rec.id }); navigate(`/negotiate/${r.data.session_id}`); }
    catch { toast.error("Couldn't open the room."); }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-5 sm:px-8 py-8 md:py-10">
      <Reveal>
        <button onClick={() => navigate("/history")} className="flex items-center gap-2 text-snow-dim hover:text-snow transition-colors duration-300 text-sm mb-6">
          <ArrowLeft size={15} /> History
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="overline mb-2">Performance intelligence</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-snow">{session?.scenario_title}</h1>
            <p className="mt-3 text-snow-dim leading-relaxed">{report.headline}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-mono"
            style={{ color: deal ? TONES.mint : TONES.amber, borderColor: (deal ? TONES.mint : TONES.amber) + "55", background: (deal ? TONES.mint : TONES.amber) + "12" }}>
            {deal ? <CheckCircle2 size={14} /> : <XCircle size={14} />}{deal ? "DEAL REACHED" : "NO DEAL"}
          </span>
        </div>
      </Reveal>

      {/* Overview */}
      <div className="mt-8 grid grid-cols-12 gap-4">
        <Reveal className="col-span-12 lg:col-span-4">
          <Panel className="p-7 h-full flex flex-col items-center justify-center text-center">
            <Radial value={report.overall_score ?? 0} size={168} stroke={10} tone={toneFor(report.overall_score ?? 0)} label="Overall" />
            <p className="mt-6 text-sm text-snow-dim leading-relaxed"><span className="text-snow">Result — </span>{report.outcome?.result}</p>
          </Panel>
        </Reveal>
        <Reveal className="col-span-12 lg:col-span-4" delay={0.05}>
          <Panel className="p-7 h-full">
            <p className="overline mb-3">Skill profile</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: "#9298A2", fontSize: 10 }} />
                  <Radar dataKey="value" stroke="#C7F24C" fill="#C7F24C" fillOpacity={0.2} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </Reveal>
        <Reveal className="col-span-12 lg:col-span-4" delay={0.1}>
          <Panel className="p-7 h-full flex flex-col justify-center gap-4">
            {Object.keys(DIM_LABELS).map((k) => <Meter key={k} label={DIM_LABELS[k]} value={dims[k] ?? 0} tone={toneFor(dims[k] ?? 0)} />)}
          </Panel>
        </Reveal>
      </div>

      {/* leverage + opponent response */}
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <Reveal><Panel className="p-7 h-full">
          <div className="flex items-center gap-2 mb-3"><Zap size={16} className="text-coral" /><p className="overline">Where you lost leverage</p></div>
          <p className="text-sm text-snow-dim leading-relaxed">{report.lost_leverage}</p>
        </Panel></Reveal>
        <Reveal delay={0.05}><Panel className="p-7 h-full">
          <div className="flex items-center gap-2 mb-3"><Ear size={16} className="text-mint" /><p className="overline">What the opponent responded to</p></div>
          <p className="text-sm text-snow-dim leading-relaxed">{report.opponent_responded_to}</p>
        </Panel></Reveal>
      </div>

      {/* strengths / weaknesses */}
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <Reveal><Panel className="p-7 h-full">
          <div className="flex items-center gap-2 mb-5"><TrendingUp size={16} className="text-mint" /><p className="overline">What worked</p></div>
          <div className="space-y-4">{(report.strengths || []).map((s, i) => (
            <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
              <p className="text-snow text-sm">{s.title}</p><p className="mt-1 text-sm text-snow-dim leading-relaxed">{s.detail}</p></div>))}</div>
        </Panel></Reveal>
        <Reveal delay={0.05}><Panel className="p-7 h-full">
          <div className="flex items-center gap-2 mb-5"><TrendingDown size={16} className="text-coral" /><p className="overline">Areas to sharpen</p></div>
          <div className="space-y-4">{(report.weaknesses || []).map((s, i) => (
            <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
              <p className="text-snow text-sm">{s.title}</p><p className="mt-1 text-sm text-snow-dim leading-relaxed">{s.detail}</p></div>))}</div>
        </Panel></Reveal>
      </div>

      {/* strategic decisions + concessions */}
      <div className="mt-4 grid grid-cols-12 gap-4">
        {(report.strategic_decisions || []).length > 0 && (
          <Reveal className="col-span-12 lg:col-span-8"><Panel className="p-7 h-full">
            <p className="overline mb-5">Strategic decisions</p>
            <div className="divide-y divide-white/[0.05]">{report.strategic_decisions.map((d, i) => (
              <div key={i} className="grid sm:grid-cols-[1fr_1.5fr] gap-2 sm:gap-8 py-4 first:pt-0 last:pb-0">
                <p className="text-sm text-snow">{d.moment}</p><p className="text-sm text-snow-dim leading-relaxed">{d.assessment}</p></div>))}</div>
          </Panel></Reveal>
        )}
        <Reveal className="col-span-12 lg:col-span-4" delay={0.05}><Panel className="p-7 h-full flex flex-col justify-center">
          <p className="overline mb-4">Concessions</p>
          <div className="flex items-end gap-8">
            <div><div className="num text-4xl text-snow"><CountUp value={report.concessions?.by_you ?? 0} /></div><p className="mt-1 text-xs text-snow-mute">you gave</p></div>
            <div><div className="num text-4xl text-signal"><CountUp value={report.concessions?.by_opponent ?? 0} /></div><p className="mt-1 text-xs text-snow-mute">you won</p></div>
          </div>
          <p className="mt-5 border-t border-white/[0.06] pt-4 text-sm text-snow-dim leading-relaxed">{report.concessions?.notes}</p>
        </Panel></Reveal>
      </div>

      {/* coach note */}
      <Reveal><div className="mt-4 rounded-2xl border border-signal/25 bg-signal/[0.05] p-8">
        <p className="overline mb-4" style={{ color: TONES.signal }}>Coach's note</p>
        <p className="text-xl sm:text-2xl leading-relaxed text-snow text-balance">{report.coach_feedback}</p>
      </div></Reveal>

      {/* improvement plan */}
      {(report.improvement_plan || []).length > 0 && (
        <Reveal><div className="mt-8"><p className="overline mb-5">Your improvement plan</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{report.improvement_plan.map((p, i) => (
            <Panel key={i} className="p-6"><span className="num text-signal">0{i + 1}</span>
              <p className="mt-3 text-snow text-sm">{p.area}</p><p className="mt-1.5 text-sm text-snow-dim leading-relaxed">{p.action}</p></Panel>))}</div>
        </div></Reveal>
      )}

      {/* recommended */}
      {rec && (
        <Reveal><Panel className="mt-8 p-7 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src={rec.opponent.avatar} alt="" className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/10" />
            <div><p className="overline mb-1">Recommended next room</p>
              <h3 className="text-xl font-semibold text-snow">{rec.title}</h3>
              <p className="text-xs text-snow-mute font-mono">{rec.category.toUpperCase()} · {rec.difficulty.toUpperCase()}</p></div>
          </div>
          <button onClick={startRec} data-testid="start-recommended-btn"
            className="group flex items-center gap-2 rounded-xl bg-signal px-6 py-3.5 font-medium text-ink-900 hover:bg-signal-bright transition-colors duration-300 active:scale-[0.98]">
            Begin <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-300" />
          </button>
        </Panel></Reveal>
      )}

      <div className="mt-8 flex justify-center gap-6 text-sm">
        <Link to="/scenarios" className="text-snow-dim hover:text-signal transition-colors duration-300">All scenarios</Link>
        <Link to="/progress" className="text-snow-dim hover:text-signal transition-colors duration-300">View progress</Link>
      </div>
    </div>
  );
}
