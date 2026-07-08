import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Gamepad2, NotebookPen, CreditCard } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const TABS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/games", icon: Gamepad2, label: "Games" },
  { to: "/notes", icon: NotebookPen, label: "Notes" },
  { to: "/pricing", icon: CreditCard, label: "Plans" },
];

export default function MobileBottomTabs() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isMobile) return null;

  const handleTabClick = (e, tab) => {
    const isActive = location.pathname === tab.to;
    if (isActive) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-card/95 backdrop-blur-md border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((tab) => {
        const isActive = location.pathname === tab.to;
        return (
          <a
            key={tab.to}
            href={tab.to}
            onClick={(e) => {
              e.preventDefault();
              if (isActive) {
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                navigate(tab.to);
              }
            }}
            className={`flex flex-col items-center gap-0.5 py-2.5 px-4 transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </a>
        );
      })}
    </nav>
  );
}