// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";

interface Sector {
  id: string;
  val: number;
  color: string;
}

export default function Page() {
  // 1. Simulation Input States
  const [officerCount, setOfficerCount] = useState(142);
  const [roadClosures, setRoadClosures] = useState(8);
  const [duration, setDuration] = useState(6.5);
  const [rerouting, setRerouting] = useState(true);
  const [densityCap, setDensityCap] = useState(false);

  // 2. Simulation Output States
  const [isSimulating, setIsSimulating] = useState(false);
  const [bestCase, setBestCase] = useState(98.4);
  const [expectedCase, setExpectedCase] = useState(82.1);
  const [worstCase, setWorstCase] = useState(45.9);
  
  const [peakLoad, setPeakLoad] = useState(-34.2);
  const [avgResponse, setAvgResponse] = useState("-4m 12s");
  const [energySaved, setEnergySaved] = useState(1.2);
  const [safetyIndex, setSafetyIndex] = useState(12.8);

  const [barHeights, setBarHeights] = useState([65, 85, 55, 40, 25, 20]);
  const [gridSectors, setGridSectors] = useState<Sector[]>([]);

  // Initialize sector grid
  const generateGrid = () => {
    const list: Sector[] = [];
    for (let i = 0; i < 72; i++) {
      const val = Math.random() * 100;
      let color = "bg-white/5";
      if (val > 80) color = "bg-primary";
      else if (val > 50) color = "bg-primary/40";
      list.push({
        id: `SEC-${i}`,
        val,
        color,
      });
    }
    setGridSectors(list);
  };

  useEffect(() => {
    generateGrid();
  }, []);

  // Run Simulation Handler
  const handleRunSimulation = () => {
    setIsSimulating(true);
    
    setTimeout(() => {
      // Recalculate metrics based on sliders with some randomization
      const randomFactor = () => (Math.random() - 0.5) * 5;
      
      const newBest = Math.min(100, Math.max(70, 90 + (officerCount / 15) - (roadClosures * 0.6) + randomFactor()));
      const newExpected = Math.min(newBest, Math.max(50, 75 + (officerCount / 25) - (roadClosures * 0.8) - (duration * 1.5) + randomFactor()));
      const newWorst = Math.min(newExpected, Math.max(20, 40 + (officerCount / 35) - (roadClosures * 1.2) - duration + randomFactor()));

      setBestCase(newBest);
      setExpectedCase(newExpected);
      setWorstCase(newWorst);

      // Other metrics
      const newPeakLoad = -20 - (officerCount * 0.1) + (roadClosures * 0.4) + randomFactor();
      setPeakLoad(newPeakLoad);

      const mins = Math.floor(2 + (officerCount * 0.02) + (roadClosures * 0.1));
      const secs = Math.floor(Math.random() * 60);
      setAvgResponse(`-${mins}m ${secs}s`);

      setEnergySaved(Math.max(0.1, 0.5 + (roadClosures * 0.08) + (rerouting ? 0.4 : 0)));
      setSafetyIndex(Math.max(-20, 5 + (officerCount * 0.08) - (duration * 0.8) + (densityCap ? 3 : 0)));

      // Randomize bar charts
      const newHeights = barHeights.map(() => Math.floor(20 + Math.random() * 70));
      setBarHeights(newHeights);

      // Regenerate grid
      generateGrid();

      setIsSimulating(false);
      alert(`Simulation run complete!\nExpected Case Flow Optimization: ${newExpected.toFixed(1)}%`);
    }, 1200);
  };

  // Replay logs action
  const handleReplayLogs = () => {
    alert("Retrieving and replay historical simulation logs from local storage...");
    setOfficerCount(142);
    setRoadClosures(8);
    setDuration(6.5);
    setRerouting(true);
    setDensityCap(false);
    generateGrid();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
        }
        .glow-button {
            transition: all 0.3s ease;
            box-shadow: 0 0 0px rgba(0, 210, 255, 0);
        }
        .glow-button:hover {
            box-shadow: 0 0 20px rgba(0, 210, 255, 0.4);
            transform: translateY(-1px);
        }
        .scanline {
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, #47d6ff, transparent);
            position: absolute;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
        }
        input:focus + .scanline {
            animation: scan 1.5s infinite linear;
        }
        @keyframes scan {
            from { transform: translateX(-100%); }
            to { transform: translateX(100%); }
        }
        .neural-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00fd9b;
            box-shadow: 0 0 10px #00fd9b;
            animation: pulse-dot 2s infinite ease-in-out;
        }
        @keyframes pulse-dot {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.4); opacity: 1; }
        }
        .custom-slider {
            -webkit-appearance: none;
            height: 4px;
            background: rgba(255,255,255,0.1);
            border-radius: 2px;
            width: 100%;
        }
        .custom-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            background: #a5e7ff;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px #a5e7ff;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
      ` }} />
      
      <div className="font-body-md text-foreground max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="page-heading text-foreground">Scenario Simulator</h1>
            <p className="text-muted-foreground mt-2 text-sm">Predicting the impact of urban interventions through the "What happens if?" neural engine.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleReplayLogs}
              className="px-5 py-2.5 rounded-full border border-border bg-white text-foreground hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-sm">history</span> REPLAY LOGS
            </button>
            <button 
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-xs hover:brightness-105 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-75"
            >
              <span className="material-symbols-outlined text-sm">{isSimulating ? "autorenew" : "play_arrow"}</span> 
              {isSimulating ? "RUNNING SIM..." : "RUN SIMULATION"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Inputs */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <section className="bg-white border border-border p-6 rounded-2xl shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Simulation Controls</h3>
                <span className="material-symbols-outlined text-muted-foreground">tune</span>
              </div>
              
              <div className="space-y-6">
                
                {/* Officer count slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">OFFICER COUNT</label>
                    <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{officerCount} Units</span>
                  </div>
                  <input 
                    className="custom-slider" 
                    max="300" 
                    min="50" 
                    type="range" 
                    value={officerCount} 
                    onChange={(e) => setOfficerCount(Number(e.target.value))}
                  />
                </div>

                {/* Road closures slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ROAD CLOSURES</label>
                    <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{roadClosures} Sectors</span>
                  </div>
                  <input 
                    className="custom-slider" 
                    max="24" 
                    min="0" 
                    type="range" 
                    value={roadClosures} 
                    onChange={(e) => setRoadClosures(Number(e.target.value))}
                  />
                </div>

                {/* Event duration slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">EVENT DURATION</label>
                    <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{duration} Hours</span>
                  </div>
                  <input 
                    className="custom-slider" 
                    max="24" 
                    min="1" 
                    step="0.5" 
                    type="range" 
                    value={duration} 
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                </div>

                {/* Checkboxes */}
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border">
                    <span className="text-xs font-bold text-foreground">Dynamic Re-routing</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        checked={rerouting} 
                        onChange={(e) => setRerouting(e.target.checked)} 
                        className="sr-only peer" 
                        type="checkbox"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border">
                    <span className="text-xs font-bold text-foreground">Crowd Density Cap</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        checked={densityCap} 
                        onChange={(e) => setDensityCap(e.target.checked)} 
                        className="sr-only peer" 
                        type="checkbox"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

              </div>
            </section>

            {/* Spatial distribution card */}
            <section className="bg-white border border-border p-6 rounded-2xl h-64 relative overflow-hidden flex flex-col justify-between shadow-sm">
              <div className="relative z-10">
                <h3 className="text-base font-bold text-foreground mb-1">Spatial Distribution</h3>
                <p className="text-[9px] font-mono font-bold text-muted-foreground uppercase">REAL-TIME HEATMAP OVERLAY</p>
              </div>
              <div className="absolute inset-0 grayscale-[0.5] opacity-25">
                <img className="w-full h-full object-cover" alt="grid map overlay" src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600"/>
              </div>
              <div className="relative z-10 flex gap-2">
                <div className="bg-white border border-border px-3 py-1 rounded-lg text-[9px] font-mono font-bold shadow-sm">
                  COORD: 12.97 / 77.59
                </div>
              </div>
            </section>
          </div>

          {/* Right Panel: Results */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Outcome cards row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white border border-border p-5 rounded-2xl border-l-4 border-l-purple-500 shadow-sm">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">BEST CASE</p>
                <h4 className="text-2xl font-bold text-purple-600 font-display">{bestCase.toFixed(1)}%</h4>
                <p className="text-xs text-muted-foreground mt-2">Flow Optimization</p>
                <div className="mt-4 flex items-center gap-1 text-purple-600 text-xs font-semibold">
                  <span className="material-symbols-outlined text-sm">trending_up</span> +14% vs Current
                </div>
              </div>

              <div className="bg-white border border-border p-5 rounded-2xl border-l-4 border-l-primary shadow-sm">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">EXPECTED CASE</p>
                <h4 className="text-2xl font-bold text-primary font-display">{expectedCase.toFixed(1)}%</h4>
                <p className="text-xs text-muted-foreground mt-2">Resource Efficiency</p>
                <div className="mt-4 flex items-center gap-1 text-primary text-xs font-semibold">
                  <span className="material-symbols-outlined text-sm">analytics</span> Optimal Threshold
                </div>
              </div>

              <div className="bg-white border border-border p-5 rounded-2xl border-l-4 border-l-destructive shadow-sm">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">WORST CASE</p>
                <h4 className="text-2xl font-bold text-destructive font-display">{worstCase.toFixed(1)}%</h4>
                <p className="text-xs text-muted-foreground mt-2">Congestion Risk</p>
                <div className="mt-4 flex items-center gap-1 text-destructive text-xs font-semibold">
                  <span className="material-symbols-outlined text-sm">warning</span> Critical Blockage
                </div>
              </div>

            </div>

            {/* Comparison graph */}
            <section className="bg-white border border-border p-8 rounded-2xl flex-grow flex flex-col shadow-sm">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Intervention Impact</h3>
                  <p className="text-xs text-muted-foreground">Comparative analysis: Baseline vs. Simulated Strategy</p>
                </div>
                <div className="flex gap-4 text-[9px] font-bold tracking-wider font-sans">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-slate-200 rounded-sm"></div>
                    <span>BASELINE</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-primary rounded-sm"></div>
                    <span className="text-primary">SIMULATED</span>
                  </div>
                </div>
              </div>

              {/* Graphic Chart */}
              <div className="flex-grow flex items-end gap-6 h-64 min-h-[220px] mb-6">
                {[
                  { time: "08:00", base: "h-[40%]", sim: barHeights[0] },
                  { time: "10:00", base: "h-[60%]", sim: barHeights[1] },
                  { time: "12:00", base: "h-[85%]", sim: barHeights[2] },
                  { time: "14:00", base: "h-[70%]", sim: barHeights[3] },
                  { time: "16:00", base: "h-[45%]", sim: barHeights[4] },
                  { time: "18:00", base: "h-[30%]", sim: barHeights[5] },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col justify-end gap-1 group h-full">
                    <div className="relative w-full h-full flex flex-col justify-end items-center">
                      {/* Baseline */}
                      <div className={`absolute bottom-0 w-2/3 bg-slate-100 rounded-t-sm ${item.base} transition-all group-hover:bg-slate-200`}></div>
                      {/* Simulated */}
                      <div 
                        style={{ height: `${item.sim}%` }} 
                        className="w-1/2 bg-primary/40 border-t-2 border-primary rounded-t-sm z-10 transition-all group-hover:bg-primary/50"
                      ></div>
                    </div>
                    <span className="text-center font-mono text-[9px] text-muted-foreground mt-4">{item.time}</span>
                  </div>
                ))}
              </div>

              {/* Metrics footers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
                <div className="p-3 bg-slate-50 border border-border rounded-xl">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">PEAK LOAD REDUCTION</p>
                  <p className="text-lg font-bold text-purple-600 mt-1">{peakLoad.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-slate-50 border border-border rounded-xl">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">AVG. RESPONSE TIME</p>
                  <p className="text-lg font-bold text-primary mt-1">{avgResponse}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-border rounded-xl">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">ENERGY SAVED</p>
                  <p className="text-lg font-bold text-purple-600 mt-1">{energySaved.toFixed(1)} GWh</p>
                </div>
                <div className="p-3 bg-slate-50 border border-border rounded-xl">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">SAFETY INDEX</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">+{safetyIndex.toFixed(1)}%</p>
                </div>
              </div>
            </section>
          </div>

        </div>

        {/* Detailed Analysis Matrix grid */}
        <section className="bg-white border border-border p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-foreground">Sector Reliability Matrix</h3>
            <div className="flex bg-slate-100 rounded-lg p-1 border border-border">
              <button className="px-4 py-1.5 rounded-md bg-white border border-border shadow-sm text-foreground text-xs font-bold transition-all">HEATMAP</button>
              <button onClick={() => alert("Tabular View: sector metrics logged in browser console.")} className="px-4 py-1.5 rounded-md text-muted-foreground hover:text-foreground text-xs font-bold transition-all">TABULAR</button>
            </div>
          </div>
          
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {gridSectors.map((sector) => (
              <div 
                key={sector.id} 
                className={`${sector.color} aspect-square rounded-lg border border-border/40 hover:scale-110 active:scale-95 transition-all cursor-crosshair relative group flex items-center justify-center`}
              >
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 text-[10px] font-mono text-white p-2 rounded border border-primary/30 z-20 pointer-events-none whitespace-nowrap leading-relaxed">
                  ID: {sector.id}<br/>VAL: {sector.val.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </>
  );
}
