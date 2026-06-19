// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { loadUnifiedAnalysis } from "@/lib/analysis";

export default function Page() {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setIsLoading(true);
        const data = await loadUnifiedAnalysis();
        setAnalysis(data);
      } catch (err) {
        console.error("Failed to load strategic recommendations:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecommendations();

    // indicator delay
    const pulses = document.querySelectorAll(".pulse-neural");
    pulses.forEach((p) => {
      p.style.animationDuration = 2 + Math.random() * 3 + "s";
      p.style.animationDelay = Math.random() * 2 + "s";
    });
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-xs text-muted-foreground font-mono">Formulating response strategies...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center bg-white border border-border rounded-2xl shadow-sm">
        <span className="material-symbols-outlined text-muted-foreground text-5xl mb-4">info</span>
        <h2 className="text-xl font-bold text-foreground mb-2">No Recommendations Found</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          No event has been analyzed yet. Go to the Analysis Engine to submit an event and generate dynamic strategic recommendations.
        </p>
        <a href="/analysis-engine" className="inline-block bg-primary hover:bg-primary/95 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all">
          Go to Analysis Engine
        </a>
      </div>
    );
  }

  const activeEvent = analysis?.event_analysis?.input || null;
  const recommendations = analysis?.recommendations || null;
  const impactScore = recommendations ? recommendations.impact_score : 0;
  const efficiencyGains = recommendations ? recommendations.efficiency_gains : 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .pulse-neural {
          animation: neural-pulse 3s infinite ease-in-out;
        }

        @keyframes neural-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }

        .neon-line {
          stroke-dasharray: 8;
          animation: dash 25s linear infinite;
        }

        @keyframes dash {
          to { stroke-dashoffset: -1000; }
        }

        .map-container {
          mask-image: radial-gradient(circle at center, black 75%, transparent 100%);
        }

        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          vertical-align: middle;
        }
      ` }} />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="page-heading text-foreground">
              Response Strategies
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              Neural Intelligence Recommendation Matrix for Containment and Optimization
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-white border border-border shadow-sm px-6 py-4 rounded-xl min-w-[150px]">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                Impact Score
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">{isLoading ? "..." : impactScore}</span>
                <span className="font-mono text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="bg-white border border-border shadow-sm px-6 py-4 rounded-xl min-w-[150px]">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                Efficiency Gains
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-600">+{isLoading ? "..." : efficiencyGains}%</span>
                <span className="material-symbols-outlined text-green-600 text-sm">trending_up</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Area: Map and Recommendations list (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Map Visualization Card */}
            <div className="bg-white border border-border shadow-sm rounded-2xl h-[450px] relative overflow-hidden group">
              <div className="absolute inset-0 bg-slate-50/50">
                <img
                  className="w-full h-full object-cover opacity-10 grayscale scale-110 blur-[1px] pointer-events-none"
                  alt="City Grid Map"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQKhfAB-NqVn4jrd8F9yh22RO0Sz0KzRTcQYzP8x0Ag5Y1cCiA4pPp55_Vq0UAcxV0xrwFyV5C3RqHw0Af4zRN8rHIJ77WeJgzP_Om88txChfruf_RZD54Eux7uvUAjn3DY7yYlNLAy0NXZQ0_9fHUczE93RdmhOA_NzQDYW7ektCLzCpSdnlXnVoNc6FQW3Zlxu_FZFj9pPHMqESi1NjhUVQa2WmrtiMclksru9E2im1z0CZvzz3YhMrna1vXxfA5eRmLg2gahmU"
                />
                
                {/* SVG Route Overlays */}
                <svg className="absolute inset-0 w-full h-full map-container" fill="none" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
                  <path className="neon-line" d="M300 200 L500 400 L700 250" stroke="hsl(var(--secondary))" strokeDasharray="8 12" strokeWidth="2.5"></path>
                  <path className="neon-line" d="M300 200 L150 150 M500 400 L550 550 M700 250 L850 300" stroke="hsl(var(--primary))" strokeDasharray="4 8" strokeWidth="1.5" opacity="0.6"></path>
                  
                  <rect fill="hsl(var(--secondary))" fillOpacity="0.06" height="100" stroke="hsl(var(--secondary))" strokeWidth="1" width="120" x="440" y="350" rx="4"></rect>
                  <text fill="hsl(var(--secondary))" fontFamily="var(--font-noto-sans)" fontSize="9" fontWeight="bold" letterSpacing="1" x="450" y="375">SECTOR_ANOMALY_CORE</text>

                  <circle className="pulse-neural" cx="300" cy="200" fill="hsl(var(--secondary))" r="5"></circle>
                  <circle className="pulse-neural" cx="500" cy="400" fill="hsl(var(--secondary))" r="5" style={{ animationDelay: "1s" }}></circle>
                  <circle className="pulse-neural" cx="700" cy="250" fill="hsl(var(--primary))" r="5" style={{ animationDelay: "2s" }}></circle>
                </svg>
              </div>

              {/* Map Floating UI overlays */}
              <div className="absolute top-4 left-4">
                <div className="bg-white/90 backdrop-blur-md border border-border shadow-sm rounded-lg px-4 py-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-sm">navigation</span>
                  <span className="text-xs font-semibold text-foreground">
                    {activeEvent ? `Event: ${activeEvent.event_type} (${activeEvent.corridor})` : "Loading simulation..."}
                  </span>
                </div>
              </div>
              <div className="absolute bottom-4 right-4">
                <div className="bg-white/90 backdrop-blur-md border border-border shadow-sm p-4 rounded-xl flex flex-col gap-1 min-w-[180px]">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Deployment Location</p>
                  <p className="text-xs font-bold text-foreground">
                    {activeEvent ? activeEvent.corridor : "Bengaluru"}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendation Cards Cluster */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Officer Deployment */}
              <div className="bg-amber-50/20 border border-amber-200/80 p-6 rounded-2xl group hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6 border border-amber-200 text-amber-700 transition-colors">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_police</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Officer Deployment</h3>
                  <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                    {isLoading ? "Analyzing database patterns..." : recommendations?.officer_deployment?.reasoning || "Standard patrol allocation."}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-amber-200/40">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    {isLoading ? "..." : `${recommendations?.officer_deployment?.officer_count || 1} Officers`}
                  </span>
                  <span className="material-symbols-outlined text-amber-600 text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>

              {/* Card 2: Barricade Plan */}
              <div className="bg-amber-50/20 border border-amber-200/80 p-6 rounded-2xl group hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6 border border-amber-200 text-amber-700 transition-colors">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>fence</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Barricade Plan</h3>
                  <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                    {isLoading ? "Calculating barrier positions..." : recommendations?.barricade_plan?.reasoning || "Standard monitoring layout."}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-amber-200/40">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    {isLoading ? "..." : (recommendations?.barricade_plan?.required ? "Required" : "Not Required")}
                  </span>
                  <span className="material-symbols-outlined text-amber-600 text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>

              {/* Card 3: Diversion Strategy */}
              <div className="bg-amber-50/10 border border-amber-200/60 p-6 rounded-2xl group hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-6 border border-amber-200/60 text-amber-600 transition-colors">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>alt_route</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Diversion Strategy</h3>
                  <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                    {isLoading ? "Mapping alternative routes..." : recommendations?.diversion_strategy?.reasoning || "Flow optimization analysis."}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-amber-200/40">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                    {isLoading ? "..." : (recommendations?.diversion_strategy?.required ? "Active" : "Monitor Flow")}
                  </span>
                  <span className="material-symbols-outlined text-amber-500 text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>

            </div>
          </div>

          {/* Right Area: Sidebar Statistics */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-border shadow-sm p-8 rounded-2xl h-full flex flex-col justify-between space-y-8">
              
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-foreground">Neural Analysis</h3>
                
                <div className="space-y-4">
                  
                  {/* Metric 1 */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg">savings</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Resource Savings</p>
                        <p className="text-lg font-bold text-foreground">{isLoading ? "..." : `${(efficiencyGains * 0.8).toFixed(0)}%`}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">ESTIMATED</span>
                  </div>

                  {/* Metric 2 */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg">speed</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Optimization Time</p>
                        <p className="text-lg font-bold text-foreground">142ms</p>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">PEAK</span>
                  </div>

                </div>
              </div>

              {/* Confidence Threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Confidence Threshold</p>
                  <span className="text-xs font-bold text-primary">90%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "90%" }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Min: 70%</span>
                  <span>Target: 90%</span>
                </div>
              </div>

              {/* Quote info and buttons */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="p-4 rounded-xl bg-amber-50/30 border border-amber-100 text-amber-900">
                  <p className="text-xs italic leading-relaxed text-amber-800">
                    {isLoading ? "Analyzing corridor patterns..." : recommendations ? `"${recommendations.diversion_strategy.reasoning} Route: ${recommendations.diversion_strategy.routes?.join(", ") || "N/A"}."` : "Flow optimizations active."}
                  </p>
                </div>
                
                <button className="w-full py-4 bg-primary hover:bg-primary/95 text-white rounded-xl font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                  <span className="material-symbols-outlined text-lg">verified</span>
                  Approve Recommendation
                </button>
                
                <button className="w-full py-3 bg-transparent border border-border hover:bg-slate-50 text-muted-foreground hover:text-foreground rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                  Simulate Variant B
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </>
  );
}
