import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Landing from "@/pages/Landing";

export default function Home() {
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(() => {
      setAuthChecked(true);
    });
  }, []);

  if (!authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return <Landing />;
}