import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { TrendingUp, Flame, Trophy, Target as TargetIcon } from "lucide-react";
import { api } from "@/lib/api";
import { Reveal, CountUp, Panel } from "@/components/primitives";

const DIM_LABELS = { persuasion: "Persuasion", clarity: "Clarity", empathy: "Emotional IQ", strategy: "Strategy", listening: "Listening", leverage: "Leverage" };
const DIM_SHORT = { persuasion: "Persuade", clarity: "Clarity", empathy: "EQ", strategy: "Strategy", listening: "Listen", leverage: "Leverage" };

function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return <div className="glass rounded-lg px-3 py-2 text-xs"><p className="text-snow-mute">{payload[0].payload.title}</p><p className="num text-snow text-base">{payload[0].value}</p></div>;
}

export default function Progress() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/stats").then((r) => setStats(r.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="mx-auto max-w-[1200px] px-5 sm:px-8 py-10"><div className="h-64 shimmer-bg rounded-2xl" /></div>;

  const isNew = (stats.completed_sessions || 0) === 0;
  const trend = (stats.trend || []).map((t, i) => ({ ...t, n: i + 1 }));
  const radarData = Object.keys(DIM_LABELS).map((k) => ({ dim: DIM_SHORT[k], value: stats.dimensions?.[k] ?? 0 }));

  return (
    <div className="mx-auto max-w-[1200px] px-5 sm:px-8 py-8 md:py-10">
      <Reveal><p className="overline mb-2">Growth over time</p><h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-snow">Progress</h1></Reveal>

      {isNew ? (
        <Reveal delay={0.1}><div className="mt-12 panel p-14 text-center">
          <TrendingUp className="mx-auto text-white/20" size={28} />
          <h2 className="mt-5 text-xl font-semibold text-snow">No data to chart yet</h2>
          <p className="mt-2 text-sm text-snow-dim">Complete a few sessions and your trajectory will appear here.</p>
          <Link to="/scenarios" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-signal px-6 py-3 font-medium text-ink-900 hover:bg-signal-bright transition-colors duration-300">Start training</Link>
        </div></Reveal>
      ) : (
        <div className="mt-8 grid grid-cols-12 gap-4">
          {[
            { label: "Completed", value: stats.completed_sessions, icon: TargetIcon },
            { label: "Avg score", value: stats.avg_score, icon: TrendingUp },
            { label: "Best score", value: stats.best_score, icon: Trophy },
            { label: "Day streak", value: stats.streak, icon: Flame },
          ].map((m, i) => (
            <Reveal key={m.label} className="col-span-6 lg:col-span-3" delay={i * 0.04}>
              <Panel className="p-6"><div className="flex items-center justify-between"><span className="overline">{m.label}</span><m.icon size={14} className="text-white/20" /></div>
                <div className="num text-4xl text-snow mt-4"><CountUp value={m.value || 0} /></div></Panel>
            </Reveal>
          ))}

          <Reveal className="col-span-12 lg:col-span-8" delay={0.05}><Panel className="p-7 h-full">
            <p className="overline mb-5">Score trajectory</p>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 10, left: -22, bottom: 0 }}>
                <XAxis dataKey="n" tick={{ fill: "#626871", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#626871", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                <Line type="monotone" dataKey="score" stroke="#C7F24C" strokeWidth={2.2} dot={{ fill: "#C7F24C", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer></div>
          </Panel></Reveal>

          <Reveal className="col-span-12 lg:col-span-4" delay={0.1}><Panel className="p-7 h-full">
            <p className="overline mb-2">Skill profile</p>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="dim" tick={{ fill: "#9298A2", fontSize: 10 }} />
                <Radar dataKey="value" stroke="#C7F24C" fill="#C7F24C" fillOpacity={0.2} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer></div>
          </Panel></Reveal>

          <Reveal className="col-span-12" delay={0.05}><Panel className="p-7">
            <p className="overline mb-5">Skill averages</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-5">
              {Object.keys(DIM_LABELS).map((k) => (
                <div key={k} className="flex items-baseline justify-between border-b border-white/[0.06] pb-3">
                  <span className="text-sm text-snow-dim">{DIM_LABELS[k]}</span><span className="num text-2xl text-snow">{stats.dimensions?.[k] ?? 0}</span></div>))}
            </div>
          </Panel></Reveal>
        </div>
      )}
    </div>
  );
}
