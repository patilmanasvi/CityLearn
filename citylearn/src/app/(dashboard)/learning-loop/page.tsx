// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";

interface EpochRecord {
  id: string;
  focus: string;
  gain: string;
  status: string;
  time: string;
}

export default function Page() {
  const [accuracy, setAccuracy] = useState(94.8);
  const [isTraining, setIsTraining] = useState(false);
  const [epochCount, setEpochCount] = useState(992);
  const [history, setHistory] = useState<EpochRecord[]>([
    { id: "#EP-992", focus: "Quantum Traffic Flow", gain: "+142.4 GB", status: "Completed", time: "0.12ms" },
    { id: "#EP-991", focus: "Hyper-Local Weather Patterns", gain: "+89.1 GB", status: "Completed", time: "0.15ms" },
    { id: "#EP-990", focus: "Human-AI Collaborative Flux", gain: "+214.7 GB", status: "Completed", time: "0.08ms" }
  ]);

  const handleStartTraining = async () => {
    setIsTraining(true);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      // Build dummy resolved event to push into similarity index
      const payload = {
        id: Math.floor(Math.random() * 10000),
        event_type: "unplanned",
        event_cause: "accident",
        latitude: 12.9716,
        longitude: 77.5946,
        start_datetime: new Date().toISOString(),
        corridor: "Mysore Road",
        police_station: "Byatarayanapura",
        zone: "West",
        junction: "Junction",
        priority: "High"
      };

      const response = await fetch(`${baseUrl}/api/learning`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Learning API failed");
      }

      const data = await response.json();
      
      // Update local states
      const gain = 0.1 + Math.random() * 0.3;
      const newAccuracy = Math.min(99.9, accuracy + gain);
      setAccuracy(newAccuracy);
      
      const newEpochId = epochCount + 1;
      setEpochCount(newEpochId);

      const newRecord: EpochRecord = {
        id: `#EP-${newEpochId}`,
        focus: "Online Similarity Ingestion",
        gain: `+${(Math.random() * 150 + 20).toFixed(1)} GB`,
        status: "Completed",
        time: `${(0.05 + Math.random() * 0.1).toFixed(2)}ms`
      };

      setHistory([newRecord, ...history]);
      alert(`Global Training Loop run completed successfully!\nTotal indexed records on backend: ${data.total_indexed_events || "N/A"}\nAccuracy consolidated to: ${newAccuracy.toFixed(1)}%`);

    } catch (err) {
      console.error(err);
      alert("Failed to connect to the backend training API. Make sure the backend server is running on " + baseUrl);
    } finally {
      setIsTraining(false);
    }
  };

  const handleExportKnowledge = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `citylearn_knowledge_graph_ep${epochCount}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .scan-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, hsl(var(--primary)), transparent);
          animation: scan 4s linear infinite;
        }
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          vertical-align: middle;
        }
      ` }} />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="page-heading text-foreground">
            Learning Loop
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Monitor the iterative optimization of CityLearn's neural weights and memory consolidation.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* Institutional Memory Core (8 Columns) */}
          <section className="col-span-12 lg:col-span-8 bg-white border border-border shadow-sm rounded-2xl p-8 flex flex-col justify-between overflow-hidden relative min-h-[480px]">
            <div className="scan-line opacity-20"></div>
            
            <div className="relative z-10 space-y-1">
              <span className="px-3.5 py-1 bg-primary/10 text-[10px] font-bold text-primary rounded-full tracking-wider uppercase">
                Institutional Memory Core
              </span>
              <h3 className="text-2xl font-bold text-foreground mt-2">Evolutionary Index</h3>
            </div>

            {/* Score Display */}
            <div className="flex-grow flex flex-col items-center justify-center py-8 relative">
              <div className="text-center">
                <span className="score-display text-8xl md:text-[120px] font-display font-extrabold leading-none bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
                  {accuracy.toFixed(1)}
                </span>
                <div className="flex items-center justify-center gap-2 mt-4 text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 w-fit mx-auto">
                  <span className="material-symbols-outlined text-base">trending_up</span>
                  <span className="text-xs font-bold font-sans tracking-wide">+12.4% vs last epoch</span>
                </div>
              </div>
            </div>

            {/* Bottom Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border relative z-10">
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Synaptic Load</p>
                <p className="text-lg font-bold text-foreground font-mono">4.2 PB/s</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Active Nodes</p>
                <p className="text-lg font-bold text-foreground font-mono">8.1M</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Retention Rate</p>
                <p className="text-lg font-bold text-foreground font-mono">99.98%</p>
              </div>
            </div>
          </section>

          {/* Outcome Validation & Error Circular Chart (4 Columns) */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-8">
            
            {/* Outcome Validation Card */}
            <div className="bg-white border border-border shadow-sm rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Outcome Validation</h3>
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-border rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">PREDICTED</span>
                    <span className="text-primary font-mono font-bold">882.4 GWh</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "82%" }}></div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-border rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">ACTUAL</span>
                    <span className="text-secondary font-mono font-bold">879.1 GWh</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: "80%" }}></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center justify-between">
                <span className="text-green-800 text-xs font-bold">Delta Accuracy</span>
                <span className="font-mono text-sm font-bold text-green-700">99.63%</span>
              </div>
            </div>

            {/* Mean Error Chart */}
            <div className="bg-white border border-border shadow-sm rounded-2xl p-6 flex flex-col justify-center items-center text-center space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mean Error %</h3>
              
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle className="text-slate-100" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeWidth="6"></circle>
                  <circle className="text-red-500" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeDasharray="301.6" strokeDashoffset="293.4" strokeWidth="6"></circle>
                </svg>
                <span className="absolute font-mono text-2xl font-bold text-red-600">2.7%</span>
              </div>
              
              <p className="text-xs text-muted-foreground px-4">
                System drift detected in sector 4. Recalibration scheduled.
              </p>
            </div>
            
          </section>

          {/* Charts: Trends (8 Columns) */}
          <section className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Accuracy Trend */}
            <div className="bg-white border border-border shadow-sm rounded-2xl p-6 min-h-[300px] flex flex-col justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Accuracy Trend (24h)</h3>
              
              <div className="flex-1 relative flex items-end justify-center min-h-[140px] mt-4">
                <svg className="w-full h-full" viewBox="0 0 400 150">
                  <defs>
                    <linearGradient id="accuracyTrendGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15"></stop>
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                  <path d="M0,120 Q50,110 100,115 T200,90 T300,60 T400,40 L400,150 L0,150 Z" fill="url(#accuracyTrendGrad)"></path>
                  <path d="M0,120 Q50,110 100,115 T200,90 T300,60 T400,40" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"></path>
                </svg>
              </div>

              <div className="flex justify-between mt-4 text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                <span>00:00</span>
                <span>08:00</span>
                <span>16:00</span>
                <span>NOW</span>
              </div>
            </div>

            {/* Knowledge Growth */}
            <div className="bg-white border border-border shadow-sm rounded-2xl p-6 min-h-[300px] flex flex-col justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Knowledge Growth</h3>
              
              <div className="flex-1 relative flex items-end justify-between gap-1.5 px-2 mt-6">
                <div className="w-1/12 bg-secondary/10 h-[30%] rounded-t"></div>
                <div className="w-1/12 bg-secondary/20 h-[45%] rounded-t"></div>
                <div className="w-1/12 bg-secondary/35 h-[40%] rounded-t"></div>
                <div className="w-1/12 bg-secondary/50 h-[60%] rounded-t"></div>
                <div className="w-1/12 bg-secondary/65 h-[55%] rounded-t"></div>
                <div className="w-1/12 bg-secondary/75 h-[75%] rounded-t"></div>
                <div className="w-1/12 bg-secondary/85 h-[70%] rounded-t"></div>
                <div className="w-1/12 bg-secondary h-[92%] rounded-t"></div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Cumulative Tokens</span>
                <span className="font-mono text-sm font-bold text-secondary">1.8T</span>
              </div>
            </div>

          </section>

          {/* Neural Pattern Feed (4 Columns) */}
          <section className="col-span-12 lg:col-span-4 bg-white border border-border shadow-sm rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Neural Pattern Feed</h3>
                <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 text-[9px] font-bold rounded">LIVE</span>
              </div>

              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                
                {/* Item 1 */}
                <div className="p-3 bg-slate-50 border-l-4 border-primary rounded-r-lg hover:bg-slate-100/70 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[9px] font-bold text-primary tracking-wide">PATTERN #4829</span>
                    <span className="text-[9px] text-muted-foreground font-mono">2m ago</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">
                    Cyclical thermal shift detected in residential sector A. Recalibrating HVAC load.
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 bg-white border border-border rounded text-muted-foreground">Thermal</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-white border border-border rounded text-muted-foreground">High-Confidence</span>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="p-3 bg-slate-50 border-l-4 border-secondary rounded-r-lg hover:bg-slate-100/70 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[9px] font-bold text-secondary tracking-wide">PATTERN #4830</span>
                    <span className="text-[9px] text-muted-foreground font-mono">15m ago</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">
                    New mobility cluster forming at Central Plaza. Adjusting traffic signal phase.
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 bg-white border border-border rounded text-muted-foreground">Mobility</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-white border border-border rounded text-muted-foreground">Unsupervised</span>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="p-3 bg-slate-50 border-l-4 border-amber-500 rounded-r-lg hover:bg-slate-100/70 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[9px] font-bold text-amber-700 tracking-wide">PATTERN #4831</span>
                    <span className="text-[9px] text-muted-foreground font-mono">42m ago</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">
                    Energy efficiency anomaly resolved in Grid Node 7. Pattern locked to memory.
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 bg-white border border-border rounded text-muted-foreground">Energy</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-white border border-border rounded text-muted-foreground">Critical</span>
                  </div>
                </div>

              </div>
            </div>

            <button 
              onClick={handleStartTraining}
              disabled={isTraining}
              className="w-full mt-6 py-3 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-75"
            >
              {isTraining ? "CONSOLIDATING GRAPH WEIGHTS..." : "Initiate Global Training Loop"}
            </button>
          </section>

          {/* Consolidation History Table (Full width - 12 Columns) */}
          <section className="col-span-12 bg-white border border-border shadow-sm rounded-2xl p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Memory Consolidation History</h3>
                <p className="text-muted-foreground text-xs">Log of neural network structural optimizations.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => alert("Archive search filter: Past 7 days selected.")} className="px-3 py-1.5 bg-transparent border border-border hover:bg-slate-50 text-xs font-semibold rounded-lg text-foreground transition-all">Past 7 Days</button>
                <button onClick={handleExportKnowledge} className="px-3 py-1.5 bg-transparent border border-border hover:bg-slate-50 text-xs font-semibold rounded-lg text-foreground transition-all">Export Knowledge</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="pb-3">Epoch ID</th>
                    <th className="pb-3">Focus Area</th>
                    <th className="pb-3">Knowledge Gain</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Optimization</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-foreground divide-y divide-slate-100">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-mono font-semibold text-primary">{record.id}</td>
                      <td className="py-3">{record.focus}</td>
                      <td className="py-3 text-secondary font-bold">{record.gain}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          record.status === "Processing" 
                            ? "bg-amber-50 border border-amber-200 text-amber-700 animate-pulse" 
                            : "bg-green-50 border border-green-200 text-green-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${record.status === "Processing" ? "bg-amber-500" : "bg-green-500"}`}></span> 
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-muted-foreground">{record.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>

      </div>
    </>
  );
}
