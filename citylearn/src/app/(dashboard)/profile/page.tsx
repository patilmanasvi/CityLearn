// @ts-nocheck
"use client";

import React, { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    const runScript = () => {
      try {
        // Subtle micro-animations
        document.querySelectorAll("button").forEach((button) => {
          button.addEventListener("mousedown", () => {
            button.classList.add("scale-95");
          });
          button.addEventListener("mouseup", () => {
            button.classList.remove("scale-95");
          });
        });
      } catch (e) {
        console.error("Error running page script:", e);
      }
    };
    runScript();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          vertical-align: middle;
        }
      ` }} />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            User Profile
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Manage your credentials, view operational statistics, and check verification status.
          </p>
        </div>

        {/* Hero Section & Quick Actions */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-white border border-border shadow-sm rounded-2xl p-8 relative overflow-hidden flex items-center">
            <div className="flex flex-col md:flex-row items-center md:items-center gap-6 relative z-10 w-full">
              
              {/* Profile Image */}
              <div className="relative">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden border border-border shadow-sm bg-slate-50">
                  <img
                    alt="Alex Rivera"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuACVQnt-rJcIEaj8Zesz9MBf202MGlkB06ZVjxbP89q41K35mVAh7BoZ8PdYs-isZTcp5qit1kGpgN1lhFPIA3h98_R6-8-q4WMq7zDlJrmW4l9N2L8Hv7kOE1VABccz8RMfML1BKD3T4C2JDWugDilheruhvpiq14e88M_MWIxBpl1zjJSX_rwROAl3_xCNYT_0rQoFMOhcUwIXfWG8FXfnONrHq2zGtZT6R9Z17ZvjwWPtzUmEjGbUVrma55dABB6-Q4dtyjTniA"
                  />
                </div>
                <button className="absolute -bottom-2 -right-2 w-9 h-9 bg-primary text-white rounded-lg shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>

              {/* User Metadata */}
              <div className="text-center md:text-left space-y-2 flex-grow">
                <div className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[9px] font-bold uppercase tracking-wider">
                  Verified Expert
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">Alex Rivera</h2>
                <p className="text-muted-foreground text-sm">
                  Senior Urban Logistics Architect • City Operations AI
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">location_on</span> San Francisco, CA
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">mail</span> a.rivera@citylearn.gov
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Actions Panel (1 Column) */}
          <div className="bg-white border border-border shadow-sm rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center justify-between">
                Quick Actions
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              </h3>
              
              <div className="space-y-3">
                <button className="w-full group flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-border rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-lg">person_edit</span>
                    <span className="text-xs font-bold text-foreground">Edit Profile</span>
                  </div>
                  <span className="material-symbols-outlined text-muted-foreground text-base group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
                
                <button className="w-full group flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-border rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-lg">map</span>
                    <span className="text-xs font-bold text-foreground">Location Settings</span>
                  </div>
                  <span className="material-symbols-outlined text-muted-foreground text-base group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
                
                <button className="w-full group flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-border rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-600 text-lg">security</span>
                    <span className="text-xs font-bold text-foreground">Security &amp; Access</span>
                  </div>
                  <span className="material-symbols-outlined text-muted-foreground text-base group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Account Health</span>
                <span className="text-xs font-bold text-primary font-mono">98% Secure</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "98%" }}></div>
              </div>
            </div>
          </div>

        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Card 1 */}
          <div className="bg-white border border-border shadow-sm p-6 rounded-xl hover:border-primary/20 transition-colors">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Events Analyzed</p>
            <h4 className="text-2xl font-bold text-primary font-mono">12,482</h4>
            <p className="text-[10px] text-green-600 font-semibold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span> +12% this month
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-border shadow-sm p-6 rounded-xl hover:border-secondary/20 transition-colors">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Predictions</p>
            <h4 className="text-2xl font-bold text-secondary font-mono">842</h4>
            <p className="text-[10px] text-primary/70 font-semibold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">check_circle</span> 94% Accuracy
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-border shadow-sm p-6 rounded-xl hover:border-amber-400/50 transition-colors">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Approved Actions</p>
            <h4 className="text-2xl font-bold text-amber-600 font-mono">319</h4>
            <p className="text-[10px] text-amber-700 font-semibold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">bolt</span> High Impact Rank
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-border shadow-sm p-6 rounded-xl hover:border-slate-300 transition-colors">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Simulations</p>
            <h4 className="text-2xl font-bold text-foreground font-mono">56</h4>
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">timer</span> 4.2h Avg/Week
            </p>
          </div>

        </section>

        {/* Charts & Activities */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Performance Chart (2 Columns) */}
          <div className="lg:col-span-2 bg-white border border-border shadow-sm p-8 rounded-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-foreground">Impact Velocity</h3>
                <p className="text-muted-foreground text-xs">Quantifying operational efficiency over the last 30 days.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Active Output</span>
              </div>
            </div>

            {/* SVG Chart Area */}
            <div className="h-60 w-full relative">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
                <defs>
                  <linearGradient id="profileChartGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15"></stop>
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                {/* Horizontal reference lines */}
                <line stroke="rgba(0,0,0,0.05)" strokeWidth="1" x1="0" x2="800" y1="50" y2="50"></line>
                <line stroke="rgba(0,0,0,0.05)" strokeWidth="1" x1="0" x2="800" y1="100" y2="100"></line>
                <line stroke="rgba(0,0,0,0.05)" strokeWidth="1" x1="0" x2="800" y1="150" y2="150"></line>
                
                {/* Area path */}
                <path d="M0,180 Q100,160 200,120 T400,100 T600,140 T800,40 L800,200 L0,200 Z" fill="url(#profileChartGrad)"></path>
                
                {/* Line path */}
                <path d="M0,180 Q100,160 200,120 T400,100 T600,140 T800,40" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                
                {/* Reference dots */}
                <circle cx="200" cy="120" fill="hsl(var(--primary))" r="4" className="ring-4 ring-primary/20"></circle>
                <circle cx="800" cy="40" fill="hsl(var(--primary))" r="4" className="ring-4 ring-primary/20"></circle>
              </svg>
              
              {/* X Axis labels */}
              <div className="flex justify-between mt-4 text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                <span>Wk 01</span>
                <span>Wk 02</span>
                <span>Wk 03</span>
                <span>Wk 04 (Current)</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed (1 Column) */}
          <div className="bg-white border border-border shadow-sm p-8 rounded-xl flex flex-col justify-between">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6">Recent Activity</h3>
            
            <div className="space-y-6 flex-grow">
              
              {/* Activity 1 */}
              <div className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20">
                    <span className="material-symbols-outlined text-base">hub</span>
                  </div>
                  <div className="w-px h-8 bg-slate-100 mt-2"></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Simulation Approved</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">L-9 Urban Corridor Optimization</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono mt-1">2 hours ago</p>
                </div>
              </div>

              {/* Activity 2 */}
              <div className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <span className="material-symbols-outlined text-base">analytics</span>
                  </div>
                  <div className="w-px h-8 bg-slate-100 mt-2"></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Dataset Analysis Complete</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">SF Transit Grid (Batch #442)</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono mt-1">5 hours ago</p>
                </div>
              </div>

              {/* Activity 3 */}
              <div className="flex gap-4">
                <div>
                  <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                    <span className="material-symbols-outlined text-base">notifications_active</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Security Alert Handled</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">API Gateway unauthorized attempt</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono mt-1">Yesterday</p>
                </div>
              </div>

            </div>
          </div>

        </section>

      </div>
    </>
  );
}
