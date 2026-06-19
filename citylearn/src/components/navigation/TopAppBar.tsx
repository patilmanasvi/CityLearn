// src/components/navigation/TopAppBar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, Bell, Menu, X, UserCircle, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navItems } from "./SideNavBar";

export default function TopAppBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
        }
      })
      .catch((err) => console.error("Error fetching user in TopAppBar:", err));
  }, []);

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
    <>
      <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
        
        {/* Search Bar */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer rounded-md hover:bg-muted/50 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Notification Bell */}
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white" />
          </Button>

          {/* Divider */}
          <div className="h-4 w-px bg-border mx-0.5 sm:mx-1" />

          {/* Clock & Calendar */}
          <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2">
            <div className="text-right">
              <p className="text-[10px] sm:text-xs font-bold text-foreground min-h-[14px] sm:min-h-[16px] leading-tight">{time || "--:--"}</p>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground font-semibold uppercase min-h-[10px] sm:min-h-[12px] leading-tight">{date || "Loading..."}</p>
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Navigation Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-300 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer Navigation Panel */}
      <div className={cn(
        "fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:hidden border-r border-border",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Drawer Header */}
        <div className="h-16 border-b border-border flex items-center px-6 gap-3 bg-white shrink-0">
          {/* Close Button aligned to where the hamburger menu sits */}
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer rounded-md hover:bg-muted/50 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BrainCircuit className="text-primary w-5 h-5" />
            </div>
            <div>
              <h2 className="font-croissant font-bold tracking-tight text-lg text-foreground">CityLearn</h2>
              <p className="text-[10px] uppercase text-muted-foreground tracking-widest font-semibold">Institutional Memory</p>
            </div>
          </div>
        </div>

        {/* Drawer Scrollable Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-md transition-all group",
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

        {/* Drawer Footer / User Profile Section */}
        <div className="p-4 border-t border-border bg-white shrink-0">
          <Link 
            href="/profile"
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-muted/30 hover:bg-muted transition-all",
              pathname === "/profile" && "border-primary/30 bg-primary/5 text-primary"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="text-primary w-6 h-6" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-foreground truncate">{user?.name || "Guest"}</p>
              <p className="text-[10px] text-muted-foreground truncate uppercase font-semibold">{user?.city || "Location"}</p>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
