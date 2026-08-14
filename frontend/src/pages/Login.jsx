import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { EASE } from "@/components/primitives";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => { if (!loading && user) navigate("/dashboard", { replace: true }); }, [user, loading, navigate]);

  const signIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between p-12 border-r border-white/[0.06]">
        <Link to="/" className="flex items-center gap-2 text-snow-dim hover:text-snow transition-colors duration-300 w-fit text-sm">
          <ArrowLeft size={15} /> Back
        </Link>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-snow-dim">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" style={{ boxShadow: "0 0 8px #C7F24C" }} /> The Negotiation Cockpit
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-snow max-w-md text-balance">
            Read the room. Hold your ground. Close the gap.
          </h1>
          <p className="mt-5 max-w-md text-snow-dim leading-relaxed">
            A training environment where you rehearse high-stakes deals against an opponent that pushes back —
            with live intelligence on momentum, leverage and deal health.
          </p>
        </motion.div>
        <div className="flex items-center gap-6 text-snow-mute text-xs font-mono">
          <span>8 SCENARIOS</span><span>LIVE AI OPPONENT</span><span>COACHING REPORTS</span>
        </div>
      </div>

      <div className="relative flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="w-full max-w-sm">
          <div className="lg:hidden mb-10"><Logo /></div>
          <p className="overline mb-3">Sign in</p>
          <h2 className="text-3xl font-semibold tracking-tight text-snow">Enter the cockpit.</h2>
          <p className="mt-3 text-sm text-snow-dim leading-relaxed">
            Continue with Google to save sessions, track your trajectory, and resume any negotiation.
          </p>
          <button onClick={signIn} data-testid="google-signin-btn"
            className="group mt-8 flex w-full items-center justify-between rounded-xl border border-white/10 bg-ink-600 px-5 py-4 text-snow hover:border-signal/50 hover:bg-ink-500 transition-all duration-300 active:scale-[0.99]">
            <span className="flex items-center gap-3"><GoogleGlyph /><span className="text-sm">Continue with Google</span></span>
            <ArrowUpRight size={16} className="text-snow-mute group-hover:text-signal transition-colors duration-300" />
          </button>
          <p className="mt-6 text-xs text-snow-mute leading-relaxed">By continuing you agree to practice deliberately and negotiate in good faith.</p>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.6 13.2l7.8 6.1C12.2 13.6 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.7-9.9 6.7-17.4z" />
      <path fill="#FBBC05" d="M10.4 28.3c-.5-1.4-.8-2.9-.8-4.3s.3-3 .8-4.3l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.6 10.4l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.3-5.7c-2 1.4-4.7 2.3-8 2.3-6.4 0-11.8-4.1-13.6-9.8l-7.8 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}
