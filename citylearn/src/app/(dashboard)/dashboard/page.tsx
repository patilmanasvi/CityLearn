// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { loadUnifiedAnalysis } from "@/lib/analysis";

export default function Page() {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const analysis = await loadUnifiedAnalysis();
        setMetrics(analysis?.dashboard_metrics || null);
      } catch (err) {
        console.error("Failed to fetch dashboard metrics:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();

    // Neural Matrix randomization
    const interval = setInterval(() => {
      const bars = document.querySelectorAll(".neural-matrix-bar");
      bars.forEach((bar) => {
        if (Math.random() > 0.85) {
          bar.classList.add("bg-primary/20");
          setTimeout(() => bar.classList.remove("bg-primary/20"), 500);
        }
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  // Compute stats safely
  const totalEvents = metrics ? metrics.total_events : null;
  const eventsAnalyzed = metrics ? metrics.predictions_count : null;
  const similarityCount = metrics ? metrics.similarity_count : null;
  const activeEvents = metrics ? Math.max(0, totalEvents - metrics.resolved_events_count) : null;
  const criticalAlerts = metrics ? Object.keys(metrics.high_risk_zones || {}).length : null;
  
  // Risk index calculations
  const riskPercent = metrics ? Math.round((metrics.active_congestion || 0) * 10) : null;
  const riskLabel = riskPercent > 70 ? "Elevated" : riskPercent > 40 ? "Moderate" : "Low";

  const avgResolutionTime = metrics ? metrics.avg_resolution_time : null;
  const recentActivities = metrics ? metrics.recent_activities : [];
  const congestionMatrix = metrics ? metrics.congestion_matrix : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124, 58, 237, 0.2); border-radius: 10px; }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          vertical-align: middle;
        }
      ` }} />
      
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <section 
          id="dashboard-hero" 
          className="relative h-64 md:h-72 rounded-2xl overflow-hidden flex items-center px-8 md:px-12 bg-cover bg-center border border-border"
          style={{
            backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%), url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1000')"
          }}
        >
          <div className="relative z-10 max-w-2xl space-y-3">
            <h1 className="font-merriweather text-3xl md:text-4xl text-foreground tracking-tight leading-none font-bold">
              Cities Forget. <br/>
              <span className="font-merriweather text-primary font-extrabold">
                <span className="font-croissant">CityLearn</span> Remembers.
              </span>
            </h1>
            <p className="font-sans text-xs md:text-sm text-muted-foreground max-w-lg leading-relaxed">
              Advanced urban intelligence mapping trillions of historical data points to predict and optimize city infrastructure.
            </p>
            {!metrics && !isLoading && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold rounded-full uppercase tracking-wider animate-pulse mt-2">
                <span className="material-symbols-outlined text-[12px]">info</span>
                Run the analysis first
              </div>
            )}
          </div>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white border border-border p-6 rounded-2xl border-l-4 border-l-primary shadow-sm hover:shadow transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded">Active Database</span>
            </div>
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-sans mb-1">Events Learned</h3>
            <p className="font-display text-2xl font-bold text-foreground">
              {isLoading ? "..." : totalEvents !== null ? totalEvents.toLocaleString() : "-"}
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-border p-6 rounded-2xl border-l-4 border-l-secondary shadow-sm hover:shadow transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-secondary text-2xl">psychology</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">Live Sessions</span>
            </div>
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-sans mb-1">Predictions Generated</h3>
            <p className="font-display text-2xl font-bold text-foreground">
              {isLoading ? "..." : eventsAnalyzed !== null ? eventsAnalyzed.toLocaleString() : "-"}
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-border p-6 rounded-2xl border-l-4 border-l-accent shadow-sm hover:shadow transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-accent text-2xl">verified_user</span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">Risk averted</span>
            </div>
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-sans mb-1">Similarity Matches</h3>
            <p className="font-display text-2xl font-bold text-foreground">
              {isLoading ? "..." : similarityCount !== null ? similarityCount.toLocaleString() : "-"}
            </p>
          </div>

        </section>

        {/* KPI Cards & Charts Bento */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* KPIs Column */}
          <div className="md:col-span-3 space-y-4">
            
            <div className="bg-white border border-border p-5 rounded-2xl flex flex-col justify-between h-32 shadow-sm">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Active Incidents</span>
              <div className="flex items-end justify-between">
                <span className="font-display text-2xl font-bold text-foreground">
                  {isLoading ? "..." : activeEvents !== null ? activeEvents : "-"}
                </span>
                <div className="flex -space-x-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[8px] font-bold border-2 border-white">EV</span>
                  <span className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-[8px] font-bold border-2 border-white">TR</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-border p-5 rounded-2xl flex flex-col justify-between h-32 border-l-4 border-l-destructive shadow-sm">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Critical Sectors</span>
              <div className="flex items-end justify-between">
                <span className="font-display text-2xl font-bold text-destructive">
                  {isLoading ? "..." : criticalAlerts !== null ? criticalAlerts : "-"}
                </span>
                <span className="material-symbols-outlined text-destructive text-xl">warning</span>
              </div>
            </div>

            <div className="bg-white border border-border p-5 rounded-2xl flex flex-col justify-between h-32 shadow-sm">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Predicted Risk Index</span>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-display text-2xl font-bold text-foreground">
                    {isLoading ? "..." : riskPercent !== null ? `${riskPercent}%` : "-"}
                  </span>
                  <span className="text-accent text-[10px] font-bold uppercase tracking-wider">
                    {riskPercent !== null ? riskLabel : "-"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-accent h-full rounded-full" style={{ width: `${riskPercent || 0}%` }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-border p-5 rounded-2xl flex flex-col justify-between h-32 shadow-sm">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Avg Resolution Time</span>
              <div className="flex items-end justify-between">
                <span className="font-display text-2xl font-bold text-foreground">
                  {isLoading ? "..." : avgResolutionTime !== null ? <>{Math.round(avgResolutionTime)}<span className="text-sm font-sans font-normal text-muted-foreground">m</span></> : "-"}
                </span>
                <span className="material-symbols-outlined text-muted-foreground text-xl">timer</span>
              </div>
            </div>

          </div>

          {/* Interactive Map Section */}
          <div className="md:col-span-6 bg-white border border-border rounded-2xl relative overflow-hidden min-h-[400px] shadow-sm">
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-border shadow-sm">
                <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                <span className="text-[9px] font-bold text-foreground tracking-wider uppercase font-sans">Active Event Hotspots</span>
              </div>
            </div>
            
            <div className="absolute bottom-4 right-4 z-10">
              <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-border space-y-1.5 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-destructive rounded-full"></div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Active Blockade</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Sensor Node</span>
                </div>
              </div>
            </div>

            {/* Map Background */}
            <div 
              className="w-full h-full grayscale-[0.3] contrast-[1.0] brightness-[1.02]" 
              style={{
                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDql_4s-y4hmIfyXBeCLklYKjBnHbV78WsOags18kLSDyl6g6_RN0KprZpC9lKnbaIe73cLS9dWBse534ptnRdcAWSVd5_vVQdFlfGrg8Jg7ALmqEQfAoA42a7Vgtv1b0xpYZV89LD1Wc1VhCmwNLUYIcm6Y73grCY8SHH4-gmPBvPEUeeZ6TBiuTsWfnp74Uv_sru79clqMLYT8m2mFXc6XTukBw75gKKzv7bewRjdvQHkUF2WAjyz-eVZXTmCi870YfcYnjJEO5c')", 
                backgroundSize: "cover", 
                backgroundPosition: "center"
              }}
            />

            {/* Fixed Static Overlay Markers */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 bg-destructive rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div className="absolute top-2/3 left-1/4">
                <div className="w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div className="absolute bottom-1/4 right-1/3">
                <div className="w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm"></div>
              </div>
            </div>

            {/* Dynamic Event Hotspot */}
            {metrics && metrics.active_location && metrics.active_location !== "Unknown" && (
              <div className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="relative flex items-center justify-center">
                  <span className={`absolute inline-flex h-6 w-6 rounded-full animate-ping opacity-75 ${metrics.active_severity === 'High' ? 'bg-destructive' : 'bg-primary'}`}></span>
                  <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md relative z-10 ${metrics.active_severity === 'High' ? 'bg-destructive' : 'bg-primary'}`}></div>
                </div>
                <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded shadow border border-border mt-1.5 text-[9px] font-bold text-foreground max-w-[140px] truncate">
                  {metrics.active_location}
                </div>
              </div>
            )}
          </div>

          {/* Activity Feed Column */}
          <div className="md:col-span-3 bg-white border border-border rounded-2xl p-6 flex flex-col shadow-sm">
            <h3 className="text-base font-bold text-foreground mb-6">Recent Activities</h3>
            <div className="flex-grow space-y-6 overflow-y-auto pr-1">
              
              {isLoading ? (
                <div className="text-xs text-muted-foreground font-mono">Streaming event logs...</div>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((act) => (
                  <div key={act.id} className="relative pl-6 border-l border-border pb-2">
                    <div className="absolute -left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white"></div>
                    <span className="text-[9px] font-bold text-primary uppercase tracking-wider block font-mono">
                      {act.time} — {act.event_type}
                    </span>
                    <p className="text-xs text-foreground mt-0.5">{act.description} near {act.corridor}.</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground font-mono">No recent activities found.</div>
              )}

            </div>
            <button className="mt-4 w-full py-2.5 rounded-lg border border-border text-[9px] font-bold hover:bg-slate-50 transition-colors uppercase tracking-wider">
              Audit Full Stream
            </button>
          </div>

        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Trend Chart */}
          <div className="bg-white border border-border p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-foreground">Event Trends</h3>
              <div className="flex gap-3 text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Historical</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span>Baseline</span>
                </div>
              </div>
            </div>
            
            <div className="h-44 w-full relative">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                <defs>
                  <linearGradient id="chart-grad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(263, 70%, 50%)" stopOpacity="0.15"></stop>
                    <stop offset="100%" stopColor="hsl(263, 70%, 50%)" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <path d="M0,80 Q50,75 100,40 T200,60 T300,20 T400,50 L400,100 L0,100 Z" fill="url(#chart-grad)"></path>
                <path d="M0,80 Q50,75 100,40 T200,60 T300,20 T400,50" fill="none" stroke="hsl(263, 70%, 50%)" strokeWidth="2.5"></path>
                <path d="M0,90 Q50,85 100,70 T200,80 T300,50 T400,60" fill="none" stroke="hsl(221, 83%, 53%)" strokeDasharray="3" strokeWidth="1.5"></path>
              </svg>
              
              <div className="absolute inset-0 grid grid-cols-6 pointer-events-none opacity-20">
                <div className="border-r border-slate-300 h-full"></div>
                <div className="border-r border-slate-300 h-full"></div>
                <div className="border-r border-slate-300 h-full"></div>
                <div className="border-r border-slate-300 h-full"></div>
                <div className="border-r border-slate-300 h-full"></div>
              </div>
            </div>
            
            <div className="flex justify-between mt-4 text-[9px] font-bold text-muted-foreground tracking-wider uppercase font-mono">
              <span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>00:00</span>
            </div>
          </div>

          {/* Congestion Matrix */}
          <div className="bg-white border border-border p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-foreground">Congestion Matrix</h3>
              <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded">Sync: Optimal</span>
            </div>
            
            <div className="h-44 flex items-end gap-1.5 px-2">
              {congestionMatrix.slice(0, 12).map((val, idx) => {
                // Map the dynamic count values to height percentage
                const maxVal = Math.max(...congestionMatrix, 1);
                const heightPercent = Math.min(95, Math.max(10, Math.round((val / maxVal) * 95)));
                return (
                  <div 
                    key={idx} 
                    className={`flex-1 rounded-t transition-all cursor-pointer ${
                      idx === 4 ? "bg-primary shadow-sm" : "bg-slate-100 hover:bg-primary/20"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={`Hour ${idx * 2}: ${val} events`}
                  ></div>
                );
              })}
              {!isLoading && congestionMatrix.length === 0 && (
                <div className="w-full text-xs text-muted-foreground font-mono self-center">Run an event analysis to populate congestion history.</div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block font-sans">Peak Sensor Node</span>
                <span className="text-xs font-semibold text-foreground">{metrics ? `${metrics.active_location} - ${metrics.active_severity}` : "-"}</span>
              </div>
              <button className="bg-primary hover:bg-primary/95 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm hover:shadow active:scale-[0.98] transition-all">
                Adjust Sensors
              </button>
            </div>
          </div>

        </section>

      </div>
    </>
  );
}
