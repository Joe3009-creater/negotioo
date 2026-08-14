import React from "react";

// Negotio mark: two counter-nodes bridged by a tension line — the deal point.
export function Mark({ className = "", size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className} aria-hidden>
      <rect x="1" y="1" width="26" height="26" rx="7" stroke="rgba(255,255,255,0.10)" />
      <circle cx="9" cy="14" r="2.4" fill="#C7F24C" />
      <circle cx="19" cy="14" r="2.4" fill="none" stroke="#9298A2" strokeWidth="1.3" />
      <path d="M11.2 14 H16.8" stroke="#C7F24C" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className = "", withText = true }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Mark />
      {withText && (
        <span className="text-[1.05rem] font-semibold tracking-tight text-snow leading-none">
          Negotio
        </span>
      )}
    </div>
  );
}
