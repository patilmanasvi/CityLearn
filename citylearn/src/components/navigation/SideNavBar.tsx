// src/components/navigation/SideNavBar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BarChart3, 
  History, 
  BrainCircuit, 
  Lightbulb, 
  Network, 
  RefreshCcw,
  UserCircle
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Analysis", icon: BarChart3, href: "/analysis-engine" },
  { label: "Similar Events", icon: History, href: "/institutional-memory-match" },
  { label: "Predictions", icon: BrainCircuit, href: "/predictive-intelligence" },
  { label: "Recommendations", icon: Lightbulb, href: "/strategic-recommendations" },
  { label: "Knowledge Graph", icon: Network, href: "/knowledge-graph" },
  { label: "Learning Loop", icon: RefreshCcw, href: "/learning-loop" },
];

export default function SideNavBar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-white flex flex-col h-screen sticky top-0 hidden lg:flex z-30">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <BrainCircuit className="text-primary w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display font-bold tracking-tight text-lg text-foreground">CityLearn</h2>
          <p className="text-[10px] uppercase text-muted-foreground tracking-widest font-semibold">Institutional Memory</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-all group",
              pathname === item.href 
                ? "bg-primary/10 text-primary font-semibold" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5 transition-colors", pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            <span className="text-sm font-sans">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <Link 
          href="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-muted/30 hover:bg-muted transition-all",
            pathname === "/profile" && "border-primary/30 bg-primary/5 text-primary"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCircle className="text-primary w-6 h-6" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-foreground truncate">Alex Rivera</p>
            <p className="text-[10px] text-muted-foreground truncate uppercase font-semibold">San Francisco</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}

