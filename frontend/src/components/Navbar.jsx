import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/scenarios", label: "Scenarios" },
  { to: "/progress", label: "Progress" },
  { to: "/history", label: "History" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="fixed top-4 left-0 right-0 z-50 px-4">
      <nav className="mx-auto flex max-w-5xl items-center justify-between glass rounded-full px-3 py-2 pl-5"
           data-testid="app-navbar">
        <button onClick={() => navigate("/dashboard")} className="shrink-0" data-testid="nav-logo">
          <Logo />
        </button>

        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `relative px-4 py-2 text-sm transition-colors duration-300 ${
                  isActive ? "text-paper" : "text-paper-dim hover:text-paper"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-4 right-4 -bottom-0.5 h-px bg-clay"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            {user?.picture ? (
              <img src={user.picture} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-ink-600" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-ink-700 grid place-items-center text-xs text-paper-dim">
                {user?.name?.[0] || "U"}
              </div>
            )}
            <button
              onClick={doLogout}
              data-testid="nav-logout"
              className="grid h-8 w-8 place-items-center rounded-full text-paper-dim hover:text-clay hover:bg-clay/10 transition-colors duration-300"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        <button
          className="md:hidden grid h-9 w-9 place-items-center text-paper"
          onClick={() => setOpen((o) => !o)}
          data-testid="nav-mobile-toggle"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="md:hidden mx-auto mt-2 max-w-5xl glass rounded-2xl p-2"
          >
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                data-testid={`nav-mobile-${l.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `block px-4 py-3 text-sm ${isActive ? "text-clay" : "text-paper-dim"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <button
              onClick={doLogout}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-paper-dim"
            >
              <LogOut size={15} /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
