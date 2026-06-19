// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { loadUnifiedAnalysis } from "@/lib/analysis";

export default function Page() {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const data = await loadUnifiedAnalysis();
        setAnalysis(data);
      } catch (err) {
        console.error("Failed to load predictions:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalysis();

    // Neural pulse randomization
    const dots = document.querySelectorAll('.pulse-neural');
    dots.forEach(dot => {
        dot.style.animationDelay = `${Math.random() * 2}s`;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-xs text-muted-foreground font-mono">Running predictive models...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center bg-white border border-border rounded-2xl shadow-sm">
        <span className="material-symbols-outlined text-muted-foreground text-5xl mb-4">info</span>
        <h2 className="text-xl font-bold text-foreground mb-2">No Active Predictions</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          No event has been analyzed yet. Go to the Analysis Engine to submit an event and generate dynamic predictions.
        </p>
        <a href="/analysis-engine" className="inline-block bg-primary hover:bg-primary/95 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all">
          Go to Analysis Engine
        </a>
      </div>
    );
  }

  const predictions = analysis.predictions || {};
  const eventType = analysis.event_analysis?.event_type || "N/A";
  const eventLocation = analysis.event_analysis?.location || "N/A";

  const congestionScore = predictions.congestion_prediction || 0.0;
  const resolutionTime = predictions.resolution_prediction || 0;
  const severityLevel = predictions.severity_level || "Low";
  const confidenceProb = predictions.ai_confidence || 0.0;
  const reliabilityScore = predictions.reliability_score || 0.0;
  const stabilityForecast = predictions.crowd_stability_forecast || "Stable";
  const congestionTrend = predictions.predictive_congestion_trend || "Stable";

  // Reliability Gauge Circle Offset calculation (Circumference ~ 282.7)
  const dashOffset = 282.7 - (282.7 * reliabilityScore) / 100;

  // Timeline heights based on predicted trend
  let timelineHeights = [30, 45, 60, 75, 65, 50, 40, 30, 20, 10]; // Upward Trend
  if (congestionTrend === "Downward Trend") {
    timelineHeights = [85, 75, 65, 55, 45, 35, 30, 25, 20, 15];
  } else if (congestionTrend === "Stable") {
    timelineHeights = [45, 48, 52, 50, 48, 51, 49, 50, 47, 45];
  }

  const isStable = stabilityForecast === "Stable";
  const stabilityPercent = isStable ? 85 : 35;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .prediction-reveal {
            animation: reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
            transform: translateY(20px);
        }

        @keyframes reveal {
            from { opacity: 0; transform: translateY(20px) scale(0.98); filter: blur(5px); }
            to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        .scanline {
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, hsl(263, 70%, 50%), transparent);
            position: absolute;
            bottom: 0;
            left: -100%;
            animation: scan 3s infinite;
        }

        @keyframes scan {
            0% { left: -100%; }
            100% { left: 100%; }
        }

        .pulse-neural {
            animation: neuralPulse 2s infinite ease-in-out;
        }

        @keyframes neuralPulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
        }

        .gauge-path {
            stroke-dasharray: 282.7, 282.7;
            transition: stroke-dashoffset 2s ease-out;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }` }} />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="page-heading text-foreground">System Predictions</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Real-time neural forecasting for urban resource distribution and critical infrastructure maintenance.
            </p>
          </div>
          <div className="flex gap-3">
            <a href="/analysis-engine" className="px-5 py-2.5 bg-white border border-border rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-muted transition-all">
              <span className="material-symbols-outlined text-sm">refresh</span>
              Rerun Simulation
            </a>
          </div>
        </div>

        {/* Bento Grid Predictions */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Prediction Card 1: Main Focus */}
          <div className="md:col-span-8 bg-white border border-border rounded-2xl p-8 shadow-sm prediction-reveal relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-[10px] font-bold text-primary tracking-widest mb-1 block uppercase font-sans">Active Analysis Event</span>
                <h3 className="font-display text-2xl font-bold text-foreground">{eventType} <span className="text-muted-foreground font-normal text-sm">at {eventLocation}</span></h3>
              </div>
              <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider font-sans">Risk Score: {congestionScore}/10</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-xs font-semibold">Predicted Resolution</p>
                <p className="font-display text-3xl font-bold text-primary">{resolutionTime}m <span className="text-xs font-sans font-normal text-muted-foreground">Est.</span></p>
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-xs font-semibold">Severity Level</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${severityLevel === 'High' ? 'bg-destructive' : 'bg-green-500'}`}></div>
                  <p className={`font-display text-3xl font-bold uppercase ${severityLevel === 'High' ? 'text-destructive' : 'text-green-600'}`}>{severityLevel}</p>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-xs font-semibold">AI Confidence</p>
                <p className="font-display text-3xl font-bold text-green-600">{(confidenceProb * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* Mini Trend Graph */}
            <div className="relative h-40 w-full mt-4 bg-muted/20 border border-border/50 rounded-xl p-4 flex flex-col justify-end">
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between h-24">
                {timelineHeights.map((h, i) => (
                  <div 
                    key={i} 
                    className={`w-[8%] rounded-t-sm transition-all duration-500 ${
                      i === 3 ? "bg-primary shadow-sm" : "bg-muted-foreground/10"
                    }`}
                    style={{ height: `${h}%` }}
                    title={`Hour +${i * 0.5}: ${h}% predicted load`}
                  ></div>
                ))}
              </div>
              <div className="w-full h-px bg-border"></div>
              <p className="absolute bottom-2 left-4 text-[9px] font-bold text-muted-foreground tracking-wider uppercase font-sans">Timeline: Next 4 Hours ({congestionTrend})</p>
            </div>
            
            <div className="scanline opacity-10"></div>
          </div>

          {/* Prediction Card 2: Confidence Gauge */}
          <div className="md:col-span-4 bg-white border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm prediction-reveal" style={{"animationDelay": "0.1s"}}>
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest mb-6 block uppercase font-sans">Intelligence Reliability</span>
            
            <div className="relative w-44 h-44 mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="45" stroke="rgba(100,116,139,0.06)" strokeWidth="8"></circle>
                <circle className="gauge-path" cx="50" cy="50" fill="none" r="45" stroke="url(#gradient-blue)" strokeDasharray="282.7" strokeDashoffset={dashOffset} strokeWidth="8"></circle>
                <defs>
                  <linearGradient id="gradient-blue" x1="0%" x2="100%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(263, 70%, 50%)"></stop>
                    <stop offset="100%" stopColor="hsl(221, 83%, 53%)"></stop>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl font-bold text-foreground">{reliabilityScore.toFixed(0)}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter font-sans">Reliability Index</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground px-2 leading-relaxed">
              Neural models report a <span className="text-primary font-bold">{reliabilityScore >= 80 ? "high convergence" : reliabilityScore >= 50 ? "moderate convergence" : "divergent trend"}</span> of environmental and civic data points.
            </p>
          </div>

          {/* Prediction Card 3: Neural Map Widget */}
          <div className="md:col-span-4 bg-white border border-border rounded-2xl overflow-hidden shadow-sm prediction-reveal flex flex-col justify-between" style={{"animationDelay": "0.2s"}}>
            <div className="relative h-60 w-full">
              <div className="absolute inset-0 bg-black/5 z-10 flex items-center justify-center">
                <div className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1.5 border border-border shadow-sm">
                  <span className="material-symbols-outlined text-primary text-base">location_on</span>
                  <span className="text-[10px] font-bold text-foreground font-sans uppercase">Active Grid: {eventLocation}</span>
                </div>
              </div>
              <img className="w-full h-full object-cover grayscale-[0.2] contrast-[0.9] brightness-[1.05]" data-alt="Stylized city grid visualization" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdTpjWUbnqUSORlpIZLKHbFPjAleZ_h7NUeKbqI4gm63BcO2GMWu8s0wxe1UWApw_xw31V4IJbMs2257Gi8OZzuQk3buWbHG9npnct_4ohed6qIbBjN0YSSsdOaRTZui2FjEbvrQ1gKO4lDks_Xk7gNvpNs3eutLMQi0qXki68CCTyysME5YlYivmgF-MspoUYD5qNrEQavpR71_9oR57k6tlco-jZAXG0z6956sS2PBTkwlbyZgY6sfi7wvYZWJ7-MFiBjc6Kf48"/>
            </div>
            <div className="p-6 border-t border-border">
              <h4 className="font-display font-bold text-sm text-foreground mb-2">Crowd Stability Forecast</h4>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${isStable ? 'bg-green-500' : 'bg-destructive'}`} style={{ width: `${stabilityPercent}%` }}></div>
                </div>
                <span className={`font-mono text-xs font-bold ${isStable ? 'text-green-600' : 'text-destructive'}`}>{stabilityPercent}% {isStable ? "Stable" : "Volatile"}</span>
              </div>
            </div>
          </div>

          {/* Prediction Card 4: Forecast Summary */}
          <div className="md:col-span-8 bg-white border border-border rounded-2xl p-8 shadow-sm prediction-reveal" style={{"animationDelay": "0.3s"}}>
            <h4 className="font-display text-base font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">trending_up</span>
              Predictive Congestion Trends
            </h4>
            
            <div className="space-y-4">
              
              {/* Item 1 */}
              <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl hover:border-primary/20 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center text-primary group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                    <span className="material-symbols-outlined">commute</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Public Transit Load</p>
                    <p className="text-xs text-muted-foreground">{congestionTrend === 'Upward Trend' ? 'Significant increase predicted' : 'Normal volume predicted'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-bold ${congestionTrend === 'Upward Trend' ? 'text-destructive' : 'text-green-600'}`}>
                    {congestionTrend === 'Upward Trend' ? `+${(congestionScore * 3.5).toFixed(0)}%` : 'Stable'}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Variance</p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl hover:border-primary/20 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center text-green-600 group-hover:bg-green-50 group-hover:border-green-100 transition-colors">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Resource Efficiency Gain</p>
                    <p className="text-xs text-muted-foreground">Optimal power & dispatch grid flow</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-green-600 font-bold">+{ (reliabilityScore / 5).toFixed(0) }%</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Efficiency</p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl hover:border-primary/20 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center text-secondary group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                    <span className="material-symbols-outlined">road</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Road Closure Status</p>
                    <p className="text-xs text-muted-foreground">{predictions.road_closure_required ? 'Road closure required' : 'No closure needed'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-bold ${predictions.road_closure_required ? 'text-destructive' : 'text-green-600'}`}>
                    {predictions.road_closure_required ? 'CLOSED' : 'OPEN'}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Status</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30 group">
        <span className="material-symbols-outlined text-2xl" style={{"fontVariationSettings": "'FILL' 1"}}>psychology</span>
        <div className="absolute right-16 bg-white px-4 py-2 rounded-lg border border-border shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          <p className="text-xs font-bold text-foreground">Ask CityLearn AI</p>
        </div>
      </button>
    </>
  );
}
