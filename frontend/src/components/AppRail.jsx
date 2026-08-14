import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutGrid, Swords, LineChart, History as HistoryIcon, LogOut } from "lucide-react";
import { Mark } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/scenarios", label: "Scenarios", icon: Swords },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/history", label: "History", icon: HistoryIcon },
];

function RailItem({ to, label, icon: Icon }) {
  return (
    <NavLink to={to} data-testid={`nav-${label.toLowerCase()}`} className="group relative block">
      {({ isActive }) => (
        <div className="relative flex flex-col items-center gap-1.5 py-2.5">
          {isActive && (
            <motion.span layoutId="rail-active" className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-signal"
              style={{ boxShadow: "0 0 10px #C7F24C" }} />
          )}
          <div className={`grid h-10 w-10 place-items-center rounded-xl transition-all duration-300 ${
            isActive ? "bg-signal/10 text-signal" : "text-snow-mute hover:text-snow hover:bg-white/[0.04]"}`}>
            <Icon size={19} strokeWidth={1.8} />
          </div>
          <span className={`text-[0.6rem] tracking-wide transition-colors duration-300 ${
            isActive ? "text-snow" : "text-snow-mute group-hover:text-snow-dim"}`}>{label}</span>
        </div>
      )}
    </NavLink>
  );
}

export default function AppRail() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const doLogout = async () => { await logout(); navigate("/login"); };

  return (
    <>
      {/* Desktop left rail */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-[84px] flex-col items-center justify-between glass border-r border-white/[0.07] py-5">
        <button onClick={() => navigate("/dashboard")} data-testid="rail-logo" className="grid h-11 w-11 place-items-center">
          <Mark size={26} />
        </button>
        <nav className="flex flex-col gap-1">
          {LINKS.map((l) => <RailItem key={l.to} {...l} />)}
        </nav>
        <div className="flex flex-col items-center gap-3">
          {user?.picture ? (
            <img src={user.picture} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-ink-500 grid place-items-center text-xs text-snow-dim">{user?.name?.[0] || "U"}</div>
          )}
          <button onClick={doLogout} data-testid="nav-logout"
            className="grid h-9 w-9 place-items-center rounded-xl text-snow-mute hover:text-coral hover:bg-coral/10 transition-colors duration-300" title="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-4 left-1/2 z-40 -translate-x-1/2 glass rounded-2xl px-2 py-1.5 flex items-center gap-1"
        data-testid="mobile-nav">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} data-testid={`nav-mobile-${l.label.toLowerCase()}`}
            className={({ isActive }) => `grid h-11 w-11 place-items-center rounded-xl transition-colors duration-300 ${
              isActive ? "bg-signal/12 text-signal" : "text-snow-mute"}`}>
            <l.icon size={19} strokeWidth={1.8} />
          </NavLink>
        ))}
        <div className="mx-1 h-6 w-px bg-white/10" />
        <button onClick={doLogout} className="grid h-11 w-11 place-items-center rounded-xl text-snow-mute">
          <LogOut size={18} />
        </button>
      </nav>
    </>
  );
}
