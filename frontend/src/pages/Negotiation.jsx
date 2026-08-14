import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowUp, Loader2, Flag, Target, Shield, Crosshair, Info, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { Meter, MomentumMeter, StanceChip, Radial, EASE } from "@/components/primitives";

function Typewriter({ text, onUpdate, onDone }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown(""); let i = 0;
    const id = setInterval(() => {
      i += 2; setShown(text.slice(0, i)); onUpdate && onUpdate();
      if (i >= text.length) { clearInterval(id); onDone && onDone(); }
    }, 11);
    return () => clearInterval(id);
  }, [text]); // eslint-disable-line
  return <span>{shown}</span>;
}

function OpponentMessage({ text, animate, onUpdate, onDone }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
      className="max-w-2xl" data-testid="opponent-message">
      <div className="rounded-2xl rounded-tl-sm bg-white/[0.03] border border-white/[0.06] px-5 py-3.5">
        <p className="text-[0.97rem] leading-relaxed text-snow">{animate ? <Typewriter text={text} onUpdate={onUpdate} onDone={onDone} /> : text}</p>
      </div>
    </motion.div>
  );
}

function UserMessage({ text }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}
      className="ml-auto max-w-xl" data-testid="user-message">
      <div className="rounded-2xl rounded-tr-sm bg-signal/[0.09] border border-signal/20 px-5 py-3.5">
        <p className="text-[0.95rem] leading-relaxed text-snow">{text}</p>
      </div>
    </motion.div>
  );
}

function Thinking({ name }) {
  return (
    <div className="flex items-center gap-3 text-snow-mute text-sm">
      <div className="flex items-end gap-1 h-4">
        {[0,1,2,3].map((i)=>(
          <motion.span key={i} className="w-1 rounded-full bg-signal/70"
            animate={{ height: ["30%","100%","30%"] }} transition={{ duration: 0.9, repeat: Infinity, delay: i*0.12 }} style={{ height: "30%" }} />
        ))}
      </div>
      <span>{name} is reading your position…</span>
    </div>
  );
}

function BriefRow({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <Icon size={14} className="mt-0.5 shrink-0 text-signal/70" />
      <div><p className="overline mb-1">{label}</p><p className="text-sm text-snow-dim leading-relaxed">{children}</p></div>
    </div>
  );
}

export default function Negotiation() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [scn, setScn] = useState(null);
  const [messages, setMessages] = useState([]);
  const [state, setState] = useState(null);
  const [concessions, setConcessions] = useState(0);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [animateTs, setAnimateTs] = useState(null);
  const [ending, setEnding] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const scrollRef = useRef(null);

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const s = await api.get(`/sessions/${sessionId}`);
        setMessages(s.data.messages || []);
        setConcessions(s.data.concessions_opponent || 0);
        const lastOpp = [...(s.data.messages || [])].reverse().find((m) => m.role === "opponent");
        setState(lastOpp?.state || null);
        if (s.data.status === "completed") { navigate(`/report/${sessionId}`, { replace: true }); return; }
        const sc = await api.get(`/scenarios/${s.data.scenario_id}`);
        setScn(sc.data);
      } catch { toast.error("Session not found."); navigate("/scenarios"); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => { scrollDown(); }, [messages, thinking, scrollDown]);

  const send = async () => {
    const content = input.trim(); if (!content || thinking) return;
    setInput("");
    const userMsg = { role: "user", content, ts: `local-${Date.now()}` };
    setMessages((m) => [...m, userMsg]); setThinking(true);
    try {
      const r = await api.post(`/sessions/${sessionId}/message`, { content });
      setMessages((m) => [...m, r.data.message]); setState(r.data.state);
      setConcessions(r.data.concessions_opponent); setAnimateTs(r.data.message.ts);
    } catch { toast.error("Message failed to send."); setMessages((m) => m.filter((x) => x.ts !== userMsg.ts)); }
    finally { setThinking(false); }
  };

  const endSession = async () => {
    if (messages.filter((m) => m.role === "user").length < 1) { toast.error("Make at least one move before closing the room."); return; }
    setEnding(true);
    try { await api.post(`/sessions/${sessionId}/report`); navigate(`/report/${sessionId}`); }
    catch { toast.error("Couldn't generate the assessment."); setEnding(false); }
  };

  if (!scn) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-signal" /></div>;

  const momentum = state?.momentum ?? 0;
  const dealClosed = state?.deal_closed;
  const glowColor = momentum >= 8 ? "199,242,76" : momentum <= -8 ? "255,107,94" : "146,152,162";
  const glowStrength = Math.min(0.14, Math.abs(momentum) / 700 + 0.03);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* reactive ambient */}
      <div className="pointer-events-none fixed inset-0 -z-0 transition-all duration-1000"
        style={{ background: `radial-gradient(90% 60% at 50% 0%, rgba(${glowColor},${glowStrength}), transparent 60%)` }} />

      {/* Top bar */}
      <header className="sticky top-0 z-30 glass border-b border-white/[0.07]">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button onClick={() => navigate("/scenarios")} className="flex items-center gap-2 text-snow-dim hover:text-snow transition-colors duration-300 text-sm">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Leave</span>
          </button>
          <div className="text-center min-w-0">
            <p className="overline">{scn.category} · {scn.difficulty}</p>
            <h1 className="text-sm sm:text-base font-semibold text-snow truncate">{scn.title}</h1>
          </div>
          <button onClick={endSession} disabled={ending} data-testid="end-session-btn"
            className="flex items-center gap-2 rounded-xl bg-signal px-4 py-2 text-sm font-medium text-ink-900 hover:bg-signal-bright transition-colors duration-300 disabled:opacity-60">
            {ending ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}<span className="hidden sm:inline">{ending ? "Assessing" : "End & assess"}</span>
          </button>
        </div>
      </header>

      {/* mobile intel strip */}
      <div className="lg:hidden border-b border-white/[0.06] px-4 py-3 flex items-center justify-between gap-4 bg-ink-800/40">
        <div className="flex-1"><Meter label="Deal health" value={state?.deal_health ?? 20} tone="mint" hint="%" /></div>
        <StanceChip stance={state?.opponent_stance || "Firm"} />
      </div>

      <div className="flex-1 grid lg:grid-cols-[290px_1fr_300px]">
        {/* LEFT context */}
        <aside className="hidden lg:flex flex-col border-r border-white/[0.06] p-6 gap-7 overflow-y-auto thin-scroll">
          <div className="flex items-center gap-3">
            <img src={scn.opponent.avatar} alt="" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/12" />
            <div><p className="text-snow font-medium leading-tight">{scn.opponent.name}</p><p className="text-xs text-snow-mute font-mono">{scn.opponent.title}</p></div>
          </div>
          <div className="space-y-5">
            <BriefRow icon={Info} label="Your role">{scn.role}</BriefRow>
            <BriefRow icon={Target} label="Objective">{scn.objective}</BriefRow>
            <BriefRow icon={Crosshair} label="Target zone">{scn.target_zone}</BriefRow>
            <BriefRow icon={Shield} label="Your BATNA">{scn.batna}</BriefRow>
          </div>
          <div className="mt-auto rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
            <p className="overline mb-2">Situation</p><p className="text-sm text-snow-dim leading-relaxed">{scn.situation}</p>
          </div>
        </aside>

        {/* CENTER chat */}
        <section className="relative flex flex-col min-h-[calc(100vh-4rem)]">
          <button onClick={() => setBriefOpen((o) => !o)} className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] text-sm text-snow-dim">
            <span className="flex items-center gap-2"><Target size={14} className="text-signal" /> {scn.objective}</span>
            <ChevronDown size={16} className={`transition-transform duration-300 ${briefOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {briefOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="lg:hidden overflow-hidden border-b border-white/[0.06]">
                <div className="p-4 space-y-4"><BriefRow icon={Info} label="Your role">{scn.role}</BriefRow><BriefRow icon={Shield} label="Your BATNA">{scn.batna}</BriefRow></div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scroll px-4 sm:px-8 py-8 space-y-6">
            {messages.map((m, i) => m.role === "opponent"
              ? <OpponentMessage key={m.ts + i} text={m.content} animate={m.ts === animateTs} onUpdate={scrollDown} onDone={scrollDown} />
              : <UserMessage key={m.ts + i} text={m.content} />)}
            {thinking && <Thinking name={scn.opponent.name.split(" ")[0]} />}
            {dealClosed && !thinking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-md text-center rounded-xl border border-mint/30 bg-mint/[0.06] p-5">
                <p className="overline mb-1" style={{ color: "#4CE0A1" }}>Agreement on the table</p>
                <p className="text-sm text-snow-dim">A deal has been reached. End the session to see how you did.</p>
              </motion.div>
            )}
          </div>

          <div className="border-t border-white/[0.06] p-4 sm:px-8 sm:py-5 bg-ink-800/30">
            <div className="flex items-end gap-3 panel-2 focus-within:border-signal/50 transition-colors duration-300 p-2 pl-4">
              <textarea value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Make your move…" rows={1} data-testid="negotiation-input"
                className="flex-1 resize-none bg-transparent py-2 text-[0.95rem] text-snow placeholder:text-snow-mute focus:outline-none max-h-40" />
              <button onClick={send} disabled={thinking || !input.trim()} data-testid="send-message-btn"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-signal text-ink-900 hover:bg-signal-bright transition-colors duration-300 disabled:opacity-40 active:scale-95">
                {thinking ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={17} />}
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT intel */}
        <aside className="hidden lg:flex flex-col border-l border-white/[0.06] p-6 gap-6 overflow-y-auto thin-scroll">
          <div className="flex items-center justify-between">
            <p className="overline">Opponent</p><StanceChip stance={state?.opponent_stance || "Firm"} />
          </div>
          <div className="flex justify-center py-1">
            <Radial value={state?.deal_health ?? 20} size={124} tone={(state?.deal_health ?? 20) >= 60 ? "mint" : (state?.deal_health ?? 20) >= 35 ? "amber" : "coral"} label="Deal health" sub="to agreement" />
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4"><MomentumMeter value={momentum} /></div>
          <Meter label="Opponent warmth" value={Math.round(((state?.sentiment ?? 0) + 100) / 2)} tone="signal" hint="%" />
          <div className="border-t border-white/[0.06] pt-5 flex items-center justify-between">
            <div><p className="overline">Concessions won</p><p className="text-xs text-snow-mute mt-1">ground given by {scn.opponent.name.split(" ")[0]}</p></div>
            <div className="num text-3xl text-signal">{concessions}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
