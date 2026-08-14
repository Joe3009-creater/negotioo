import React from "react";

// Atmospheric environment: near-black + soft blurred color fields + noise.
// Almost invisible at a glance; dimensional up close. No visible grid.
export default function Backdrop() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-ink-900" aria-hidden>
      {/* signal light, upper-left */}
      <div
        className="absolute -top-56 -left-40 h-[52rem] w-[52rem] rounded-full blur-3xl animate-breathe"
        style={{ background: "radial-gradient(circle, rgba(199,242,76,0.10) 0%, rgba(199,242,76,0) 60%)" }}
      />
      {/* warm counter-light, lower-right */}
      <div
        className="absolute bottom-[-22rem] right-[-16rem] h-[48rem] w-[48rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,107,94,0.07) 0%, rgba(255,107,94,0) 62%)" }}
      />
      {/* cool depth, center */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[40rem] w-[60rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(ellipse, rgba(76,224,161,0.04) 0%, rgba(76,224,161,0) 65%)" }}
      />
      {/* subtle vignette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 0%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
    </div>
  );
}
