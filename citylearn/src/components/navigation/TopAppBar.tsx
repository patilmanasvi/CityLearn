// src/components/navigation/TopAppBar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TopAppBar() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-6 sticky top-0 z-20">
      
      {/* Search Bar */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search urban nodes..." 
            className="w-full bg-muted/40 border border-border rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        
        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white" />
        </Button>

        {/* Divider */}
        <div className="h-4 w-px bg-border mx-1" />

        {/* Clock & Calendar */}
        <div className="flex items-center gap-2 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-foreground min-h-[16px]">{time || "--:--"}</p>
            <p className="text-[9px] text-muted-foreground font-semibold uppercase min-h-[12px]">{date || "Loading..."}</p>
          </div>
        </div>

      </div>
    </header>
  );
}
