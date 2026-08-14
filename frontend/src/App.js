import "@/App.css";
import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import Backdrop from "@/components/Backdrop";
import AppRail from "@/components/AppRail";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthCallback from "@/components/AuthCallback";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Scenarios from "@/pages/Scenarios";
import Negotiation from "@/pages/Negotiation";
import Report from "@/pages/Report";
import History from "@/pages/History";
import Progress from "@/pages/Progress";

function Workspace({ children }) {
  return (
    <div className="relative min-h-screen">
      <AppRail />
      <main className="md:pl-[84px] min-h-screen pb-24 md:pb-0">{children}</main>
    </div>
  );
}

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Workspace><Dashboard /></Workspace></ProtectedRoute>} />
      <Route path="/scenarios" element={<ProtectedRoute><Workspace><Scenarios /></Workspace></ProtectedRoute>} />
      <Route path="/negotiate/:sessionId" element={<ProtectedRoute><Workspace><Negotiation /></Workspace></ProtectedRoute>} />
      <Route path="/report/:sessionId" element={<ProtectedRoute><Workspace><Report /></Workspace></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><Workspace><History /></Workspace></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><Workspace><Progress /></Workspace></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App grain">
      <Backdrop />
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster theme="dark" position="top-center"
            toastOptions={{ style: { background: "rgba(16,18,22,0.9)", border: "1px solid rgba(255,255,255,0.08)", color: "#ECEEF1", borderRadius: "12px", backdropFilter: "blur(12px)" } }} />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
